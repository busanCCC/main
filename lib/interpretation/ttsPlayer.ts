/**
 * 통역 음성을 언어별 출력 단자로 내보낸다.
 *
 * 언어마다 AudioContext 를 하나씩 두고 setSinkId 로 물리 장치에 묶는다.
 * 재생 시각은 setTimeout 이 아니라 AudioContext 의 오디오 클럭으로 예약한다 —
 * 탭이 백그라운드로 가면 타이머는 스로틀링에 걸려 말이 끊기지만 오디오 클럭은 안 걸린다.
 *
 * 화자는 우리 파이프라인을 기다려 주지 않는다. 쌓이는 큐를 방치하면 지연이
 * 단조 증가해서 나중에는 몇 분 전 이야기를 하고 있게 된다. 압력에 따라
 * 정제 우회 → 배속 → 폐기 순으로 대응하고, 버릴 때는 반드시 센다.
 */

"use client";

import {
  CATCHUP_QUEUE_DEPTH,
  CATCHUP_RATE,
  DEFAULT_CHANNEL_CONFIG,
  DROP_QUEUE_DEPTH,
  TTS_PCM_SAMPLE_RATE,
  UTTERANCE_GAP_SEC,
  type ChannelConfig,
  type ChannelState,
  type ChannelStatus,
  type SpeechUnit,
} from "./ttsTypes";

/** 이만큼 앞서 예약해 두면 더 만들지 않고 기다린다. 폐기·뮤트가 즉시 먹히게 하는 상한 */
const LOOKAHEAD_SEC = 3;
/** 도착한 PCM 을 이 크기로 잘라 예약한다 (0.25초). 합성이 끝나기 전에 소리가 난다 */
const SCHEDULE_CHUNK_BYTES = TTS_PCM_SAMPLE_RATE * 2 * 0.25;
/** 예약 여유. 이보다 촉박하면 브라우저가 첫 조각을 놓친다 */
const SCHEDULE_LEAD_SEC = 0.08;

export function supportsOutputRouting(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof AudioContext !== "undefined" &&
    "setSinkId" in AudioContext.prototype
  );
}

/** s16le mono PCM → AudioBuffer */
function pcmToAudioBuffer(ctx: AudioContext, bytes: Uint8Array): AudioBuffer | null {
  const sampleCount = Math.floor(bytes.byteLength / 2);
  if (sampleCount === 0) return null;

  const view = new DataView(bytes.buffer, bytes.byteOffset, sampleCount * 2);
  const buffer = ctx.createBuffer(1, sampleCount, TTS_PCM_SAMPLE_RATE);
  const channel = buffer.getChannelData(0);

  for (let i = 0; i < sampleCount; i++) {
    channel[i] = view.getInt16(i * 2, true) / 0x8000;
  }
  return buffer;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface ChannelCallbacks {
  onStatus: (lang: string, patch: Partial<ChannelStatus>) => void;
  onLog: (message: string) => void;
  /** 초안을 세션 문맥으로 다듬는다. 예산을 넘기면 초안을 그대로 돌려줘야 한다 */
  refine: (unit: SpeechUnit) => Promise<{ text: string; timedOut: boolean }>;
}

/**
 * 큐에 들어간 발화 하나.
 *
 * 정제는 이 채널이 이 발화 차례에 도달할 때가 아니라 커밋되는 즉시 시작한다.
 * 앞 발화가 아직 합성·재생 중인 동안 돌아가므로, 실측 1.6~1.8초인 정제가
 * 실제 종단 지연에 거의 얹히지 않는다. 순차로 두면 발화마다 그대로 더해진다.
 */
interface PendingUnit {
  unit: SpeechUnit;
  refined: Promise<{ text: string; timedOut: boolean }>;
}

class TtsChannel {
  private ctx: AudioContext | null = null;
  private gain: GainNode | null = null;
  private nextTime = 0;
  private queue: PendingUnit[] = [];
  private active: AudioBufferSourceNode[] = [];
  private pumping = false;
  private disposed = false;
  private fetchAbort: AbortController | null = null;
  private dropped = 0;
  private refineTimeouts = 0;
  private state: ChannelState = "off";

  config: ChannelConfig = { ...DEFAULT_CHANNEL_CONFIG };

  constructor(
    private readonly lang: string,
    private readonly cb: ChannelCallbacks,
  ) {}

  private report(patch: Partial<ChannelStatus>) {
    if (this.disposed) return;
    this.cb.onStatus(this.lang, patch);
  }

  private setState(state: ChannelState) {
    if (this.state === state) return;
    this.state = state;
    this.report({ state });
  }

  /** 사용자 제스처 안에서 불러야 한다. 첫 소리는 그 뒤에야 날 수 있다 */
  async open(): Promise<void> {
    if (this.ctx) {
      if (this.ctx.state === "suspended") await this.ctx.resume();
      return;
    }

    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.gain.value = this.config.gain;
    gain.connect(ctx.destination);

    this.ctx = ctx;
    this.gain = gain;
    this.nextTime = ctx.currentTime;

    await this.applySink();
    if (ctx.state === "suspended") await ctx.resume();
    this.setState("idle");
  }

  private async applySink() {
    const ctx = this.ctx;
    if (!ctx) return;
    if (!("setSinkId" in ctx)) return;

    try {
      await (ctx as AudioContext & {
        setSinkId: (id: string) => Promise<void>;
      }).setSinkId(this.config.sinkDeviceId || "");
    } catch (err) {
      this.setState("error");
      this.cb.onLog(
        `${this.lang}: 출력 단자를 열지 못했습니다 — ${
          err instanceof Error ? err.message : "알 수 없는 오류"
        }`,
      );
    }
  }

  async updateConfig(next: ChannelConfig) {
    const sinkChanged = next.sinkDeviceId !== this.config.sinkDeviceId;
    this.config = next;

    if (this.gain) this.gain.gain.value = next.gain;
    if (sinkChanged && this.ctx) await this.applySink();

    if (!next.enabled) {
      this.clear();
      this.setState("off");
    } else if (this.state === "off") {
      this.setState("idle");
    }
  }

  enqueue(unit: SpeechUnit) {
    if (!this.config.enabled || this.disposed) return;

    // 이미 밀려 있으면 정제를 시작조차 하지 않는다. 어차피 못 기다린다
    const refined = this.catchingUp
      ? Promise.resolve({ text: unit.draftText, timedOut: false })
      : this.cb
          .refine(unit)
          .catch(() => ({ text: unit.draftText, timedOut: true }));

    this.queue.push({ unit, refined });
    this.applyPressure();
    this.report({ queueDepth: this.queue.length });
    void this.pump();
  }

  /**
   * 밀린 만큼 단계적으로 대응한다.
   * 실시간성이 정확도보다 먼저다 — 몇 분 전 이야기를 정확하게 읽는 건 의미가 없다.
   */
  private applyPressure() {
    if (this.queue.length <= DROP_QUEUE_DEPTH) return;

    const drop = this.queue.length - 1;
    this.queue.splice(0, drop);
    this.dropped += drop;
    this.report({ dropped: this.dropped });
    // 조용히 사라지면 원인을 못 찾는다
    this.cb.onLog(`${this.lang}: 밀려서 발화 ${drop}개 버림 (누적 ${this.dropped})`);
  }

  private get catchingUp() {
    return this.queue.length >= CATCHUP_QUEUE_DEPTH;
  }

  private async pump() {
    if (this.pumping || this.disposed) return;
    this.pumping = true;

    try {
      while (this.queue.length > 0 && !this.disposed && this.config.enabled) {
        const ctx = this.ctx;
        if (!ctx) break;

        // 너무 앞서 만들어 두면 폐기·뮤트가 늦게 먹는다
        while (
          this.nextTime - ctx.currentTime > LOOKAHEAD_SEC &&
          !this.disposed &&
          this.config.enabled
        ) {
          await sleep(120);
        }
        if (this.disposed || !this.config.enabled) break;

        this.applyPressure();
        const pending = this.queue.shift();
        if (!pending) break;

        this.report({ queueDepth: this.queue.length });
        this.setState(this.catchingUp ? "catchup" : "speaking");

        try {
          await this.speak(pending);
        } catch (err) {
          if ((err as Error)?.name !== "AbortError") {
            this.cb.onLog(
              `${this.lang}: 합성 실패 — ${
                err instanceof Error ? err.message : "알 수 없는 오류"
              }`,
            );
          }
        }
      }
    } finally {
      this.pumping = false;
      if (this.queue.length === 0 && this.config.enabled && !this.disposed) {
        this.setState("idle");
      }
    }
  }

  private async speak(pending: PendingUnit) {
    const ctx = this.ctx;
    if (!ctx || !this.gain) return;

    const { unit } = pending;

    // 커밋 때 이미 시작해 둔 정제를 거둔다. 대개 앞 발화를 재생하는 사이에 끝나 있다.
    // 밀리는 중이면 기다리지 않고 초안을 읽는다 — 정확도보다 따라잡는 게 먼저다.
    let text = unit.draftText;
    if (!this.catchingUp) {
      const refined = await pending.refined;
      text = refined.text;
      if (refined.timedOut) {
        this.refineTimeouts += 1;
        this.report({ refineTimeouts: this.refineTimeouts });
      }
    }

    this.report({ currentText: text });

    const rate = this.catchingUp
      ? Math.min(2, this.config.rate * CATCHUP_RATE)
      : this.config.rate;

    const abort = new AbortController();
    this.fetchAbort = abort;

    const res = await fetch("/api/interpretation/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice: this.config.voice, speed: 1 }),
      signal: abort.signal,
    });

    if (!res.ok || !res.body) {
      const reason = await res
        .json()
        .then((json) => json?.reason)
        .catch(() => null);
      throw new Error(reason ?? `TTS ${res.status}`);
    }

    const reader = res.body.getReader();
    let carry = new Uint8Array(0);
    let firstScheduled = false;

    const schedule = (bytes: Uint8Array) => {
      const buffer = pcmToAudioBuffer(ctx, bytes);
      if (!buffer) return;

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = rate;
      source.connect(this.gain!);

      const startAt = Math.max(ctx.currentTime + SCHEDULE_LEAD_SEC, this.nextTime);
      source.start(startAt);
      this.nextTime = startAt + buffer.duration / rate;

      this.active.push(source);
      source.onended = () => {
        this.active = this.active.filter((item) => item !== source);
      };

      if (!firstScheduled) {
        firstScheduled = true;
        // 원어가 확정된 순간부터 실제로 소리가 나기 시작할 때까지
        const lead = Math.max(0, startAt - ctx.currentTime) * 1000;
        this.report({
          latencyMs: Math.round(Date.now() - unit.firstFinalAt + lead),
        });
      }
    };

    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!value) continue;

        const merged = new Uint8Array(carry.length + value.length);
        merged.set(carry, 0);
        merged.set(value, carry.length);

        if (merged.length < SCHEDULE_CHUNK_BYTES) {
          carry = merged;
          continue;
        }

        // Int16 경계에서만 자른다. 홀수 바이트는 다음 조각으로 넘긴다
        const usable = merged.length - (merged.length % 2);
        schedule(merged.subarray(0, usable));
        carry = merged.subarray(usable);
      }

      if (carry.length >= 2) schedule(carry.subarray(0, carry.length - (carry.length % 2)));
    } finally {
      this.fetchAbort = null;
      reader.releaseLock?.();
    }

    // 발화 사이의 숨. 붙여 놓으면 한 문장처럼 들린다
    this.nextTime += UTTERANCE_GAP_SEC;
  }

  /** 밀린 것을 버리고 지금으로 점프한다 */
  clear() {
    const pending = this.queue.length;
    this.queue = [];
    this.fetchAbort?.abort();
    this.fetchAbort = null;

    for (const source of this.active) {
      try {
        source.stop();
      } catch {
        // 이미 끝난 노드
      }
    }
    this.active = [];
    if (this.ctx) this.nextTime = this.ctx.currentTime;

    this.report({ queueDepth: 0 });
    if (pending > 0) this.cb.onLog(`${this.lang}: 대기 중이던 발화 ${pending}개 비움`);
  }

  setMuted(muted: boolean) {
    if (this.gain) this.gain.gain.value = muted ? 0 : this.config.gain;
  }

  dispose() {
    this.disposed = true;
    this.clear();
    this.ctx?.close().catch(() => undefined);
    this.ctx = null;
    this.gain = null;
  }
}

export class TtsBus {
  private readonly channels = new Map<string, TtsChannel>();
  private muted = false;

  constructor(private readonly cb: ChannelCallbacks) {}

  channel(lang: string): TtsChannel {
    let channel = this.channels.get(lang);
    if (!channel) {
      channel = new TtsChannel(lang, this.cb);
      this.channels.set(lang, channel);
    }
    return channel;
  }

  async open(lang: string) {
    await this.channel(lang).open();
    this.channel(lang).setMuted(this.muted);
  }

  async updateConfig(lang: string, config: ChannelConfig) {
    await this.channel(lang).updateConfig(config);
  }

  enqueue(unit: SpeechUnit) {
    this.channel(unit.lang).enqueue(unit);
  }

  clear(lang?: string) {
    if (lang) {
      this.channels.get(lang)?.clear();
      return;
    }
    for (const channel of Array.from(this.channels.values())) channel.clear();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    for (const channel of Array.from(this.channels.values())) channel.setMuted(muted);
  }

  isMuted() {
    return this.muted;
  }

  dispose() {
    for (const channel of Array.from(this.channels.values())) channel.dispose();
    this.channels.clear();
  }
}
