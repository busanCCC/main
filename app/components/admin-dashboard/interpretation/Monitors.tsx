"use client";

interface TranscriptMonitorProps {
  text: string;
  isFinal: boolean;
}

export function TranscriptMonitor({ text, isFinal }: TranscriptMonitorProps) {
  return (
    <div className="rounded-lg border bg-card p-4 min-h-[120px]">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">현재 전사문</h3>
        <span className="text-xs text-muted-foreground">{isFinal ? "확정" : "진행 중"}</span>
      </div>
      <p className={`text-base leading-relaxed ${isFinal ? "" : "text-muted-foreground italic"}`}>
        {text || "음성 입력을 기다리는 중..."}
      </p>
    </div>
  );
}

interface TranslationMonitorProps {
  text: string;
  lang: string;
  isFinal: boolean;
}

export function TranslationMonitor({ text, lang, isFinal }: TranslationMonitorProps) {
  return (
    <div className="rounded-lg border bg-card p-4 min-h-[120px]">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">현재 번역 ({lang.toUpperCase()})</h3>
        <span className="text-xs text-muted-foreground">{isFinal ? "확정" : "진행 중"}</span>
      </div>
      <p className={`text-base leading-relaxed ${isFinal ? "" : "text-muted-foreground italic"}`}>
        {text || "번역 결과를 기다리는 중..."}
      </p>
    </div>
  );
}

interface ParticipantPanelProps {
  count: number;
}

export function ParticipantPanel({ count }: ParticipantPanelProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="text-sm font-semibold mb-1">참가자</h3>
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-xs text-muted-foreground mt-1">실시간 접속자 수 (근사치)</p>
    </div>
  );
}
