/**
 * 발화 직전에 번역 초안을 세션 문맥으로 한 번 더 본다.
 *
 * 이 층은 선택적이다. 늦거나 실패하면 콘솔이 초안을 그대로 읽는다 —
 * 정제 때문에 소리가 멈추는 일은 없어야 한다. 그래서 여기서는 실패를 던지지 않고
 * 언제나 "읽을 문장"을 돌려준다.
 *
 * 이미 소리 낸 문장은 되돌릴 수 없으므로, 고칠 기회는 여기 한 번뿐이다.
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyInterpretationAdmin } from "@/lib/interpretation/adminAuth";
import {
  buildRecentContext,
  buildStablePrefix,
  FAST_MODEL,
  getContext,
  recordDecisions,
  recordSpoken,
  refreshSummaryIfStale,
} from "@/lib/interpretation/refineContext";

type Params = { params: { id: string } };

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * 출력이 곧 지연이다. 실측에서 이유 설명을 붙이게 두면 출력 토큰이 4배로 늘고
 * 응답이 4.5초까지 갔다. 읽을 문장과 확정어만 내게 해서 1.6~1.8초로 줄였다.
 */
const MAX_TOKENS = 300;

const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["text", "changed", "decisions"],
  properties: {
    text: {
      type: "string",
      description: "실제로 소리 내어 읽을 최종 문장. 고칠 것이 없으면 초안 그대로.",
    },
    changed: { type: "boolean", description: "초안에서 무언가 고쳤는지" },
    decisions: {
      type: "array",
      description:
        "이번에 확정한 애매어 해석. 다음 발화부터 같은 선택을 강제하는 데 쓴다. 없으면 빈 배열.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["term", "chosen"],
        properties: {
          term: { type: "string" },
          chosen: { type: "string" },
        },
      },
    },
  },
} as const;

const INSTRUCTIONS = `너는 동시통역 음성 송출의 마지막 검수자다. 이미 나온 번역 초안을 소리 내어 읽기 직전이며, 한 번 읽으면 되돌릴 수 없다.

지켜야 할 것:
1. 다시 번역하지 말고 고친다. 고칠 이유가 없으면 초안을 글자 그대로 돌려준다 — 매번 새로 쓰면 세션 내내 문체가 흔들린다.
2. 원문에서 생략된 주어와, 앞 문장에 걸린 지시대명사를 직전 문맥으로 복원한다. 한국어 원문에서 가장 흔한 오역 원인이다.
3. 위에 적힌 용어·확정 번역이 있으면 반드시 그 표현을 쓴다. 일관성이 곧 정확성이다.
4. 귀로 듣는 문장을 만든다. 괄호, 각주, "(원문: …)", 대안 병기, 설명 덧붙이기 금지. 읽을 문장 하나만 남긴다.
5. 원문에 없는 내용을 채워 넣지 않는다. 모호하면 문맥상 가장 근사한 하나를 고르고 decisions 에 남긴다.
6. 초안이 이미 좋으면 changed:false 로 그대로 통과시킨다.
7. 출력을 최소로 낸다. 설명하지 말고 결과만 낸다 — 여기서 쓰는 토큰이 그대로 송출 지연이 된다.`;

function respond(text: string, changed: boolean) {
  return NextResponse.json({ ok: true, data: { text, changed, decisions: [] } });
}

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await verifyInterpretationAdmin();
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, reason: "관리자 권한이 필요합니다." },
      { status: 403 },
    );
  }

  let body: {
    lang?: string;
    sourceText?: string;
    draftText?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, reason: "잘못된 요청 본문입니다." },
      { status: 400 },
    );
  }

  const lang = body.lang?.trim() ?? "";
  const draftText = body.draftText?.trim() ?? "";
  const sourceText = body.sourceText?.trim() ?? "";

  if (!lang || !draftText) {
    return NextResponse.json(
      { ok: false, reason: "lang 과 draftText 가 필요합니다." },
      { status: 400 },
    );
  }

  const context = await getContext(params.id);

  // 정제가 꺼져 있거나 불가능해도 문맥은 계속 쌓아야 한다.
  // 나중에 켰을 때 앞부분이 비어 있으면 그 세션 내내 문맥이 얕다.
  const finish = (text: string) => {
    recordSpoken(context, { source: sourceText, spoken: text, lang });
    refreshSummaryIfStale(context);
  };

  if (!process.env.ANTHROPIC_API_KEY) {
    finish(draftText);
    return respond(draftText, false);
  }

  try {
    const client = new Anthropic();

    const message = await client.messages.create(
      {
        model: FAST_MODEL,
        max_tokens: MAX_TOKENS,
        output_config: {
          format: { type: "json_schema", schema: OUTPUT_SCHEMA },
        },
        system: [
          {
            type: "text",
            text: `${INSTRUCTIONS}\n\n${buildStablePrefix(context, lang)}`,
            // 세션 메타·용어·요약·확정 선택은 거의 변하지 않는다.
            // 캐시해 두면 비용과 첫 토큰 지연이 함께 내려간다.
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [
          {
            role: "user",
            content: [
              "# 직전 문맥 (이미 소리 내어 읽은 것)",
              buildRecentContext(context, lang),
              "",
              "# 지금 읽을 차례",
              `원문: ${sourceText || "(전사문을 맞추지 못함 — 초안만 보고 판단할 것)"}`,
              `번역 초안: ${draftText}`,
            ].join("\n"),
          },
        ],
      },
      // 클라이언트가 프리셋 예산으로 먼저 끊는다. 여기 값은 그보다 넉넉해야
      // 서버가 클라이언트보다 먼저 포기하는 일이 없다
      { timeout: 8000 },
    );

    const block = message.content.find((item) => item.type === "text");
    if (!block || block.type !== "text") {
      finish(draftText);
      return respond(draftText, false);
    }

    const parsed = JSON.parse(block.text) as {
      text?: string;
      changed?: boolean;
      decisions?: { term: string; chosen: string }[];
    };

    // 모델이 문장을 통째로 날려 먹는 경우가 최악이다. 빈 결과는 초안으로 되돌린다
    const text = parsed.text?.trim() || draftText;
    const decisions = Array.isArray(parsed.decisions) ? parsed.decisions : [];

    recordDecisions(context, decisions);
    finish(text);

    return NextResponse.json({
      ok: true,
      data: {
        text,
        changed: parsed.changed === true && text !== draftText,
        decisions,
      },
    });
  } catch (err) {
    // 정제 실패는 송출 실패가 아니다. 초안을 읽게 하고 넘어간다
    console.warn("[통역 정제] 실패 — 초안을 사용:", err);
    finish(draftText);
    return respond(draftText, false);
  }
}
