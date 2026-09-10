/**
 * 확정된 번역 조각을 "읽을 만한 발화" 하나로 묶는다.
 *
 * 스트리밍 번역의 final 은 대개 문장보다 짧은 조각이다. 조각마다 합성하면
 * 토막 난 억양이 나오고, TTS 가 문장 전체를 못 봐서 강세도 틀린다.
 *
 * 반대로 무한정 기다릴 수도 없다. maxHoldMs 는 그 상한이며, 문장이 안 끝났어도
 * 무조건 발동한다 — 지연 예산을 지키는 마지막 방어선이다.
 *
 * 중간 결과(isFinal:false)는 여기 들어오지 않는다. 확정 전 문장은 계속 갈아엎히므로
 * 읽으면 말이 뒤집힌다.
 */

import type { SpeechUnit } from "./ttsTypes";

/** 목표 언어의 문장 종결 부호 */
const SENTENCE_END = /[.!?。！？…]["'”’)\]]*\s*$/;

/**
 * 이만큼 모이면 종결 부호가 없어도 커밋한다.
 * 중국어·일본어는 같은 내용을 훨씬 적은 글자로 쓴다.
 */
const MIN_CHARS: Record<string, number> = {
  ja: 30,
  zh: 30,
  ko: 34,
};
const DEFAULT_MIN_CHARS = 60;

function minCharsFor(lang: string): number {
  const base = lang.toLowerCase().split(/[-_]/)[0];
  return MIN_CHARS[base] ?? DEFAULT_MIN_CHARS;
}

export interface SegmenterOptions {
  lang: string;
  maxHoldMs: number;
  idleMs: number;
  onCommit: (unit: SpeechUnit) => void;
}

export class SpeechSegmenter {
  private readonly lang: string;
  private readonly onCommit: (unit: SpeechUnit) => void;
  private maxHoldMs: number;
  private idleMs: number;

  private parts: string[] = [];
  private segIds: string[] = [];
  private sourceParts: string[] = [];
  private firstFinalAt = 0;
  /** 같은 세그먼트가 두 번 확정돼도 한 번만 담는다 */
  private readonly consumed = new Set<string>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private counter = 0;

  constructor(options: SegmenterOptions) {
    this.lang = options.lang;
    this.onCommit = options.onCommit;
    this.maxHoldMs = options.maxHoldMs;
    this.idleMs = options.idleMs;
  }

  /** 프리셋을 세션 도중에 바꿔도 이미 모인 조각은 유지된다 */
  setTiming(maxHoldMs: number, idleMs: number) {
    this.maxHoldMs = maxHoldMs;
    this.idleMs = idleMs;
  }

  /**
   * 확정된 번역 조각 하나를 넣는다.
   * sourceText 는 같은 id 의 확정 전사문. 못 찾았으면 빈 문자열로 넘어온다.
   */
  push(segId: string, text: string, sourceText: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (this.consumed.has(segId)) return;
    this.consumed.add(segId);

    const now = Date.now();
    if (this.parts.length === 0) this.firstFinalAt = now;

    this.parts.push(trimmed);
    this.segIds.push(segId);
    if (sourceText.trim()) this.sourceParts.push(sourceText.trim());

    const joined = this.parts.join(" ");

    // 1. 문장이 끝났다
    if (SENTENCE_END.test(joined)) {
      this.commit();
      return;
    }

    // 2. 충분히 모였다
    if (joined.length >= minCharsFor(this.lang)) {
      this.commit();
      return;
    }

    // 3·4. 무음이 이어지거나 상한에 닿으면 커밋. 둘 중 먼저 오는 쪽으로 건다
    const heldFor = now - this.firstFinalAt;
    const delay = Math.max(0, Math.min(this.idleMs, this.maxHoldMs - heldFor));
    this.arm(delay);
  }

  private arm(delay: number) {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      this.commit();
    }, delay);
  }

  /** 남은 조각을 지금 내보낸다. 세션 종료·언어 전환 시 호출한다 */
  flush() {
    if (this.parts.length > 0) this.commit();
  }

  private commit() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.parts.length === 0) return;

    const unit: SpeechUnit = {
      unitId: `${this.lang}_${this.firstFinalAt}_${this.counter++}`,
      lang: this.lang,
      segIds: [...this.segIds],
      sourceText: this.sourceParts.join(" "),
      draftText: this.parts.join(" "),
      firstFinalAt: this.firstFinalAt,
    };

    this.parts = [];
    this.segIds = [];
    this.sourceParts = [];
    this.firstFinalAt = 0;

    this.onCommit(unit);
  }

  dispose() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.parts = [];
    this.segIds = [];
    this.sourceParts = [];
    this.consumed.clear();
  }
}
