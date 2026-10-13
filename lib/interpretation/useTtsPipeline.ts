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
import { extractHistorySegments } from "./history";
import { SegmentOrderer } from "./segmentOrderer";
import { SpeechSegmenter } from "./speechSegmenter";
import { supportsOutputRouting, TtsBus, type RefineOutcome } from "./ttsPlayer";
import {
  DEFAULT_CHANNEL_CONFIG,
  TTS_PRESETS,
  type ChannelConfig,
  type ChannelStatus,
  type SpeechUnit,
  type TtsPreset,
} from "./ttsTypes";
import type { StreamTranscriptEvent, StreamTranslationEvent } from "./types";

/** 앞 문장 번역을 이만큼 기다린다. 넘기면 건너뛰고 뒤 문장을 읽는다 */
const ORDER_WAIT_MS = 3000;
/**
 * 송출을 켜기 이만큼 전보다 오래된 세그먼트는 지나간 말로 본다. 재구독 백필이
 * 낱개 이벤트로 와도 소리로 내지 않기 위한 선이다. 서버·PC 시계 차이를 감안해 넉넉히 둔다.
 */
const STALE_BEFORE_START_MS = 15_000;

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

/** 화자 말투 설명은 세션마다 다르고, 설정과 같은 이유로 이 기계에만 남긴다 */
function styleKey(sessionId: string) {
  return `interpretation-tts-style:${sessionId}`;
}

function loadStyle(sessionId: string): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(styleKey(sessionId)) ?? "";
  } catch {
    return "";
  }
}

function saveStyle(sessionId: string, style: string) {
  try {
    window.localStorage.setItem(styleKey(sessionId), style);
  } catch {
    // 저장이 안 될 뿐 이번 세션에는 적용된다
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
  /**
   * 세션이 live 인가. 이게 꺼질 때만 송출을 멈춘다. 재연결 중(ready=false)에
   * 멈추면 연결이 돌아와도 송출이 다시 켜지지 않는다. 송출 소켓은 스스로 다시 붙는다.
   */
  live: boolean;
  onLog: (message: string) => void;
}

export function useTtsPipeline({
  sessionId,
  roomId,
  targetLanguages,
  ready,
  live,
  onLog,
}: UseTtsPipelineOptions) {
  const [configs, setConfigs] = useState<Record<string, ChannelConfig>>({});
  const [statuses, setStatuses] = useState<Record<string, ChannelStatus>>({});
  const [preset, setPreset] = useState<TtsPreset>("balanced");
  const [muted, setMuted] = useState(false);
  const [running, setRunning] = useState(false);
  const [supported] = useState(() => supportsOutputRouting());
  const [speakerStyle, setSpeakerStyleState] = useState("");

  const busRef = useRef<TtsBus | null>(null);
  const socketsRef = useRef<Map<string, WebSocket>>(new Map());
  const segmentersRef = useRef<Map<string, SpeechSegmenter>>(new Map());
  /**
   * 언어별 순서 정렬기. 소켓·세그먼터와 달리 송출을 껐다 켜도 버리지 않는다 —
   * 이미 읽은 세그먼트를 기억하는 곳이 여기라서, 버리면 재구독 때 다시 읽는다.
   */
  const orderersRef = useRef<Map<string, SegmentOrderer>>(new Map());
  /** 언어별 송출 시작 시각. 이보다 오래된 세그먼트는 읽지 않는다 */
  const liveSinceRef = useRef<Map<string, number>>(new Map());
  /** 세그먼트 id → 확정 전사문. 정제가 원문을 봐야 무엇이 빠졌는지 안다 */
  const sourceTextRef = useRef<Map<string, string>>(new Map());
  const presetRef = useRef(preset);
  const configsRef = useRef(configs);
  const runningRef = useRef(false);
  const onLogRef = useRef(onLog);
  const speakerStyleRef = useRef(speakerStyle);

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
    // 다른 세션의 "이미 읽음" 기록이 넘어오면 안 된다
    for (const orderer of Array.from(orderersRef.current.values())) orderer.dispose();
    orderersRef.current.clear();
    liveSinceRef.current.clear();
    const next: Record<string, ChannelConfig> = {};
    for (const lang of langs) {
      next[lang] = { ...DEFAULT_CHANNEL_CONFIG, ...(stored[lang] ?? {}) };
    }
    configsRef.current = next;
    setConfigs(next);
    const style = loadStyle(sessionId);
    speakerStyleRef.current = style;
    setSpeakerStyleState(style);
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
    async (unit: SpeechUnit): Promise<RefineOutcome> => {
      const profile = TTS_PRESETS[presetRef.current];
      if (!profile.refine) {
        return { text: unit.draftText, delivery: "", timedOut: false };
      }

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
              fragments: unit.segIds.length,
            }),
            signal: abort.signal,
          },
        );

        const json = await res.json();
        if (!json.ok || !json.data?.text) {
          return { text: unit.draftText, delivery: "", timedOut: false };
        }
        return {
          text: json.data.text as string,
          delivery: (json.data.delivery as string | undefined) ?? "",
          timedOut: false,
        };
      } catch {
        // 취소든 네트워크 오류든 결과는 같다 — 초안을 읽는다
        return { text: unit.draftText, delivery: "", timedOut: true };
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
        getSpeakerStyle: () => speakerStyleRef.current,
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

  const ordererFor = useCallback(
    (lang: string) => {
      let orderer = orderersRef.current.get(lang);
      if (!orderer) {
        orderer = new SegmentOrderer({
          waitMs: ORDER_WAIT_MS,
          onRelease: (segId, text) =>
            segmenterFor(lang).push(
              segId,
              text,
              sourceTextRef.current.get(segId) ?? "",
            ),
          onSkip: (segId, reason) =>
            onLogRef.current(
              reason === "timeout"
                ? `${lang}: 앞 문장 번역이 오지 않아 건너뜀 (${segId})`
                : `${lang}: 순서가 지난 번역이 늦게 와서 버림 (${segId})`,
            ),
        });
        orderersRef.current.set(lang, orderer);
      }
      return orderer;
    },
    [segmenterFor],
  );

  /** 지금 이후에 말해진 것만 읽는다. 시각이 없으면 판단하지 않는다 */
  const isBeforeStart = useCallback((lang: string, at: string | undefined) => {
    const since = liveSinceRef.current.get(lang);
    if (!since || !at) return false;
    const time = Date.parse(at);
    return !Number.isNaN(time) && time < since - STALE_BEFORE_START_MS;
  }, []);

  /** 대기 중인 번역과 모인 조각을 버리고 지금으로 넘어간다 */
  const skipToNow = useCallback((lang: string) => {
    orderersRef.current.get(lang)?.skipPending();
    segmentersRef.current.get(lang)?.dispose();
    segmentersRef.current.delete(lang);
  }, []);

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

        const orderer = ordererFor(lang);

        // 백필은 이미 지나간 말이다. 소리로 내지 않고, 이후 같은 세그먼트가
        // 다시 와도 읽지 않도록 지나간 것으로 표시만 한다
        if (msg.type === "history") {
          for (const segment of extractHistorySegments(msg as Record<string, unknown>)) {
            orderer.markDone(segment.id);
          }
          return;
        }

        if (msg.type === "transcript") {
          const t = msg as unknown as StreamTranscriptEvent;
          if (!t.isFinal || !t.text) return;
          if (isBeforeStart(lang, t.at)) {
            orderer.markDone(t.id);
            return;
          }
          sourceTextRef.current.set(t.id, t.text);
          // 원문 확정 순서가 곧 읽는 순서다
          orderer.noteSource(t.id);
          return;
        }

        if (msg.type === "translation") {
          const t = msg as unknown as StreamTranslationEvent;
          if (!t.isFinal || !t.text) return;
          if (t.lang && t.lang.toLowerCase() !== lang.toLowerCase()) return;
          if (isBeforeStart(lang, t.at)) {
            orderer.markDone(t.id);
            return;
          }
          orderer.pushTranslation(t.id, t.text);
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
    [roomId, ordererFor, isBeforeStart],
  );

  /** 사용자 제스처 안에서 불러야 AudioContext 가 열린다 */
  const start = useCallback(async () => {
    if (!ready || !roomId) return;

    runningRef.current = true;
    setRunning(true);

    const bus = getBus();
    for (const [lang, config] of Object.entries(configsRef.current)) {
      if (!config.enabled) continue;
      liveSinceRef.current.set(lang, Date.now());
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
    for (const lang of Array.from(orderersRef.current.keys())) skipToNow(lang);
    busRef.current?.clear();
    onLogRef.current("음성 송출 중지");
  }, [closeSocket, skipToNow]);

  const updateChannel = useCallback(
    async (lang: string, patch: Partial<ChannelConfig>) => {
      const wasEnabled = configsRef.current[lang]?.enabled ?? false;
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
        // 보이스·배속만 바꿀 때는 시작 시각을 건드리지 않는다
        if (!wasEnabled) liveSinceRef.current.set(lang, Date.now());
        await bus.open(lang);
        await bus.updateConfig(lang, next[lang]);
        await openSocket(lang);
      } else {
        await bus.updateConfig(lang, next[lang]);
        closeSocket(lang);
        skipToNow(lang);
      }
    },
    [sessionId, getBus, openSocket, closeSocket, skipToNow, patchStatus],
  );

  const setSpeakerStyle = useCallback(
    (style: string) => {
      speakerStyleRef.current = style;
      setSpeakerStyleState(style);
      saveStyle(sessionId, style);
    },
    [sessionId],
  );

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      busRef.current?.setMuted(!prev);
      return !prev;
    });
  }, []);

  const clearQueues = useCallback(() => {
    busRef.current?.clear();
    const langs = new Set([
      ...Array.from(orderersRef.current.keys()),
      ...Array.from(segmentersRef.current.keys()),
    ]);
    for (const lang of Array.from(langs)) skipToNow(lang);
  }, [skipToNow]);

  // 세션이 끝나거나 화면을 벗어나면 소리부터 끊는다
  useEffect(() => {
    if (!live && runningRef.current) stop();
  }, [live, stop]);

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
      for (const orderer of Array.from(orderersRef.current.values())) {
        orderer.dispose();
      }
      orderersRef.current.clear();
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
    speakerStyle,
    setSpeakerStyle,
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
