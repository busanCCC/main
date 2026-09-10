"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Play, Square, Volume2, VolumeX, Trash2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";
import { getLanguageLabel } from "@/lib/interpretation/streamStats";
import {
  TTS_PRESETS,
  TTS_VOICES,
  type ChannelConfig,
  type ChannelStatus,
  type TtsPreset,
} from "@/lib/interpretation/ttsTypes";

interface AudioOutputDevice {
  deviceId: string;
  label: string;
}

interface TtsOutputPanelProps {
  supported: boolean;
  ready: boolean;
  running: boolean;
  muted: boolean;
  preset: TtsPreset;
  targetLanguages: string[];
  configs: Record<string, ChannelConfig>;
  statuses: Record<string, ChannelStatus>;
  onPresetChange: (preset: TtsPreset) => void;
  onChannelChange: (lang: string, patch: Partial<ChannelConfig>) => void;
  onStart: () => Promise<void> | void;
  onStop: () => void;
  onToggleMute: () => void;
  onClearQueues: () => void;
}

const STATE_STYLE: Record<ChannelStatus["state"], { dot: string; label: string }> = {
  off: { dot: "bg-muted-foreground/30", label: "꺼짐" },
  idle: { dot: "bg-emerald-500", label: "대기" },
  speaking: { dot: "bg-emerald-500 animate-pulse", label: "송출 중" },
  catchup: { dot: "bg-amber-500 animate-pulse", label: "따라잡는 중" },
  error: { dot: "bg-red-500", label: "오류" },
};

export function TtsOutputPanel({
  supported,
  ready,
  running,
  muted,
  preset,
  targetLanguages,
  configs,
  statuses,
  onPresetChange,
  onChannelChange,
  onStart,
  onStop,
  onToggleMute,
  onClearQueues,
}: TtsOutputPanelProps) {
  const [devices, setDevices] = useState<AudioOutputDevice[]>([]);
  const [isStarting, setIsStarting] = useState(false);

  /**
   * 출력 장치 이름은 마이크 권한을 준 뒤에만 보인다. 권한 전에는 label 이 빈
   * 문자열이라, 관리자는 "입력 시작"을 먼저 눌러야 여기서 단자를 고를 수 있다.
   */
  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const listed = await navigator.mediaDevices.enumerateDevices();
    setDevices(
      listed
        .filter((device) => device.kind === "audiooutput")
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `출력 장치 ${index + 1}`,
        })),
    );
  }, []);

  useEffect(() => {
    void refreshDevices();
    navigator.mediaDevices?.addEventListener?.("devicechange", refreshDevices);
    return () => {
      navigator.mediaDevices?.removeEventListener?.("devicechange", refreshDevices);
    };
  }, [refreshDevices]);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      await onStart();
    } finally {
      setIsStarting(false);
    }
  };

  const enabledCount = targetLanguages.filter((lang) => configs[lang]?.enabled).length;
  const unlabeled = devices.length > 0 && devices.every((device) => !device.label);

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">음성 송출</h3>
          <p className="text-xs text-muted-foreground">
            확정 번역 → 문맥 정제 → TTS → 언어별 출력 단자
          </p>
        </div>
        <div className="flex items-center gap-2">
          {running && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClearQueues}
                title="밀린 발화를 버리고 지금으로 점프"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                큐 비우기
              </Button>
              <Button
                type="button"
                variant={muted ? "default" : "outline"}
                size="sm"
                onClick={onToggleMute}
              >
                {muted ? (
                  <VolumeX className="mr-1.5 h-3.5 w-3.5" />
                ) : (
                  <Volume2 className="mr-1.5 h-3.5 w-3.5" />
                )}
                {muted ? "뮤트 해제" : "전체 뮤트"}
              </Button>
            </>
          )}
          <Button
            type="button"
            variant={running ? "destructive" : "default"}
            disabled={!supported || !ready || isStarting || (!running && enabledCount === 0)}
            onClick={running ? onStop : handleStart}
          >
            {isStarting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : running ? (
              <Square className="mr-2 h-4 w-4" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {running ? "송출 중지" : "송출 시작"}
          </Button>
        </div>
      </div>

      {!supported && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          이 브라우저는 출력 단자 지정(setSinkId)을 지원하지 않습니다. Chrome 또는 Edge 에서 열어주세요.
        </p>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">지연 프리셋</label>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(TTS_PRESETS) as TtsPreset[]).map((key) => {
            const profile = TTS_PRESETS[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => onPresetChange(key)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs transition-colors",
                  preset === key
                    ? "border-primary bg-primary/10 font-medium text-primary"
                    : "border-input text-muted-foreground hover:bg-muted",
                )}
                title={
                  profile.refine
                    ? `대기 ${profile.maxHoldMs}ms · 정제 ${profile.refineTimeoutMs}ms`
                    : `대기 ${profile.maxHoldMs}ms · 정제 없음`
                }
              >
                {profile.label}
              </button>
            );
          })}
          <span className="self-center pl-1 text-[11px] text-muted-foreground">
            {TTS_PRESETS[preset].refine
              ? `문맥 정제 켬 (${TTS_PRESETS[preset].refineTimeoutMs}ms 예산)`
              : "문맥 정제 끔 — 초안을 그대로 읽습니다"}
          </span>
        </div>
      </div>

      {devices.length === 0 || unlabeled ? (
        <p className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          출력 장치 이름은 마이크 권한을 준 뒤에 보입니다. 위의{" "}
          <strong>오디오 입력</strong>을 먼저 시작해 주세요.
        </p>
      ) : null}

      <div className="divide-y rounded-md border">
        {targetLanguages.map((lang) => {
          const config = configs[lang];
          const status = statuses[lang];
          if (!config) return null;

          const style = STATE_STYLE[status?.state ?? "off"];
          const latency = status?.latencyMs;

          return (
            <div key={lang} className="space-y-2.5 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(event) =>
                      onChannelChange(lang, { enabled: event.target.checked })
                    }
                    className="h-3.5 w-3.5 rounded border-input"
                  />
                  <span
                    className={cn("h-2 w-2 rounded-full", style.dot)}
                    aria-hidden="true"
                  />
                  {getLanguageLabel(lang)}
                </label>

                <div className="flex items-center gap-3 font-mono text-[11px] tabular-nums text-muted-foreground">
                  <span>{style.label}</span>
                  {config.enabled && (
                    <>
                      <span>큐 {status?.queueDepth ?? 0}</span>
                      <span>
                        {latency == null ? "—" : `${(latency / 1000).toFixed(1)}s`}
                      </span>
                      {(status?.dropped ?? 0) > 0 && (
                        <span className="text-amber-600">유실 {status?.dropped}</span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {config.enabled && (
                <>
                  <div className="grid gap-2 sm:grid-cols-[1fr_120px_92px]">
                    <select
                      value={config.sinkDeviceId}
                      onChange={(event) => {
                        const device = devices.find(
                          (item) => item.deviceId === event.target.value,
                        );
                        onChannelChange(lang, {
                          sinkDeviceId: event.target.value,
                          sinkLabel: device?.label ?? "",
                        });
                      }}
                      className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="">기본 출력 장치</option>
                      {devices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={config.voice}
                      onChange={(event) =>
                        onChannelChange(lang, { voice: event.target.value })
                      }
                      className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                    >
                      {TTS_VOICES.map((voice) => (
                        <option key={voice.value} value={voice.value}>
                          {voice.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={String(config.rate)}
                      onChange={(event) =>
                        onChannelChange(lang, { rate: Number(event.target.value) })
                      }
                      className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                    >
                      {[0.9, 1, 1.1, 1.2, 1.3].map((rate) => (
                        <option key={rate} value={rate}>
                          {rate.toFixed(1)}배속
                        </option>
                      ))}
                    </select>
                  </div>

                  {status?.currentText ? (
                    <p className="truncate text-xs text-muted-foreground" title={status.currentText}>
                      {status.currentText}
                    </p>
                  ) : null}
                </>
              )}
            </div>
          );
        })}
      </div>

      {!ready && (
        <p className="text-xs text-muted-foreground">
          세션이 시작되고 스트림에 연결된 뒤에 송출할 수 있습니다.
        </p>
      )}
    </div>
  );
}
