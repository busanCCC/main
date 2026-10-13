/**
 * 확정 번역을 원문이 말해진 순서대로 내보낸다.
 *
 * 번역은 세그먼트마다 걸리는 시간이 달라서 도착 순서가 말한 순서와 어긋난다.
 * 도착 순으로 읽으면 2번 문장이 1번보다 먼저 나와 말이 섞인다. 그래서 원문 확정
 * 순서를 기준 줄로 삼아, 앞 문장의 번역이 올 때까지 뒤 문장을 붙잡아 둔다.
 *
 * 무한정 기다릴 수는 없다. 뒤 문장이 준비된 채 waitMs 가 지나면 앞 문장을
 * 건너뛴다. 건너뛴 문장의 번역이 나중에 와도 읽지 않는다 — 늦게 읽으면 그게 곧 섞임이다.
 *
 * 한 번 내보내거나 건너뛴 id 는 이 객체가 살아 있는 동안 다시 나가지 않는다.
 * 재구독 백필이 같은 세그먼트를 다시 보내도 두 번 말하지 않는 근거가 이것이다.
 */

export interface SegmentOrdererOptions {
  waitMs: number;
  onRelease: (segId: string, text: string) => void;
  onSkip: (segId: string, reason: "timeout" | "late") => void;
}

export class SegmentOrderer {
  private readonly order: string[] = [];
  private readonly known = new Set<string>();
  private readonly ready = new Map<string, string>();
  private readonly done = new Set<string>();
  /** 시한에 걸려 건너뛴 것. 늦게 온 번역을 한 번만 알리려고 따로 둔다 */
  private readonly timedOut = new Set<string>();
  private cursor = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly options: SegmentOrdererOptions) {}

  /** 원문 전사가 확정됐다. 이 순서가 읽는 순서다 */
  noteSource(segId: string) {
    if (!segId || this.known.has(segId) || this.done.has(segId)) return;
    this.known.add(segId);
    this.order.push(segId);
  }

  /** 이미 지나간 것으로 표시한다. 백필처럼 소리로 내면 안 되는 세그먼트에 쓴다 */
  markDone(segId: string) {
    if (!segId) return;
    this.done.add(segId);
    this.ready.delete(segId);
  }

  pushTranslation(segId: string, text: string) {
    if (!segId) return;
    if (this.done.has(segId)) {
      // 이미 읽었거나 건너뛴 세그먼트다. 재전송·백필은 조용히 버리고,
      // 시한에 걸려 건너뛴 문장의 번역이 늦게 온 경우만 한 번 알린다
      if (this.timedOut.delete(segId)) this.options.onSkip(segId, "late");
      return;
    }

    // 원문을 못 본 세그먼트는 기준 줄에 없다. 기다릴 근거가 없으니 바로 낸다
    if (!this.known.has(segId)) {
      this.done.add(segId);
      this.options.onRelease(segId, text);
      return;
    }

    this.ready.set(segId, text);
    this.drain();
  }

  private drain() {
    while (this.cursor < this.order.length) {
      const head = this.order[this.cursor];
      if (this.done.has(head)) {
        this.cursor += 1;
        continue;
      }
      const text = this.ready.get(head);
      if (text === undefined) break;

      this.ready.delete(head);
      this.done.add(head);
      this.cursor += 1;
      this.options.onRelease(head, text);
    }

    this.clearTimer();
    // 앞 문장이 비어 있는데 뒤에 준비된 문장이 있을 때만 기다림에 시한을 건다.
    // 뒤에 아무것도 없으면 기다려도 지연이 생기지 않는다
    if (this.ready.size > 0 && this.cursor < this.order.length) {
      this.timer = setTimeout(() => {
        this.timer = null;
        const head = this.order[this.cursor];
        if (head === undefined) return;
        this.done.add(head);
        this.timedOut.add(head);
        this.cursor += 1;
        this.options.onSkip(head, "timeout");
        this.drain();
      }, this.options.waitMs);
    }
  }

  /**
   * 대기 중인 것을 모두 버리고 지금 시점으로 넘어간다. 송출 중지·큐 비우기 때 쓴다.
   * 버린 세그먼트도 done 에 남겨, 이후에 다시 와도 읽지 않는다.
   */
  skipPending() {
    this.clearTimer();
    for (let i = this.cursor; i < this.order.length; i++) {
      this.done.add(this.order[i]);
    }
    this.cursor = this.order.length;
    this.ready.clear();
  }

  private clearTimer() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  dispose() {
    this.clearTimer();
  }
}
