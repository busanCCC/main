/**
 * 전사문 파싱.
 *
 * 유튜브가 timedtext 엔드포인트를 막아둔 탓에 자막을 서버에서 그냥 긁어올 수 없다.
 * 그래서 운영진이 유튜브 "스크립트 표시" 패널에서 복사한 글을 그대로 붙여넣고,
 * 여기서 타임스탬프를 읽어 세그먼트로 자른다.
 *
 * 나중에 자체 STT 나 유료 전사 API 를 붙이면 fetchTranscriptFromProvider 만
 * 살아나고 나머지는 그대로 쓸 수 있다.
 */

/** 타임스탬프가 없는 글을 자를 때 한 덩어리의 목표 길이(글자) */
const PLAIN_TEXT_CHUNK_CHARS = 220;
/** 마지막 세그먼트에 줄 기본 길이(초). 영상 길이를 모를 때 쓴다 */
const TRAILING_SEGMENT_SECONDS = 5;

export interface TranscriptSegment {
  start_seconds: number;
  end_seconds: number;
  text: string;
}

/** 줄 맨 앞의 "0:12" / "1:02:33" / "[00:12]" / "00:12 -" 형태를 잡는다 */
const LEADING_TIMESTAMP = /^\s*[[(]?(\d{1,2}):(\d{2})(?::(\d{2}))?[\])]?\s*[-–—>:]?\s*/;

/**
 * 타임스탬프 바로 뒤에 붙어 오는 "1시간 5분 40초" 같은 낭독 표기.
 *
 * 유튜브 스크립트 패널은 시각을 두 번 담는다 — 눈에 보이는 "1:05:40" 과
 * 스크린리더용 "1시간 5분 40초". 복사하면 둘이 붙어 나오고, 낭독 표기는
 * 본문 첫 글자와도 붙는다("…40초네. 샬롬 반갑습니다").
 */
const DURATION_LABEL = /^\s*(?:(\d+)\s*시간)?\s*(?:(\d+)\s*분)?\s*(?:(\d+)\s*초)?/;

/**
 * 낭독 표기를 떼어낸다.
 *
 * 같은 시각을 가리킬 때만 지운다. 설교자가 실제로 "40초만 더" 처럼 말한
 * 대목을 잘라먹지 않기 위한 조건이다.
 */
function stripDurationLabel(text: string, expectedSeconds: number): string {
  const match = text.match(DURATION_LABEL);
  if (!match) return text;

  const [matched, hours, minutes, seconds] = match;

  // 시/분/초가 하나도 없으면 낭독 표기가 아니라 그냥 본문이다
  if (hours === undefined && minutes === undefined && seconds === undefined) {
    return text;
  }

  const labelSeconds =
    Number(hours ?? 0) * 3600 + Number(minutes ?? 0) * 60 + Number(seconds ?? 0);
  if (labelSeconds !== expectedSeconds) return text;

  return text.slice(matched.length).trim();
}

function parseTimestamp(match: RegExpMatchArray): number {
  const [, first, second, third] = match;

  // 3그룹이 있으면 h:m:s, 없으면 m:s
  if (third !== undefined) {
    return Number(first) * 3600 + Number(second) * 60 + Number(third);
  }
  return Number(first) * 60 + Number(second);
}

/**
 * 타임스탬프가 붙은 줄을 세그먼트로 만든다.
 * 유튜브 스크립트 패널은 "0:12\n본문" 처럼 줄을 나눠 복사되기도 해서,
 * 타임스탬프만 있는 줄 다음의 본문을 같은 세그먼트로 이어붙인다.
 */
function parseTimestampedLines(lines: string[]): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];

  for (const line of lines) {
    const match = line.match(LEADING_TIMESTAMP);

    if (!match) {
      // 타임스탬프 없는 줄은 직전 세그먼트에 이어 붙인다
      const previous = segments[segments.length - 1];
      if (!previous) continue;

      let text = line.trim();
      if (!text) continue;

      // 타임스탬프만 있던 줄 다음에 오는 첫 본문에도 낭독 표기가 붙어 온다
      if (previous.text.length === 0) {
        text = stripDurationLabel(text, previous.start_seconds);
      }

      previous.text = previous.text ? `${previous.text} ${text}`.trim() : text;
      continue;
    }

    const startSeconds = parseTimestamp(match);
    const text = stripDurationLabel(
      line.slice(match[0].length).trim(),
      startSeconds
    );

    segments.push({
      start_seconds: startSeconds,
      end_seconds: startSeconds + TRAILING_SEGMENT_SECONDS,
      text,
    });
  }

  // 각 세그먼트의 끝은 다음 세그먼트의 시작이다
  for (let i = 0; i < segments.length - 1; i++) {
    segments[i].end_seconds = segments[i + 1].start_seconds;
  }

  return segments.filter((segment) => segment.text.length > 0);
}

/**
 * 타임스탬프가 전혀 없는 글은 문장 단위로 모아 일정 길이로 자르고,
 * 영상 길이를 글자 수 비율로 나눠 대략의 시각을 매긴다.
 * 정확한 싱크는 아니지만 "이 대목쯤" 으로 이동하는 데는 쓸 만하다.
 */
function chunkPlainText(
  text: string,
  durationSeconds: number
): TranscriptSegment[] {
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?。？！]|다\.|요\.)\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (current && current.length + sentence.length > PLAIN_TEXT_CHUNK_CHARS) {
      chunks.push(current);
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }
  if (current) chunks.push(current);

  if (chunks.length === 0) return [];

  const totalChars = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  // 영상 길이를 모르면 분당 약 300자로 읽는다고 가정한다
  const estimatedTotal =
    durationSeconds > 0 ? durationSeconds : Math.round((totalChars / 300) * 60);

  let charsSoFar = 0;
  return chunks.map((chunk) => {
    const start = Math.round((charsSoFar / totalChars) * estimatedTotal);
    charsSoFar += chunk.length;
    const end = Math.round((charsSoFar / totalChars) * estimatedTotal);
    return { start_seconds: start, end_seconds: end, text: chunk };
  });
}

/** 제로폭 공백·BOM·word joiner — 지운다 */
const ZERO_WIDTH = /[\u200B-\u200D\u2060\uFEFF]/g;
/** NBSP, 좁은 NBSP, 전각 공백 등 — 보통 공백으로 바꾼다 */
const EXOTIC_SPACE = /[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g;

/**
 * 브라우저에서 복사한 글에 섞여 오는 보이지 않는 문자를 걷어낸다.
 *
 * 제로폭 공백류는 정규식의 \s 로 잡히지 않아서, 남아 있으면 타임스탬프와
 * 낭독 표기 사이에 끼어 파싱이 통째로 어긋난다. NBSP 는 \s 로 잡히긴 하지만
 * 보통 공백으로 바꿔 두는 편이 뒤 처리에서 안전하다.
 */
function normalizeInvisibles(raw: string): string {
  return raw.replace(ZERO_WIDTH, "").replace(EXOTIC_SPACE, " ");
}

/**
 * 붙여넣은 전사문을 세그먼트 배열로 만든다.
 * 타임스탬프가 하나라도 있으면 그것을 믿고, 없으면 길이 비율로 추정한다.
 */
export function parseTranscript(
  raw: string,
  durationSeconds = 0
): TranscriptSegment[] {
  const lines = normalizeInvisibles(raw)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const hasTimestamp = lines.some((line) => LEADING_TIMESTAMP.test(line));
  if (hasTimestamp) return parseTimestampedLines(lines);

  return chunkPlainText(lines.join(" "), durationSeconds);
}

/** 초를 "1:02:33" / "12:05" 로 */
export function formatTimestamp(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  const pad = (value: number) => String(value).padStart(2, "0");

  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${minutes}:${pad(seconds)}`;
}

/** 세그먼트를 Claude 에 넘길 한 덩어리 글로 만든다 */
export function segmentsToPromptText(segments: TranscriptSegment[]): string {
  return segments
    .map((segment) => `[${formatTimestamp(segment.start_seconds)}] ${segment.text}`)
    .join("\n");
}

export interface TranscriptProviderResult {
  ok: boolean;
  segments: TranscriptSegment[];
  reason?: string;
}

interface ProviderSegment {
  start?: number;
  offset?: number;
  start_seconds?: number;
  duration?: number;
  end?: number;
  end_seconds?: number;
  text?: string;
  content?: string;
}

/**
 * 외부 전사 서비스가 붙어 있으면(CHAPEL_TRANSCRIPT_API_URL) 먼저 그쪽에 물어본다.
 * 없으면 ok:false 로 돌려주고, 운영진이 직접 붙여넣는 흐름으로 넘어간다.
 *
 * 기대하는 응답: { segments: [{ start, duration|end, text }] } 또는 그 배열 자체.
 * 초 단위 숫자로 온다고 보고, 밀리초로 오는 서비스는 어댑터를 이 함수 안에서 맞춘다.
 */
export async function fetchTranscriptFromProvider(
  videoId: string
): Promise<TranscriptProviderResult> {
  const endpoint = process.env.CHAPEL_TRANSCRIPT_API_URL;
  if (!endpoint) {
    return {
      ok: false,
      segments: [],
      reason: "전사 서비스가 연결되어 있지 않습니다. 전사문을 직접 붙여넣어 주세요.",
    };
  }

  const apiKey = process.env.CHAPEL_TRANSCRIPT_API_KEY;

  try {
    const url = new URL(endpoint);
    url.searchParams.set("videoId", videoId);

    const response = await fetch(url.toString(), {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
    });

    if (!response.ok) {
      return {
        ok: false,
        segments: [],
        reason: `전사 서비스가 ${response.status} 로 응답했습니다. 전사문을 직접 붙여넣어 주세요.`,
      };
    }

    const body = (await response.json()) as
      | ProviderSegment[]
      | { segments?: ProviderSegment[] };
    const rawSegments = Array.isArray(body) ? body : (body.segments ?? []);

    const segments = rawSegments
      .map((segment): TranscriptSegment => {
        const start = segment.start_seconds ?? segment.start ?? segment.offset ?? 0;
        const end =
          segment.end_seconds ??
          segment.end ??
          (segment.duration != null ? start + segment.duration : start);
        return {
          start_seconds: Math.round(start),
          end_seconds: Math.round(end),
          text: (segment.text ?? segment.content ?? "").trim(),
        };
      })
      .filter((segment) => segment.text.length > 0);

    if (segments.length === 0) {
      return {
        ok: false,
        segments: [],
        reason: "전사 서비스가 빈 결과를 돌려줬습니다. 전사문을 직접 붙여넣어 주세요.",
      };
    }

    return { ok: true, segments };
  } catch (error) {
    console.error("[전사 서비스] 호출 실패:", error);
    return {
      ok: false,
      segments: [],
      reason: "전사 서비스 호출에 실패했습니다. 전사문을 직접 붙여넣어 주세요.",
    };
  }
}
