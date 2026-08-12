import Anthropic from "@anthropic-ai/sdk";
import type { ChapelSummaryDraft } from "../types";
import {
  buildUserPrompt,
  normalizeDraft,
  OUTPUT_SCHEMA,
  SYSTEM_PROMPT,
  type GenerateSummaryInput,
  type GenerateSummaryResult,
} from "../prompt";

const DEFAULT_MODEL = "claude-opus-5";
const MAX_TOKENS = 16000;

export async function generateWithAnthropic(
  input: GenerateSummaryInput
): Promise<GenerateSummaryResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, reason: "ANTHROPIC_API_KEY 가 설정되지 않았습니다." };
  }

  const model = process.env.CHAPEL_SUMMARY_MODEL || DEFAULT_MODEL;
  const client = new Anthropic();

  try {
    // 전사문이 길어 응답이 오래 걸린다. 스트리밍으로 받아 타임아웃을 피한다
    const stream = client.messages.stream({
      model,
      max_tokens: MAX_TOKENS,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "high",
        format: { type: "json_schema", schema: OUTPUT_SCHEMA },
      },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(input) }],
    });

    const message = await stream.finalMessage();

    if (message.stop_reason === "refusal") {
      return {
        ok: false,
        reason: "모델이 이 요청에 응답하지 않았습니다. 전사문을 확인해 주세요.",
      };
    }

    if (message.stop_reason === "max_tokens") {
      return {
        ok: false,
        reason:
          "요약이 길이 제한에 걸렸습니다. 전사문을 나눠서 다시 시도해 주세요.",
      };
    }

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return { ok: false, reason: "모델 응답에서 요약을 찾지 못했습니다." };
    }

    const draft = JSON.parse(textBlock.text) as ChapelSummaryDraft;
    return { ok: true, draft: normalizeDraft(draft, input.transcript) };
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return {
        ok: false,
        reason: "요청이 몰려 있습니다. 잠시 후 다시 시도해 주세요.",
      };
    }
    // APIConnectionError 가 APIError 를 상속하므로 먼저 확인한다
    if (error instanceof Anthropic.APIConnectionError) {
      return { ok: false, reason: "Claude API 에 연결하지 못했습니다." };
    }
    if (error instanceof Anthropic.APIError) {
      console.error("[채플 요약] Claude API 오류:", error.status, error.message);
      return { ok: false, reason: `요약 생성에 실패했습니다. (${error.status})` };
    }

    console.error("[채플 요약] Claude 생성 실패:", error);
    return { ok: false, reason: "요약 생성 중 오류가 발생했습니다." };
  }
}
