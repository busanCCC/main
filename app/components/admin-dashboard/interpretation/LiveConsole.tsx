"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Play, Square, Radio } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { SessionStatusBadge } from "./SessionStatusBadge";
import { MicrophoneController } from "./MicrophoneController";
import {
  ParticipantPanel,
  TranscriptMonitor,
  TranslationMonitor,
} from "./Monitors";
import { KeytermsPanel } from "./KeytermsPanel";
import {
  fetchInterpretationSession,
  fetchStreamCredentials,
  startInterpretationSession,
  stopInterpretationSession,
} from "@/lib/interpretation/clientApi";
import type {
  InterpretationSession,
  SessionStatus,
  StreamTranscriptEvent,
  StreamTranslationEvent,
} from "@/lib/interpretation/types";
import { toast } from "sonner";

interface LiveConsoleProps {
  sessionId: string;
}

export function LiveConsole({ sessionId }: LiveConsoleProps) {
  const [session, setSession] = useState<InterpretationSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [connectionState, setConnectionState] = useState<
    "idle" | "connecting" | "connected" | "error"
  >("idle");
  const [transcript, setTranscript] = useState({ text: "", isFinal: false });
  const [translation, setTranslation] = useState({
    text: "",
    lang: "en",
    isFinal: false,
  });
  const [logs, setLogs] = useState<string[]>([]);

  const adminWsRef = useRef<WebSocket | null>(null);
  const monitorWsRef = useRef<WebSocket | null>(null);
  const monitorLangRef = useRef("en");
  /**
   * connectStreams 는 자격증명을 받아오느라 await 를 한 번 거친다. 그 사이에도
   * connectionState 는 "idle" 이라 아래 이펙트가 한 번 더 들어온다 — 소켓이 두 벌
   * 열리고 뒤늦게 붙은 쪽이 방을 가로챈다. 상태가 아니라 ref 로 막는다.
   */
  const isConnectingRef = useRef(false);
  /** 방 재등록은 한 번만 시도한다. 실패가 반복되면 원인이 따로 있다 */
  const rebindAttemptedRef = useRef(false);
  /** 세션을 명시적으로 끝냈거나 화면을 벗어나면 더 잇지 않는다 */
  const shouldReconnectRef = useRef(true);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** 소켓이 닫힌 사이 버려진 마이크 청크. 조용히 사라지면 원인을 못 찾는다 */
  const droppedChunksRef = useRef(0);
  /** scheduleReconnect 와 connectStreams 가 서로를 참조하므로 ref 로 잇는다 */
  const connectStreamsRef = useRef<((roomId: string) => Promise<void>) | null>(
    null,
  );

  const appendLog = useCallback((message: string) => {
    setLogs((prev) =>
      [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev].slice(0, 50),
    );
  }, []);

  const loadSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchInterpretationSession(sessionId);
      setSession(data);
      monitorLangRef.current = data.targetLanguages[0] ?? "en";
      setTranslation((prev) => ({
        ...prev,
        lang: data.targetLanguages[0] ?? "en",
      }));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "세션 정보를 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  /**
   * 끊긴 소켓을 다시 잇는다.
   *
   * 관리자 소켓이 죽어도 마이크는 계속 돌아간다. 다시 잇지 않으면 그 오디오는
   * 전부 허공으로 나가고, 서버에는 아무것도 도착하지 않아 로그조차 남지 않는다.
   * 백오프는 RN 클라이언트와 같은 정책을 쓴다 (docs/02 §12).
   */
  const scheduleReconnect = useCallback(
    (roomId: string) => {
      if (!shouldReconnectRef.current) return;
      if (reconnectTimerRef.current) return;

      const attempt = reconnectAttemptRef.current;
      reconnectAttemptRef.current = attempt + 1;
      const backoff = Math.min(1000 * 2 ** attempt, 15_000);
      const jitter = backoff * 0.2 * (Math.random() * 2 - 1);
      const delay = Math.max(1000, Math.round(backoff + jitter));

      setConnectionState("connecting");
      appendLog(
        `${Math.round(delay / 100) / 10}초 후 재연결 시도 (${attempt + 1}회차)`,
      );

      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        // 남아 있는 반대쪽 소켓을 정리하고 통째로 다시 연다
        adminWsRef.current?.close();
        monitorWsRef.current?.close();
        adminWsRef.current = null;
        monitorWsRef.current = null;
        isConnectingRef.current = false;
        void connectStreamsRef.current?.(roomId);
      }, delay);
    },
    [appendLog],
  );

  const connectStreams = useCallback(
    async (roomId: string) => {
      if (isConnectingRef.current) return;
      isConnectingRef.current = true;
      shouldReconnectRef.current = true;
      setConnectionState("connecting");

      let creds: Awaited<ReturnType<typeof fetchStreamCredentials>>;
      try {
        creds = await fetchStreamCredentials();
      } catch (err) {
        isConnectingRef.current = false;
        setConnectionState("error");
        throw err;
      }

      const adminWs = new WebSocket(creds.streamUrl);
      adminWsRef.current = adminWs;

      adminWs.onopen = () => {
        adminWs.send(
          JSON.stringify({ type: "authenticate", token: creds.token }),
        );
        appendLog("Admin WebSocket 연결됨");
      };

      adminWs.onmessage = (event) => {
        const msg = JSON.parse(event.data as string);
        if (msg.type === "authenticated") {
          appendLog("Admin 인증 완료");
          // 인증만으로는 이 소켓이 어느 방인지 서버가 알 수 없다.
          // 이 메시지가 소켓을 방에 묶어 주며, 없으면 이후 보내는 오디오가
          // 전부 조용히 버려진다. (세션 자체는 REST 로 이미 live 상태다.)
          adminWs.send(JSON.stringify({ type: "start_session", sessionId }));
          appendLog(`Room ${roomId} 에 바인딩 요청`);
        }
        if (msg.type === "session_ended") appendLog(`세션 종료: ${msg.reason}`);
        if (msg.type === "error") {
          appendLog(`오류: ${msg.message}`);
          if (msg.code === "session_not_found") {
            // 스트림 서버는 방을 메모리에만 들고 있어서 재시작하면 잃는다.
            // DB 는 여전히 live 라 화면에는 시작 버튼도 없다 — 여기서 스스로
            // 다시 등록하지 않으면 관리자가 손쓸 방법이 없다.
            if (rebindAttemptedRef.current) {
              setConnectionState("error");
              toast.error("스트림 서버에 세션을 등록하지 못했습니다.");
              return;
            }
            rebindAttemptedRef.current = true;
            appendLog("스트림 서버에 방이 없음 → 재등록 시도");
            startInterpretationSession(sessionId)
              .then(() => {
                adminWs.send(
                  JSON.stringify({ type: "start_session", sessionId }),
                );
                appendLog("재등록 완료");
              })
              .catch((err) => {
                setConnectionState("error");
                toast.error(
                  err instanceof Error ? err.message : "재등록에 실패했습니다.",
                );
              });
          }
        }
      };

      adminWs.onerror = () => {
        setConnectionState("error");
        appendLog("Admin WebSocket 오류");
      };

      // 이 핸들러가 없어서, 소켓이 죽어도 화면은 계속 "connected" 로 남고
      // 마이크 오디오는 아래 handleAudioChunk 에서 조용히 버려졌다.
      // 서버에는 아무것도 도착하지 않으니 로그조차 남지 않는다.
      adminWs.onclose = (event) => {
        if (adminWsRef.current !== adminWs) return; // 이미 교체된 소켓
        adminWsRef.current = null;
        appendLog(`Admin WebSocket 끊김 (code ${event.code})`);
        scheduleReconnect(roomId);
      };

      const monitorWs = new WebSocket(creds.monitorStreamUrl);
      monitorWsRef.current = monitorWs;

      monitorWs.onopen = () => {
        monitorWs.send(
          JSON.stringify({
            type: "subscribe",
            roomId,
            targetLang: monitorLangRef.current,
            tts: false,
            token: creds.token,
            sinceSeq: 0,
            protocolVersion: "1.0",
          }),
        );
        setConnectionState("connected");
        reconnectAttemptRef.current = 0;
        appendLog("모니터 WebSocket 구독 시작");
      };

      monitorWs.onmessage = (event) => {
        const msg = JSON.parse(event.data as string) as
          | StreamTranscriptEvent
          | StreamTranslationEvent
          | { type: string };

        if (msg.type === "transcript") {
          const t = msg as StreamTranscriptEvent;
          setTranscript({ text: t.text, isFinal: t.isFinal });
        }
        if (msg.type === "translation") {
          const t = msg as StreamTranslationEvent;
          if (t.lang === monitorLangRef.current) {
            setTranslation({ text: t.text, lang: t.lang, isFinal: t.isFinal });
          }
        }
        if (msg.type === "ready") appendLog("모니터 ready");
        if (msg.type === "session_ended") appendLog("모니터: 세션 종료");
      };

      monitorWs.onerror = () => appendLog("모니터 WebSocket 오류");

      monitorWs.onclose = (event) => {
        if (monitorWsRef.current !== monitorWs) return;
        monitorWsRef.current = null;
        appendLog(`모니터 WebSocket 끊김 (code ${event.code})`);
        scheduleReconnect(roomId);
      };

      isConnectingRef.current = false;
    },
    [appendLog, sessionId, scheduleReconnect],
  );

  useEffect(() => {
    if (
      session?.status === "live" &&
      session.roomId &&
      connectionState === "idle"
    ) {
      connectStreams(session.roomId).catch(() => {
        toast.error("스트림 서버에 연결하지 못했습니다.");
      });
    }
  }, [session, connectionState, connectStreams]);

  useEffect(() => {
    connectStreamsRef.current = connectStreams;
  }, [connectStreams]);

  const disconnectStreams = useCallback(() => {
    // 의도한 종료다. onclose 가 재연결을 걸지 않도록 먼저 막는다.
    shouldReconnectRef.current = false;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    reconnectAttemptRef.current = 0;
    droppedChunksRef.current = 0;
    adminWsRef.current?.close();
    monitorWsRef.current?.close();
    adminWsRef.current = null;
    monitorWsRef.current = null;
    isConnectingRef.current = false;
    setConnectionState("idle");
  }, []);

  useEffect(() => () => disconnectStreams(), [disconnectStreams]);

  const handleStart = async () => {
    if (!session?.roomId) return;
    setIsStarting(true);
    try {
      await startInterpretationSession(sessionId);
      const updated = await fetchInterpretationSession(sessionId);
      setSession(updated);
      await connectStreams(updated.roomId!);
      toast.success("세션이 시작되었습니다.");
      appendLog("세션 live 상태로 전환");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "세션 시작에 실패했습니다.",
      );
    } finally {
      setIsStarting(false);
    }
  };

  const handleStop = async () => {
    setIsStopping(true);
    try {
      if (session?.id) {
        adminWsRef.current?.send(
          JSON.stringify({ type: "stop_session", sessionId: session.id }),
        );
      }
      await stopInterpretationSession(sessionId);
      disconnectStreams();
      const updated = await fetchInterpretationSession(sessionId);
      setSession(updated);
      toast.success("세션이 종료되었습니다.");
      appendLog("세션 종료");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "세션 종료에 실패했습니다.",
      );
    } finally {
      setIsStopping(false);
    }
  };

  const handleAudioChunk = useCallback(
    (chunk: ArrayBuffer) => {
      if (adminWsRef.current?.readyState === WebSocket.OPEN) {
        adminWsRef.current.send(chunk);
        return;
      }
      // 여기서 조용히 버리면 "마이크는 켜져 있는데 전사만 멈춘" 상태가 된다.
      // 서버에는 아무것도 도착하지 않으므로 서버 로그로는 절대 알 수 없다.
      droppedChunksRef.current += 1;
      if (droppedChunksRef.current % 50 === 1) {
        appendLog(`연결이 없어 음성 ${droppedChunksRef.current}개 유실 중`);
      }
    },
    [appendLog],
  );

  if (isLoading || !session) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isLive = session.status === "live";

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">{session.title}</h1>
            <SessionStatusBadge status={session.status as SessionStatus} />
          </div>
          <p className="text-muted-foreground text-sm">
            {session.speaker ? `발표자: ${session.speaker} · ` : ""}
            Room: {session.roomId}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Radio
              className={`h-3 w-3 ${connectionState === "connected" ? "text-green-500" : ""}`}
            />
            {connectionState}
          </span>
          {!isLive ? (
            <Button
              onClick={handleStart}
              disabled={isStarting || session.status === "closed"}
            >
              {isStarting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              시작
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={handleStop}
              disabled={isStopping}
            >
              {isStopping ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Square className="mr-2 h-4 w-4" />
              )}
              종료
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <MicrophoneController
            enabled={isLive && connectionState === "connected"}
            onChunk={handleAudioChunk}
          />
          <TranscriptMonitor
            text={transcript.text}
            isFinal={transcript.isFinal}
          />
          <TranslationMonitor
            text={translation.text}
            lang={translation.lang}
            isFinal={translation.isFinal}
          />
        </div>
        <div className="space-y-4">
          <KeytermsPanel session={session} onUpdated={setSession} />
          <ParticipantPanel count={session.participantCount ?? 0} />
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold mb-2">로그</h3>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {logs.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  이벤트 로그가 여기에 표시됩니다.
                </p>
              ) : (
                logs.map((log) => (
                  <p
                    key={log}
                    className="text-xs font-mono text-muted-foreground"
                  >
                    {log}
                  </p>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
