import OpenAI from "openai";
import type { ChapelSummaryDraft } from "../types";
import {
  buildUserPrompt,
  normalizeDraft,
  OUTPUT_SCHEMA,
  SYSTEM_PROMPT,
  type GenerateSummaryInput,
  type GenerateSummaryResult,
} from "../prompt";

const DEFAULT_MODEL = "gpt-5.6-terra";
/** 추론 토큰과 출력이 함께 잡아먹는 상한이라 넉넉히 둔다 */
const MAX_COMPLETION_TOKENS = 16000;

export async function generateWithOpenAI(
  input: GenerateSummaryInput
): Promise<GenerateSummaryResult> {
  if (!process.env.OPENAI_API_KEY) {
    return { ok: false, reason: "OPENAI_API_KEY 가 설정되지 않았습니다." };
  }

  const model = process.env.CHAPEL_SUMMARY_MODEL || DEFAULT_MODEL;
  const client = new OpenAI();

  try {
    const completion = await client.chat.completions.create({
      model,
      max_completion_tokens: MAX_COMPLETION_TOKENS,
      reasoning_effort: "high",
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "chapel_summary",
          strict: true,
          schema: OUTPUT_SCHEMA,
        },
      },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(input) },
      ],
    });

    const choice = completion.choices[0];
    if (!choice) {
      return { ok: false, reason: "모델 응답이 비어 있습니다." };
    }

    if (choice.finish_reason === "length") {
      return {
        ok: false,
        reason:
          "요약이 길이 제한에 걸렸습니다. 전사문을 나눠서 다시 시도해 주세요.",
      };
    }

    if (choice.finish_reason === "content_filter") {
      return {
        ok: false,
        reason: "모델이 이 요청에 응답하지 않았습니다. 전사문을 확인해 주세요.",
      };
    }

    // strict 모드라도 모델이 거절하면 content 대신 refusal 이 온다
    if (choice.message.refusal) {
      console.error("[채플 요약] OpenAI 거절:", choice.message.refusal);
      return {
        ok: false,
        reason: "모델이 이 요청에 응답하지 않았습니다. 전사문을 확인해 주세요.",
      };
    }

    const content = choice.message.content;
    if (!content) {
      return { ok: false, reason: "모델 응답에서 요약을 찾지 못했습니다." };
    }

    const draft = JSON.parse(content) as ChapelSummaryDraft;
    return { ok: true, draft: normalizeDraft(draft, input.transcript) };
  } catch (error) {
    if (error instanceof OpenAI.RateLimitError) {
      return {
        ok: false,
        reason: "요청이 몰려 있습니다. 잠시 후 다시 시도해 주세요.",
      };
    }
    // APIConnectionError 가 APIError 를 상속하므로 먼저 확인한다
    if (error instanceof OpenAI.APIConnectionError) {
      return { ok: false, reason: "OpenAI API 에 연결하지 못했습니다." };
    }
    if (error instanceof OpenAI.APIError) {
      console.error("[채플 요약] OpenAI API 오류:", error.status, error.message);
      return { ok: false, reason: `요약 생성에 실패했습니다. (${error.status})` };
    }

    console.error("[채플 요약] OpenAI 생성 실패:", error);
    return { ok: false, reason: "요약 생성 중 오류가 발생했습니다." };
  }
}
