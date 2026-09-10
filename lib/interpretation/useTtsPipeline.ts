/**
 * 통역 음성 송출 파이프라인.
 *
 *   언어별 /client/ws → 확정 번역 → SpeechSegmenter → 문맥 정제 → TtsBus → 단자
 *
 * 언어마다 소켓을 따로 여는 이유가 있다. 모니터 소켓은 한 번에 한 언어만 보고,
 * 언어를 바꾸는 set_language 는 프로토콜상 기존 번역문과 오디오 큐를 비운다 —
 * 동시 송출과는 정반대 동작이다.
 *
 * 소켓은 송출을 켠 언어에만 연다. 꺼 둔 언어까지 붙으면 참가자 집계에
 * 유령이 한 명씩 늘고, 서버 부하도 그만큼 는다.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchStreamCredentials } from "./clientApi";
import { SpeechSegmenter } from "./speechSegmenter";
import { supportsOutputRouting, TtsBus } from "./ttsPlayer";
import {
  DEFAULT_CHANNEL_CONFIG,
  TTS_PRESETS,
  type ChannelConfig,
  type ChannelStatus,
  type SpeechUnit,
  type TtsPreset,
} from "./ttsTypes";
import type { StreamTranscriptEvent, StreamTranslationEvent } from "./types";

function storageKey(sessionId: string) {
  return `interpretation-tts:${sessionId}`;
}

/**
 * 출력 장치 id 는 브라우저·머신마다 다르다. DB 에 넣으면 다른 PC 에서
 * 엉뚱한 잭으로 나가므로 이 기계에만 남긴다.
 */
function loadConfigs(sessionId: string): Record<string, ChannelConfig> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(storageKey(sessionId));
    return raw ? (JSON.parse(raw) as Record<string, ChannelConfig>) : {};
  } catch {
    return {};
  }
}

function saveConfigs(sessionId: string, configs: Record<string, ChannelConfig>) {
  try {
    window.localStorage.setItem(storageKey(sessionId), JSON.stringify(configs));
  } catch {
    // 사생활 보호 모드 등 — 설정이 안 남을 뿐 송출은 돌아간다
  }
}

function emptyStatus(lang: string, config: ChannelConfig): ChannelStatus {
  return {
    lang,
    enabled: config.enabled,
    state: config.enabled ? "idle" : "off",
    currentText: "",
    queueDepth: 0,
    latencyMs: null,
    dropped: 0,
    refineTimeouts: 0,
    sinkDeviceId: config.sinkDeviceId,
    sinkLabel: config.sinkLabel,
    voice: config.voice,
    rate: config.rate,
    gain: config.gain,
  };
}

interface UseTtsPipelineOptions {
  sessionId: string;
  roomId: string | undefined;
  targetLanguages: string[];
  /** 세션이 live 이고 관리자 스트림이 붙어 있을 때만 송출할 수 있다 */
  ready: boolean;
  onLog: (message: string) => void;
}

export function useTtsPipeline({
  sessionId,
  roomId,
  targetLanguages,
  ready,
  onLog,
}: UseTtsPipelineOptions) {
  const [configs, setConfigs] = useState<Record<string, ChannelConfig>>({});
  const [statuses, setStatuses] = useState<Record<string, ChannelStatus>>({});
  const [preset, setPreset] = useState<TtsPreset>("balanced");
  const [muted, setMuted] = useState(false);
  const [running, setRunning] = useState(false);
  const [supported] = useState(() => supportsOutputRouting());

  const busRef = useRef<TtsBus | null>(null);
  const socketsRef = useRef<Map<string, WebSocket>>(new Map());
  const segmentersRef = useRef<Map<string, SpeechSegmenter>>(new Map());
  /** 세그먼트 id → 확정 전사문. 정제가 원문을 봐야 무엇이 빠졌는지 안다 */
  const sourceTextRef = useRef<Map<string, string>>(new Map());
  const presetRef = useRef(preset);
  const configsRef = useRef(configs);
  const runningRef = useRef(false);
  const onLogRef = useRef(onLog);

  useEffect(() => {
    presetRef.current = preset;
    for (const segmenter of Array.from(segmentersRef.current.values())) {
      segmenter.setTiming(
        TTS_PRESETS[preset].maxHoldMs,
        TTS_PRESETS[preset].idleMs,
      );
    }
  }, [preset]);

  useEffect(() => {
    configsRef.current = configs;
  }, [configs]);

  useEffect(() => {
    onLogRef.current = onLog;
  }, [onLog]);

  // 세션이 바뀌면 이 기계에 저장해 둔 단자 설정을 되살린다.
  // 배열을 그대로 의존성에 걸면 session 객체가 새로 올 때마다 설정이 초기화된다
  const langKey = targetLanguages.join(",");
  useEffect(() => {
    const langs = langKey ? langKey.split(",") : [];
    const stored = loadConfigs(sessionId);
    const next: Record<string, ChannelConfig> = {};
    for (const lang of langs) {
      next[lang] = { ...DEFAULT_CHANNEL_CONFIG, ...(stored[lang] ?? {}) };
    }
    configsRef.current = next;
    setConfigs(next);
    setStatuses(
      Object.fromEntries(langs.map((lang) => [lang, emptyStatus(lang, next[lang])])),
    );
  }, [sessionId, langKey]);

  const patchStatus = useCallback(
    (lang: string, patch: Partial<ChannelStatus>) => {
      setStatuses((prev) => ({
        ...prev,
        [lang]: { ...(prev[lang] ?? emptyStatus(lang, DEFAULT_CHANNEL_CONFIG)), ...patch },
      }));
    },
    [],
  );

  /**
   * 초안을 세션 문맥으로 다듬는다.
   *
   * 예산을 넘기면 요청을 버리고 초안을 그대로 읽는다. 정제는 있으면 좋은 층이지
   * 필수 경로가 아니다 — 여기서 기다리면 소리가 멈춘다.
   */
  const refine = useCallback(
    async (unit: SpeechUnit): Promise<{ text: string; timedOut: boolean }> => {
      const profile = TTS_PRESETS[presetRef.current];
      if (!profile.refine) return { text: unit.draftText, timedOut: false };

      const abort = new AbortController();
      const timer = setTimeout(() => abort.abort(), profile.refineTimeoutMs);

      try {
        const res = await fetch(
          `/api/interpretation/sessions/${sessionId}/refine`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lang: unit.lang,
              sourceText: unit.sourceText,
              draftText: unit.draftText,
            }),
            signal: abort.signal,
          },
        );

        const json = await res.json();
        if (!json.ok || !json.data?.text) {
          return { text: unit.draftText, timedOut: false };
        }
        return { text: json.data.text as string, timedOut: false };
      } catch {
        // 취소든 네트워크 오류든 결과는 같다 — 초안을 읽는다
        return { text: unit.draftText, timedOut: true };
      } finally {
        clearTimeout(timer);
      }
    },
    [sessionId],
  );

  const getBus = useCallback(() => {
    if (!busRef.current) {
      busRef.current = new TtsBus({
        onStatus: patchStatus,
        onLog: (message) => onLogRef.current(message),
        refine,
      });
    }
    return busRef.current;
  }, [patchStatus, refine]);

  const segmenterFor = useCallback(
    (lang: string) => {
      let segmenter = segmentersRef.current.get(lang);
      if (!segmenter) {
        const profile = TTS_PRESETS[presetRef.current];
        segmenter = new SpeechSegmenter({
          lang,
          maxHoldMs: profile.maxHoldMs,
          idleMs: profile.idleMs,
          onCommit: (unit) => getBus().enqueue(unit),
        });
        segmentersRef.current.set(lang, segmenter);
      }
      return segmenter;
    },
    [getBus],
  );

  const closeSocket = useCallback((lang: string) => {
    const socket = socketsRef.current.get(lang);
    if (socket) {
      socketsRef.current.delete(lang);
      socket.onclose = null;
      socket.close();
    }
    segmentersRef.current.get(lang)?.dispose();
    segmentersRef.current.delete(lang);
  }, []);

  const openSocket = useCallback(
    async (lang: string) => {
      if (!roomId) return;
      if (socketsRef.current.has(lang)) return;

      const creds = await fetchStreamCredentials();
      // await 사이에 꺼졌을 수 있다
      if (!runningRef.current || !configsRef.current[lang]?.enabled) return;
      if (socketsRef.current.has(lang)) return;

      const socket = new WebSocket(creds.monitorStreamUrl);
      socketsRef.current.set(lang, socket);

      socket.onopen = () => {
        socket.send(
          JSON.stringify({
            type: "subscribe",
            roomId,
            targetLang: lang,
            // 오디오는 이 콘솔이 직접 합성한다. 서버 오디오까지 받으면 두 번 말한다
            tts: false,
            token: creds.token,
            sinceSeq: 0,
            protocolVersion: "1.0",
          }),
        );
        onLogRef.current(`${lang} 송출 소켓 구독`);
      };

      socket.onmessage = (event) => {
        let msg: { type?: string };
        try {
          msg = JSON.parse(event.data as string);
        } catch {
          return;
        }

        // 백필은 이미 지나간 말이다. 화면은 채우되 소리로는 내지 않는다
        if (msg.type === "history") return;

        if (msg.type === "transcript") {
          const t = msg as unknown as StreamTranscriptEvent;
          if (t.isFinal && t.text) sourceTextRef.current.set(t.id, t.text);
          return;
        }

        if (msg.type === "translation") {
          const t = msg as unknown as StreamTranslationEvent;
          if (!t.isFinal) return;
          if (t.lang && t.lang.toLowerCase() !== lang.toLowerCase()) return;
          segmenterFor(lang).push(
            t.id,
            t.text,
            sourceTextRef.current.get(t.id) ?? "",
          );
        }
      };

      socket.onerror = () => onLogRef.current(`${lang} 송출 소켓 오류`);

      socket.onclose = () => {
        if (socketsRef.current.get(lang) !== socket) return;
        socketsRef.current.delete(lang);
        onLogRef.current(`${lang} 송출 소켓 끊김`);
        // 관리자 소켓과 같은 정책으로 다시 잇는다
        if (runningRef.current && configsRef.current[lang]?.enabled) {
          setTimeout(() => void openSocket(lang), 2000);
        }
      };
    },
    [roomId, segmenterFor],
  );

  /** 사용자 제스처 안에서 불러야 AudioContext 가 열린다 */
  const start = useCallback(async () => {
    if (!ready || !roomId) return;

    runningRef.current = true;
    setRunning(true);

    const bus = getBus();
    for (const [lang, config] of Object.entries(configsRef.current)) {
      if (!config.enabled) continue;
      await bus.open(lang);
      await bus.updateConfig(lang, config);
      await openSocket(lang);
    }
    onLogRef.current("음성 송출 시작");
  }, [ready, roomId, getBus, openSocket]);

  const stop = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    for (const lang of Array.from(socketsRef.current.keys())) closeSocket(lang);
    busRef.current?.clear();
    onLogRef.current("음성 송출 중지");
  }, [closeSocket]);

  const updateChannel = useCallback(
    async (lang: string, patch: Partial<ChannelConfig>) => {
      const next = {
        ...configsRef.current,
        [lang]: { ...(configsRef.current[lang] ?? DEFAULT_CHANNEL_CONFIG), ...patch },
      };
      configsRef.current = next;
      setConfigs(next);
      saveConfigs(sessionId, next);
      patchStatus(lang, {
        enabled: next[lang].enabled,
        sinkDeviceId: next[lang].sinkDeviceId,
        sinkLabel: next[lang].sinkLabel,
        voice: next[lang].voice,
        rate: next[lang].rate,
        gain: next[lang].gain,
      });

      if (!runningRef.current) return;

      const bus = getBus();
      if (next[lang].enabled) {
        await bus.open(lang);
        await bus.updateConfig(lang, next[lang]);
        await openSocket(lang);
      } else {
        await bus.updateConfig(lang, next[lang]);
        closeSocket(lang);
      }
    },
    [sessionId, getBus, openSocket, closeSocket, patchStatus],
  );

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      busRef.current?.setMuted(!prev);
      return !prev;
    });
  }, []);

  const clearQueues = useCallback(() => {
    busRef.current?.clear();
    for (const segmenter of Array.from(segmentersRef.current.values())) {
      segmenter.dispose();
    }
    segmentersRef.current.clear();
  }, []);

  // 세션이 끝나거나 화면을 벗어나면 소리부터 끊는다
  useEffect(() => {
    if (!ready && runningRef.current) stop();
  }, [ready, stop]);

  useEffect(
    () => () => {
      runningRef.current = false;
      for (const lang of Array.from(socketsRef.current.keys())) {
        const socket = socketsRef.current.get(lang);
        if (socket) {
          socket.onclose = null;
          socket.close();
        }
      }
      socketsRef.current.clear();
      for (const segmenter of Array.from(segmentersRef.current.values())) {
        segmenter.dispose();
      }
      segmentersRef.current.clear();
      busRef.current?.dispose();
      busRef.current = null;
    },
    [],
  );

  /** 참가자 집계에서 빼야 할 내 소켓들 */
  const selfLangs = Object.entries(configs)
    .filter(([, config]) => config.enabled)
    .map(([lang]) => lang);

  return {
    supported,
    running,
    muted,
    preset,
    setPreset,
    configs,
    statuses,
    selfLangs,
    start,
    stop,
    updateChannel,
    toggleMute,
    clearQueues,
  };
}
