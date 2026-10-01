/**
 * 콘솔 히스토리. 세그먼트 id 하나가 원문·번역 한 쌍이 된다.
 *
 * 스트림 서버는 같은 id 로 진행 중(isFinal:false) 결과를 여러 번 고쳐 보내다
 * 확정본을 보낸다. 그래서 id 로 덮어쓰며, 처음 나타난 순서를 유지한다.
 * 재접속하면 sinceSeq:0 백필이 같은 id 를 다시 보내므로 이것이 곧 중복 제거다.
 */

import type { StreamTranscriptEvent, StreamTranslationEvent } from "./types";

export interface HistoryEntry {
  id: string;
  source: string;
  sourceFinal: boolean;
  translation: string;
  translationFinal: boolean;
  /** 처음 도착한 시각(스트림 서버 기준). 없으면 받은 시각 */
  at: string;
}

/** 1시간 설교가 300쌍 안팎이다. 이보다 길면 오래된 것부터 버린다 */
export const MAX_HISTORY = 2000;

function upsert(
  entries: HistoryEntry[],
  id: string,
  at: string | undefined,
  patch: Partial<HistoryEntry>,
): HistoryEntry[] {
  const index = entries.findIndex((entry) => entry.id === id);
  if (index >= 0) {
    const current = entries[index];
    // 순서가 뒤집혀 도착한 진행 중 결과가 확정본을 덮으면 안 된다
    if (patch.sourceFinal === false && current.sourceFinal) return entries;
    if (patch.translationFinal === false && current.translationFinal) return entries;
    const next = entries.slice();
    next[index] = { ...current, ...patch };
    return next;
  }

  const created: HistoryEntry = {
    id,
    source: "",
    sourceFinal: false,
    translation: "",
    translationFinal: false,
    at: at ?? new Date().toISOString(),
    ...patch,
  };
  const next = [...entries, created];
  return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
}

export function applyTranscript(
  entries: HistoryEntry[],
  event: StreamTranscriptEvent,
): HistoryEntry[] {
  if (!event.id || !event.text) return entries;
  return upsert(entries, event.id, event.at, {
    source: event.text,
    sourceFinal: event.isFinal,
  });
}

export function applyTranslation(
  entries: HistoryEntry[],
  event: StreamTranslationEvent,
  lang: string,
): HistoryEntry[] {
  if (!event.id || !event.text) return entries;
  if (event.lang && event.lang.toLowerCase() !== lang.toLowerCase()) return entries;
  return upsert(entries, event.id, event.at, {
    translation: event.text,
    translationFinal: event.isFinal,
  });
}

/** 백필 항목 하나. 한 세그먼트의 원문과 구독 언어 번역이 함께 온다 */
export interface HistorySegment {
  id: string;
  seq?: number;
  transcript?: string;
  translation?: string;
  isFinal?: boolean;
  at?: string;
}

/**
 * 구독 직후 오는 백필("history" 메시지의 segments).
 * 확정된 세그먼트만 담기며, 진행 중인 것은 들어오지 않는다.
 */
export function extractHistorySegments(message: Record<string, unknown>): HistorySegment[] {
  const segments = message.segments;
  if (!Array.isArray(segments)) return [];
  return segments.filter(
    (item): item is HistorySegment =>
      !!item && typeof (item as HistorySegment).id === "string",
  );
}

/** 백필을 기록에 합친다. 이미 있는 세그먼트는 실시간으로 받은 쪽을 믿는다 */
export function applyHistorySegments(
  entries: HistoryEntry[],
  segments: HistorySegment[],
): HistoryEntry[] {
  let next = entries;
  // seq 는 세그먼트가 생긴 순서다. 말한 순서대로 쌓는다
  const ordered = segments
    .slice()
    .sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
  for (const segment of ordered) {
    if (next.some((entry) => entry.id === segment.id)) continue;
    next = upsert(next, segment.id, segment.at, {
      source: segment.transcript ?? "",
      sourceFinal: true,
      translation: segment.translation ?? "",
      translationFinal: !!segment.translation,
    });
  }
  return next;
}
