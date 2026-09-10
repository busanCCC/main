/**
 * 통역 음성 송출(TTS)에서 오가는 값들.
 *
 * 파이프라인은 한 방향이다:
 *   translation 이벤트 → SpeechUnit(§커밋) → RefineResult(§정제) → PCM(§합성) → 단자
 * 각 단계의 산출물이 여기 정의돼 있다.
 */

/** 지연과 자연스러움을 맞바꾸는 세 칸. 세션 도중에도 바꿀 수 있다. */
export type TtsPreset = "low-latency" | "balanced" | "accurate";

export interface PresetProfile {
  label: string;
  /** 첫 조각이 들어온 뒤 이만큼 지나면 문장이 안 끝났어도 커밋한다 */
  maxHoldMs: number;
  /** 마지막 확정 이후 이만큼 조용하면 커밋한다 */
  idleMs: number;
  /** 문맥 정제를 쓸지 */
  refine: boolean;
  /** 정제에 허용하는 시간. 넘기면 초안을 그대로 읽는다 */
  refineTimeoutMs: number;
}

export const TTS_PRESETS: Record<TtsPreset, PresetProfile> = {
  "low-latency": {
    label: "저지연",
    maxHoldMs: 400,
    idleMs: 300,
    refine: false,
    refineTimeoutMs: 0,
  },
  balanced: {
    label: "균형",
    maxHoldMs: 900,
    idleMs: 450,
    refine: true,
    /**
     * 실측 1.9~2.7s (haiku, 출력 20~64토큰).
     *
     * 커밋 즉시 시작해 앞 발화 재생과 겹치므로 이 값이 종단 지연에 그대로
     * 얹히지는 않는다 — 첫 발화에서만 온전히 드러난다. 넉넉히 잡아도
     * 안전한 이유는 큐가 밀리면(CATCHUP_QUEUE_DEPTH) 정제를 아예 건너뛰기 때문이다.
     */
    refineTimeoutMs: 3000,
  },
  accurate: {
    label: "정확도",
    maxHoldMs: 1800,
    idleMs: 700,
    refine: true,
    refineTimeoutMs: 5000,
  },
};

/** 커밋된 발화 하나. 이 단위로 합성하고 이 단위로 버린다. */
export interface SpeechUnit {
  unitId: string;
  lang: string;
  /** 이 발화를 이루는 세그먼트 id 들 */
  segIds: string[];
  /**
   * 원문. 번역문만 보고는 무엇이 빠졌는지 알 수 없어 정제 단계가 이걸 같이 본다.
   * 전사 세그먼트를 못 맞춘 경우 빈 문자열일 수 있다.
   */
  sourceText: string;
  /** 스트림 서버가 준 번역 초안 */
  draftText: string;
  /** 첫 조각이 확정된 시각(ms). 종단 지연은 여기서부터 잰다 */
  firstFinalAt: number;
}

/** 정제 결과. 실패하거나 늦으면 이 값 없이 초안을 그대로 읽는다. */
export interface RefineResult {
  text: string;
  changed: boolean;
  /** 이 세션에서 확정한 애매어 선택. 다음 발화부터 강제된다 */
  decisions: { term: string; chosen: string }[];
}

export type ChannelState = "off" | "idle" | "speaking" | "catchup" | "error";

/** 콘솔 패널이 언어별로 그리는 한 줄 */
export interface ChannelStatus {
  lang: string;
  enabled: boolean;
  state: ChannelState;
  /** 지금 읽고 있는(또는 마지막으로 읽은) 문장 */
  currentText: string;
  /** 대기 중인 발화 수 */
  queueDepth: number;
  /** 원어 확정 → 재생 시작까지 걸린 시간(ms). 아직 없으면 null */
  latencyMs: number | null;
  /** 이 세션에서 버린 발화 수 */
  dropped: number;
  /** 정제가 제시간에 못 온 횟수 */
  refineTimeouts: number;
  sinkDeviceId: string;
  sinkLabel: string;
  voice: string;
  rate: number;
  gain: number;
}

export interface ChannelConfig {
  enabled: boolean;
  sinkDeviceId: string;
  sinkLabel: string;
  voice: string;
  rate: number;
  gain: number;
}

export const DEFAULT_CHANNEL_CONFIG: ChannelConfig = {
  enabled: false,
  sinkDeviceId: "",
  sinkLabel: "",
  voice: "alloy",
  rate: 1,
  gain: 1,
};

/** OpenAI TTS 보이스. 언어와 무관하게 쓸 수 있다. */
export const TTS_VOICES = [
  { value: "alloy", label: "Alloy (중성)" },
  { value: "echo", label: "Echo (남성)" },
  { value: "fable", label: "Fable (남성)" },
  { value: "onyx", label: "Onyx (저음 남성)" },
  { value: "nova", label: "Nova (여성)" },
  { value: "shimmer", label: "Shimmer (여성)" },
] as const;

/** OpenAI TTS 의 raw PCM 출력 규격 — s16le, mono */
export const TTS_PCM_SAMPLE_RATE = 24000;

/** 발화 사이의 숨. 붙여 놓으면 한 문장처럼 들린다 */
export const UTTERANCE_GAP_SEC = 0.12;

/** 큐가 이만큼 쌓이면 정제를 끄고 속도를 올려 따라잡는다 */
export const CATCHUP_QUEUE_DEPTH = 3;
/** 이만큼 넘으면 오래된 것부터 버린다 */
export const DROP_QUEUE_DEPTH = 4;
/** 따라잡을 때의 재생 배속 */
export const CATCHUP_RATE = 1.15;
