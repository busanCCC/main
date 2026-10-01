"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { HistoryEntry } from "@/lib/interpretation/history";
import { getLanguageLabel } from "@/lib/interpretation/streamStats";

interface InterpretationHistoryProps {
  entries: HistoryEntry[];
  lang: string;
}

/** 바닥에서 이만큼 안쪽이면 "따라가는 중"으로 본다 */
const FOLLOW_THRESHOLD_PX = 48;

function formatTime(at: string) {
  const date = new Date(at);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/**
 * 전사·번역 히스토리.
 *
 * 맨 아래를 보고 있으면 새 문장을 따라 내려가고, 위로 올려 지난 문장을 읽는
 * 중이면 화면을 붙잡아 둔다 — 읽는 도중 글이 밀려 올라가면 아무것도 못 읽는다.
 */
export function InterpretationHistory({ entries, lang }: InterpretationHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [following, setFollowing] = useState(true);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setFollowing(el.scrollHeight - el.scrollTop - el.clientHeight < FOLLOW_THRESHOLD_PX);
  };

  const jumpToLatest = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setFollowing(true);
  };

  // 내용이 바뀔 때마다(진행 중 문장이 고쳐질 때 포함) 따라가는 중이면 바닥에 붙인다
  useEffect(() => {
    const el = scrollRef.current;
    if (el && following) el.scrollTop = el.scrollHeight;
  }, [entries, following]);

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">전사 · 번역 기록</h3>
          <p className="text-xs text-muted-foreground">
            원문 → {getLanguageLabel(lang)} · {entries.length}문장
          </p>
        </div>
        {!following && entries.length > 0 && (
          <button
            type="button"
            onClick={jumpToLatest}
            className="rounded-md border border-input px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted"
          >
            최신으로 ↓
          </button>
        )}
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-[28rem] overflow-y-auto px-4 py-2"
      >
        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            음성 입력을 기다리는 중...
          </p>
        ) : (
          <ol className="divide-y">
            {entries.map((entry) => (
              <li key={entry.id} className="grid gap-1 py-2.5">
                <div className="flex items-baseline gap-2">
                  <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                    {formatTime(entry.at)}
                  </span>
                  <p
                    className={cn(
                      "text-sm leading-relaxed",
                      !entry.sourceFinal && "italic text-muted-foreground",
                    )}
                  >
                    {entry.source || "…"}
                  </p>
                </div>
                <p
                  className={cn(
                    "pl-[4.25rem] text-sm leading-relaxed text-primary",
                    !entry.translationFinal && "italic opacity-60",
                  )}
                >
                  {entry.translation || (entry.sourceFinal ? "번역 중…" : "")}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
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
  // 세션 대상 언어가 아닌 언어로 듣고 있는 사람도 있다. 그 줄이 빠지면
  // 언어별 합이 전체와 어긋나 보인다.
  const languages = [
    ...targetLanguages,
    ...Object.keys(byLanguage).filter(
      (lang) => !targetLanguages.includes(lang) && (byLanguage[lang] ?? 0) > 0,
    ),
  ];
  const accounted = languages.reduce(
    (sum, lang) => sum + (byLanguage[lang] ?? 0),
    0,
  );
  const others = Math.max(0, total - accounted);

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
        {languages.map((lang) => {
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
                  style={{
                    width: `${Math.max(ratio * 100, count > 0 ? 8 : 0)}%`,
                  }}
                />
              </div>
            </div>
          );
        })}

        {others > 0 ? (
          <p className="text-xs text-muted-foreground pt-1">
            그 외 {others}명
          </p>
        ) : null}
      </div>
    </div>
  );
}
