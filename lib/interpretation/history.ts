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
    const next = entries.slice();
    next[index] = { ...next[index], ...patch };
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

/**
 * 구독 직후 오는 백필. 프로토콜 문서에 묶음 필드 이름이 정해져 있지 않아
 * 흔한 이름을 차례로 본다. 하나도 없으면 아무것도 하지 않는다.
 */
export function extractHistoryEvents(message: Record<string, unknown>): unknown[] {
  for (const key of ["events", "items", "messages", "entries", "history", "data"]) {
    const value = message[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}
