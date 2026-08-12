/** Deepgram Nova-3 keyterm — 요청당 최대 100개 */
export const MAX_KEYTERMS = 100;
const MIN_TERM_LEN = 2;

/** 줄바꿈·쉼표로 구분된 입력을 배열로 변환 */
export function parseKeytermsInput(raw: string): string[] {
  return raw
    .split(/[,，\n]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** 중복 제거·길이 제한 후 저장/전송용 배열 */
export function normalizeKeyterms(terms: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const term of terms) {
    const trimmed = term.trim();
    if (trimmed.length < MIN_TERM_LEN) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
    if (result.length >= MAX_KEYTERMS) break;
  }

  return result;
}

export function formatKeytermsForInput(terms: string[] | undefined | null): string {
  return (terms ?? []).join("\n");
}

/** 기존 입력과 불러온 키워드를 합친다 (중복·100개 제한 적용) */
export function mergeKeytermsInput(current: string, imported: string[]): string {
  return formatKeytermsForInput(
    normalizeKeyterms([...parseKeytermsInput(current), ...imported]),
  );
}
