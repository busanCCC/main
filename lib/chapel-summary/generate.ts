/**
 * 전사문을 모델에 넘겨 채플 요약 초안을 만든다.
 *
 * 만들어진 값은 그대로 게시되지 않는다. 관리자 웹의 폼에 채워지고,
 * 운영진이 확인·수정한 뒤 저장한다.
 *
 * 어느 모델을 쓸지는 CHAPEL_SUMMARY_PROVIDER 로 고른다. 프롬프트와 출력
 * 스키마는 prompt.ts 에 함께 두어, 두 모델의 결과를 같은 조건에서 비교할 수 있다.
 */

import { generateWithAnthropic } from "./providers/anthropic";
import { generateWithOpenAI } from "./providers/openai";
import type { GenerateSummaryInput, GenerateSummaryResult } from "./prompt";

export type { GenerateSummaryInput, GenerateSummaryResult };

export type SummaryProvider = "anthropic" | "openai";

const DEFAULT_PROVIDER: SummaryProvider = "openai";

const PROVIDERS: Record<
  SummaryProvider,
  (input: GenerateSummaryInput) => Promise<GenerateSummaryResult>
> = {
  anthropic: generateWithAnthropic,
  openai: generateWithOpenAI,
};

function resolveProvider(): SummaryProvider {
  const configured = process.env.CHAPEL_SUMMARY_PROVIDER?.trim().toLowerCase();
  if (configured === "openai" || configured === "anthropic") return configured;

  if (configured) {
    console.warn(
      `[채플 요약] 알 수 없는 CHAPEL_SUMMARY_PROVIDER: ${configured} — ${DEFAULT_PROVIDER} 를 씁니다.`
    );
  }
  return DEFAULT_PROVIDER;
}

export async function generateChapelSummary(
  input: GenerateSummaryInput
): Promise<GenerateSummaryResult> {
  if (input.transcript.length === 0) {
    return { ok: false, reason: "전사문이 비어 있습니다." };
  }

  return PROVIDERS[resolveProvider()](input);
}
