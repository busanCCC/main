/** 채플 일시로부터 주제 / 노출 기간 기본값을 계산한다. */

/**
 * 달력 주 기준(일요일 시작) 월 내 주차.
 * 그 달 1일이 포함된 주가 1째주다.
 * 예) 2026-08-01(토) → 1째주, 2026-08-02(일) → 2째주
 */
export function getWeekOfMonth(date: Date): number {
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  return Math.ceil((date.getDate() + firstDayOfMonth.getDay()) / 7);
}

/** 채플 일시로부터 기본 주제 문자열을 만든다. */
export function buildDefaultChapelTopic(date: Date): string {
  return `${date.getMonth() + 1}월 ${getWeekOfMonth(date)}째주 지구채플`;
}

/**
 * datetime-local 값("2026-08-12T19:00")으로부터 기본 주제를 만든다.
 * 값이 비었거나 파싱 불가면 null.
 */
export function buildDefaultChapelTopicFromDatetime(
  datetime: string | null | undefined
): string | null {
  if (!datetime?.trim()) return null;
  const date = new Date(datetime);
  if (Number.isNaN(date.getTime())) return null;
  return buildDefaultChapelTopic(date);
}

/** Date를 로컬 기준 "YYYY-MM-DD"로 (toISOString은 UTC로 밀리므로 사용하지 않는다) */
function toDateInputValue(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export interface ChapelActivePeriod {
  /** 노출 시작일 — 해당 주 월요일 */
  activeFrom: string;
  /** 노출 종료일 — 해당 주 금요일 */
  activeUntil: string;
}

/**
 * 채플 일시가 속한 주(주제 주차와 동일하게 일요일 시작)의 월요일 ~ 금요일.
 * 예) 2026-08-12(수) → 2026-08-10(월) ~ 2026-08-14(금)
 */
export function buildDefaultActivePeriod(date: Date): ChapelActivePeriod {
  const sunday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
  const monday = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + 1);
  const friday = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + 5);

  return {
    activeFrom: toDateInputValue(monday),
    activeUntil: toDateInputValue(friday),
  };
}

/**
 * datetime-local 값으로부터 노출 기간 기본값을 만든다.
 * 값이 비었거나 파싱 불가면 null.
 */
export function buildDefaultActivePeriodFromDatetime(
  datetime: string | null | undefined
): ChapelActivePeriod | null {
  if (!datetime?.trim()) return null;
  const date = new Date(datetime);
  if (Number.isNaN(date.getTime())) return null;
  return buildDefaultActivePeriod(date);
}
