"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { PCM_SAMPLE_RATE } from "@/lib/interpretation/constants";

interface MicrophoneControllerProps {
  enabled: boolean;
  onChunk: (chunk: ArrayBuffer) => void;
}

function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return output.buffer;
}

function downsampleBuffer(buffer: Float32Array, inputRate: number, outputRate: number): Float32Array {
  if (outputRate === inputRate) return buffer;
  const ratio = inputRate / outputRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    result[i] = buffer[Math.floor(i * ratio)] ?? 0;
  }
  return result;
}

export function MicrophoneController({ enabled, onChunk }: MicrophoneControllerProps) {
  const [isActive, setIsActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopMic = useCallback(() => {
    processorRef.current?.disconnect();
    processorRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsActive(false);
  }, []);

  const startMic = useCallback(async () => {
    if (!enabled || isActive) return;
    setIsStarting(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        const input = event.inputBuffer.getChannelData(0);
        const downsampled = downsampleBuffer(input, audioContext.sampleRate, PCM_SAMPLE_RATE);
        onChunk(floatTo16BitPCM(downsampled));
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
      setIsActive(true);
    } catch {
      setError("마이크 접근 권한이 필요합니다.");
    } finally {
      setIsStarting(false);
    }
  }, [enabled, isActive, onChunk]);

  useEffect(() => {
    if (!enabled && isActive) stopMic();
  }, [enabled, isActive, stopMic]);

  useEffect(() => () => stopMic(), [stopMic]);

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">마이크</h3>
          <p className="text-xs text-muted-foreground">PCM 16kHz Mono → Stream Server</p>
        </div>
        <Button
          type="button"
          variant={isActive ? "destructive" : "default"}
          disabled={!enabled || isStarting}
          onClick={isActive ? stopMic : startMic}
        >
          {isStarting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : isActive ? (
            <MicOff className="mr-2 h-4 w-4" />
          ) : (
            <Mic className="mr-2 h-4 w-4" />
          )}
          {isActive ? "마이크 중지" : "마이크 시작"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!enabled && (
        <p className="text-xs text-muted-foreground">세션을 시작한 후 마이크를 사용할 수 있습니다.</p>
      )}
    </div>
  );
}
