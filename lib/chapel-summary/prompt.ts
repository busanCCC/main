/**
 * 요약 생성에 쓰는 프롬프트와 출력 스키마.
 *
 * 모델 제공자(Anthropic / OpenAI)가 달라져도 "무엇을 만들라고 시키는가" 는
 * 같아야 두 모델의 결과를 나란히 비교할 수 있다. 그래서 프롬프트와 스키마는
 * 여기 한곳에 두고, 제공자별 파일은 호출 방법만 다르게 갖는다.
 */

import type { ChapelSummaryDraft, TranscriptSegment } from "./types";
import { segmentsToPromptText } from "./transcript";

/** 목차는 이 개수를 넘지 않게 한다. 앱 화면에서 훑어볼 수 있는 분량 */
export const MAX_CHAPTERS = 8;

export const SYSTEM_PROMPT = `당신은 한국 대학생 선교단체(CCC)의 채플 설교를 정리하는 편집자입니다.
설교 전사문을 읽고, 채플에 오지 못했거나 다시 되새기고 싶은 학생이
5분 안에 설교의 핵심을 붙잡을 수 있는 요약을 만듭니다.

지켜야 할 것:
- 전사문에 실제로 나온 내용만 씁니다. 설교자가 하지 않은 말을 지어내지 않습니다.
- 성경 구절은 전사문에서 실제로 인용되거나 언급된 것만 적습니다.
  확인되지 않으면 빈 문자열로 둡니다.
- 말투는 학생에게 건네는 담백한 존댓말입니다. 과장이나 감탄사는 쓰지 않습니다.
- 타임스탬프(start_seconds)는 전사문에 표시된 [분:초] 를 초로 환산한 값이며,
  그 대목이 실제로 시작하는 지점이어야 합니다.
- 적용 질문은 "예/아니오"로 끝나지 않는, 스스로를 돌아보게 하는 질문으로 씁니다.
- 액션 포인트는 이번 한 주 안에 실제로 해볼 수 있을 만큼 구체적이어야 합니다.
  ("기도한다" 가 아니라 "매일 아침 10분, 이번 학기 만나는 한 사람을 위해 기도한다")`;

/**
 * 두 제공자가 함께 쓰는 JSON Schema.
 *
 * OpenAI 의 strict 모드는 모든 object 에 additionalProperties:false 와
 * 전체 속성의 required 를 요구한다. Anthropic 도 같은 형태를 받으므로
 * 하나로 맞춰 둔다.
 */
export const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "요약 카드에 쓰일 제목. 설교의 핵심을 담은 한 줄, 30자 이내",
    },
    topic: {
      type: "string",
      description: "채플 주제. 설교가 다룬 한 가지 주제를 짧게",
    },
    messenger: {
      type: "string",
      description: "설교자 이름과 호칭. 전사문에서 확인되지 않으면 빈 문자열",
    },
    scripture_reference: {
      type: "string",
      description:
        '본문 말씀 구절. 예: "요한복음 3:16-18". 확인되지 않으면 빈 문자열',
    },
    scripture_text: {
      type: "string",
      description:
        "본문 말씀의 내용. 전사문에서 낭독된 부분을 옮깁니다. 없으면 빈 문자열",
    },
    summary: {
      type: "string",
      description:
        "설교 전체를 관통하는 핵심 요약 본문. 3~5문단, 각 문단은 2~4문장",
    },
    key_points: {
      type: "array",
      description: "설교의 핵심 포인트 3~5개. 각 항목은 한 문장",
      items: { type: "string" },
    },
    chapters: {
      type: "array",
      description: `설교의 흐름을 나눈 목차. ${MAX_CHAPTERS}개 이하`,
      items: {
        type: "object",
        properties: {
          start_seconds: {
            type: "integer",
            description: "이 대목이 시작하는 영상 시각(초)",
          },
          title: { type: "string", description: "이 대목의 제목. 20자 이내" },
          summary: {
            type: "string",
            description: "이 대목에서 다룬 내용. 1~2문장",
          },
        },
        required: ["start_seconds", "title", "summary"],
        additionalProperties: false,
      },
    },
    application_questions: {
      type: "array",
      description: "한 주 동안 스스로에게 물어볼 질문 3~4개",
      items: { type: "string" },
    },
    action_points: {
      type: "array",
      description: "이번 한 주 삶에서 실천할 액션 포인트 2~4개",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "실천할 일. 한 줄, 25자 이내" },
          detail: {
            type: "string",
            description: "언제 어떻게 할지 구체적으로. 1~2문장",
          },
        },
        required: ["title", "detail"],
        additionalProperties: false,
      },
    },
  },
  required: [
    "title",
    "topic",
    "messenger",
    "scripture_reference",
    "scripture_text",
    "summary",
    "key_points",
    "chapters",
    "application_questions",
    "action_points",
  ],
  additionalProperties: false,
} as const;

export interface GenerateSummaryInput {
  transcript: TranscriptSegment[];
  videoTitle?: string;
  /** 관리자가 미리 알고 있는 값. 있으면 힌트로 넘긴다 */
  knownMessenger?: string;
  knownTopic?: string;
  chapelDate?: string;
}

export type GenerateSummaryResult =
  | { ok: true; draft: ChapelSummaryDraft }
  | { ok: false; reason: string };

export function buildUserPrompt(input: GenerateSummaryInput): string {
  const hints: string[] = [];
  if (input.videoTitle) hints.push(`영상 제목: ${input.videoTitle}`);
  if (input.chapelDate) hints.push(`채플 날짜: ${input.chapelDate}`);
  if (input.knownMessenger) hints.push(`메신저(운영진 입력): ${input.knownMessenger}`);
  if (input.knownTopic) hints.push(`주제(운영진 입력): ${input.knownTopic}`);

  const hintBlock =
    hints.length > 0 ? `<참고정보>\n${hints.join("\n")}\n</참고정보>\n\n` : "";

  return `${hintBlock}<전사문>
${segmentsToPromptText(input.transcript)}
</전사문>

위 채플 설교 전사문을 읽고 요약을 만들어 주세요.
각 대목의 start_seconds 는 전사문에 표시된 [분:초] 를 초로 환산한 값을 쓰세요.`;
}

/** 스키마가 보장하는 모양이라도, 빈 항목과 이상한 타임스탬프는 여기서 걸러낸다 */
export function normalizeDraft(
  draft: ChapelSummaryDraft,
  transcript: TranscriptSegment[]
): ChapelSummaryDraft {
  const lastSecond =
    transcript.length > 0
      ? transcript[transcript.length - 1].end_seconds
      : Number.POSITIVE_INFINITY;

  return {
    ...draft,
    key_points: draft.key_points.map((point) => point.trim()).filter(Boolean),
    application_questions: draft.application_questions
      .map((question) => question.trim())
      .filter(Boolean),
    action_points: draft.action_points.filter((point) => point.title.trim()),
    chapters: draft.chapters
      .filter((chapter) => chapter.title.trim())
      .map((chapter) => ({
        ...chapter,
        start_seconds: Math.max(
          0,
          Math.min(Math.round(chapter.start_seconds), lastSecond)
        ),
      }))
      .sort((a, b) => a.start_seconds - b.start_seconds)
      .slice(0, MAX_CHAPTERS),
  };
}
