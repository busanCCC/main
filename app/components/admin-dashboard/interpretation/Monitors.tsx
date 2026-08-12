"use client";

import { getLanguageLabel } from "@/lib/interpretation/streamStats";

interface TranscriptMonitorProps {
  text: string;
  isFinal: boolean;
}

export function TranscriptMonitor({ text, isFinal }: TranscriptMonitorProps) {
  return (
    <div className="rounded-lg border bg-card p-4 min-h-[120px]">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">현재 전사문</h3>
        <span className="text-xs text-muted-foreground">
          {isFinal ? "확정" : "진행 중"}
        </span>
      </div>
      <p
        className={`text-base leading-relaxed ${isFinal ? "" : "text-muted-foreground italic"}`}
      >
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

export function TranslationMonitor({
  text,
  lang,
  isFinal,
}: TranslationMonitorProps) {
  return (
    <div className="rounded-lg border bg-card p-4 min-h-[120px]">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          현재 번역 ({getLanguageLabel(lang)})
        </h3>
        <span className="text-xs text-muted-foreground">
          {isFinal ? "확정" : "진행 중"}
        </span>
      </div>
      <p
        className={`text-base leading-relaxed ${isFinal ? "" : "text-muted-foreground italic"}`}
      >
        {text || "번역 결과를 기다리는 중..."}
      </p>
    </div>
  );
}

interface ParticipantPanelProps {
  total: number;
  byLanguage: Record<string, number>;
  targetLanguages: string[];
}

export function ParticipantPanel({
  total,
  byLanguage,
  targetLanguages,
}: ParticipantPanelProps) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">실시간 참가자</h3>
          <p className="text-xs text-muted-foreground mt-1">
            언어별 청취 인원 (실시간)
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold leading-none">{total}</p>
          <p className="text-[11px] text-muted-foreground mt-1">전체</p>
        </div>
      </div>

      <div className="space-y-2">
        {targetLanguages.map((lang) => {
          const count = byLanguage[lang] ?? 0;
          const ratio = total > 0 ? count / total : 0;

          return (
            <div key={lang} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">{getLanguageLabel(lang)}</span>
                <span className="text-muted-foreground tabular-nums">
                  {count}명
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${Math.max(ratio * 100, count > 0 ? 8 : 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
