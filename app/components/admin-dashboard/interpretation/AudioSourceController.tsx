"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Mic, MicOff, Monitor, Volume2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";
import {
  computeAudioLevel,
  downsampleBuffer,
  floatTo16BitPCM,
  mixToMono,
  PCM_SAMPLE_RATE,
} from "@/lib/interpretation/audioProcessing";

export type AudioSourceMode = "microphone" | "tab";

interface AudioInputDevice {
  deviceId: string;
  label: string;
}

interface AudioSourceControllerProps {
  enabled: boolean;
  onChunk: (chunk: ArrayBuffer) => void;
}

function AudioLevelMeter({ level }: { level: number }) {
  const bars = 16;
  const activeBars = Math.round(level * bars);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Volume2 className="h-3.5 w-3.5" />
          입력 레벨
        </span>
        <span>{Math.round(level * 100)}%</span>
      </div>
      <div className="flex h-8 items-end gap-1 rounded-md border bg-muted/30 px-2 py-1.5">
        {Array.from({ length: bars }).map((_, index) => {
          const isActive = index < activeBars;
          const ratio = index / bars;
          return (
            <div
              key={index}
              className={cn(
                "flex-1 rounded-sm transition-all duration-75",
                isActive
                  ? ratio > 0.82
                    ? "bg-red-500"
                    : ratio > 0.55
                      ? "bg-amber-400"
                      : "bg-emerald-500"
                  : "bg-muted-foreground/20",
              )}
              style={{ height: `${Math.max(18, ((index + 1) / bars) * 100)}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}

export function AudioSourceController({
  enabled,
  onChunk,
}: AudioSourceControllerProps) {
  const [sourceMode, setSourceMode] = useState<AudioSourceMode>("microphone");
  const [devices, setDevices] = useState<AudioInputDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);
  const [sourceLabel, setSourceLabel] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const levelRafRef = useRef<number | null>(null);

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;

    const listed = await navigator.mediaDevices.enumerateDevices();
    const inputs = listed
      .filter((device) => device.kind === "audioinput")
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `마이크 ${index + 1}`,
      }));

    setDevices(inputs);
    if (inputs.length > 0 && !selectedDeviceId) {
      setSelectedDeviceId(inputs[0].deviceId);
    }
  }, [selectedDeviceId]);

  const stopLevelMeter = useCallback(() => {
    if (levelRafRef.current !== null) {
      cancelAnimationFrame(levelRafRef.current);
      levelRafRef.current = null;
    }
    setLevel(0);
  }, []);

  const stopCapture = useCallback(() => {
    stopLevelMeter();
    processorRef.current?.disconnect();
    processorRef.current = null;
    analyserRef.current?.disconnect();
    analyserRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsActive(false);
    setSourceLabel(null);
  }, [stopLevelMeter]);

  const startLevelMeter = useCallback((analyser: AnalyserNode) => {
    const tick = () => {
      setLevel(computeAudioLevel(analyser));
      levelRafRef.current = requestAnimationFrame(tick);
    };
    levelRafRef.current = requestAnimationFrame(tick);
  }, []);

  const attachStream = useCallback(
    (stream: MediaStream, label: string) => {
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const trackSettings = stream.getAudioTracks()[0]?.getSettings();
      const inputChannels = Math.min(Math.max(trackSettings?.channelCount ?? 2, 1), 2);

      const processor = audioContext.createScriptProcessor(4096, inputChannels, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        const input = mixToMono(event.inputBuffer);
        const downsampled = downsampleBuffer(
          input,
          audioContext.sampleRate,
          PCM_SAMPLE_RATE,
        );
        onChunk(floatTo16BitPCM(downsampled));
      };

      const silentGain = audioContext.createGain();
      silentGain.gain.value = 0;

      source.connect(analyser);
      analyser.connect(processor);
      processor.connect(silentGain);
      silentGain.connect(audioContext.destination);

      stream.getAudioTracks().forEach((track) => {
        track.addEventListener("ended", () => {
          stopCapture();
          setError("공유가 종료되어 입력을 중지했습니다.");
        });
      });

      startLevelMeter(analyser);
      setSourceLabel(label);
      setIsActive(true);
    },
    [onChunk, startLevelMeter, stopCapture],
  );

  const startCapture = useCallback(async () => {
    if (!enabled || isActive) return;

    setIsStarting(true);
    setError(null);

    try {
      if (sourceMode === "tab") {
        if (!navigator.mediaDevices.getDisplayMedia) {
          throw new Error("이 브라우저는 탭/화면 공유를 지원하지 않습니다.");
        }

        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        if (stream.getAudioTracks().length === 0) {
          stream.getTracks().forEach((track) => track.stop());
          throw new Error(
            "오디오가 포함되지 않았습니다. 공유 창에서 '탭/창 오디오'를 켜주세요.",
          );
        }

        stream.getVideoTracks().forEach((track) => {
          track.enabled = false;
        });

        attachStream(stream, "Chrome 탭 / 화면 오디오");
        return;
      }

      const constraints: MediaStreamConstraints = {
        audio: {
          // 외장 오디오 인터페이스는 스테레오로 캡처한 뒤 전송 직전에 모노로 믹스한다.
          channelCount: { ideal: 2 },
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          ...(selectedDeviceId
            ? { deviceId: { exact: selectedDeviceId } }
            : {}),
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const device =
        devices.find((item) => item.deviceId === selectedDeviceId) ??
        devices[0];
      attachStream(stream, device?.label ?? "마이크");
      await refreshDevices();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "오디오 입력을 시작하지 못했습니다.";
      setError(message);
      stopCapture();
    } finally {
      setIsStarting(false);
    }
  }, [
    attachStream,
    devices,
    enabled,
    isActive,
    refreshDevices,
    selectedDeviceId,
    sourceMode,
    stopCapture,
  ]);

  useEffect(() => {
    if (enabled) {
      void refreshDevices();
    }
  }, [enabled, refreshDevices]);

  useEffect(() => {
    if (!enabled && isActive) stopCapture();
  }, [enabled, isActive, stopCapture]);

  useEffect(() => () => stopCapture(), [stopCapture]);

  useEffect(() => {
    if (isActive) stopCapture();
    // sourceMode/device 변경 시 재시작은 사용자가 직접
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceMode, selectedDeviceId]);

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">오디오 입력</h3>
          <p className="text-xs text-muted-foreground">
            스테레오 캡처 → 16kHz Mono PCM → Stream Server
          </p>
          {sourceLabel && isActive && (
            <p className="text-xs text-emerald-600 mt-1">{sourceLabel}</p>
          )}
        </div>
        <Button
          type="button"
          variant={isActive ? "destructive" : "default"}
          disabled={!enabled || isStarting}
          onClick={isActive ? stopCapture : startCapture}
        >
          {isStarting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : isActive ? (
            <MicOff className="mr-2 h-4 w-4" />
          ) : sourceMode === "tab" ? (
            <Monitor className="mr-2 h-4 w-4" />
          ) : (
            <Mic className="mr-2 h-4 w-4" />
          )}
          {isActive ? "입력 중지" : "입력 시작"}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            입력 소스
          </label>
          <select
            value={sourceMode}
            disabled={isActive}
            onChange={(event) =>
              setSourceMode(event.target.value as AudioSourceMode)
            }
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="microphone">마이크 / 외장 오디오</option>
            <option value="tab">Chrome 탭 / 화면 공유</option>
          </select>
        </div>

        {sourceMode === "microphone" && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              오디오 장치
            </label>
            <select
              value={selectedDeviceId}
              disabled={isActive || devices.length === 0}
              onChange={(event) => setSelectedDeviceId(event.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {devices.length === 0 ? (
                <option value="">장치를 찾을 수 없습니다</option>
              ) : (
                devices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))
              )}
            </select>
          </div>
        )}
      </div>

      {sourceMode === "tab" && !isActive && (
        <p className="text-xs text-muted-foreground rounded-md bg-muted/40 px-3 py-2">
          시작 후 공유 대화상자에서 <strong>Chrome 탭</strong>을 선택하고
          하단의 <strong>탭 오디오도 공유</strong> 옵션을 켜주세요.
        </p>
      )}

      <AudioLevelMeter level={isActive ? level : 0} />

      {error && <p className="text-sm text-destructive">{error}</p>}
      {!enabled && (
        <p className="text-xs text-muted-foreground">
          세션을 시작한 후 오디오 입력을 사용할 수 있습니다.
        </p>
      )}
    </div>
  );
}
