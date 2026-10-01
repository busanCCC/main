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
  required: ["text", "delivery", "changed", "decisions"],
  properties: {
    text: {
      type: "string",
      description: "실제로 소리 내어 읽을 최종 문장. 고칠 것이 없으면 초안 그대로.",
    },
    delivery: {
      type: "string",
      description:
        "TTS 성우에게 줄 영어 연기 지시 한 줄(25단어 이내). 원문 화자의 감정·어조·강세·속도를 담는다.",
    },
    changed: { type: "boolean", description: "초안에서 무언가 고쳤는지" },
    decisions: {
      type: "array",
      description:
        "고유명사·전문용어의 번역어를 새로 정했을 때만. 다음 발화부터 강제된다. 문법·연결 처리는 넣지 않는다. 대부분 빈 배열.",
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
1. 원문 기준으로 뜻이 틀렸거나 빠진 부분이 있으면 반드시 바로잡는다. 초안이 정확하면 글자 그대로 돌려준다 — 이유 없이 새로 쓰면 세션 내내 문체가 흔들린다.
1-1. 초안이 여러 조각을 따로따로 번역해 이어 붙인 것이면(아래에 조각 수가 적힌다) 문맥이 끊겨 있다. 예: "Years after." / "Ruth" / "Ruth didn't know Boaz" → "년 후. 룻 룻은 보아스를 몰랐습니다." 이때는 초안을 고치지 말고, 원문 전체를 직전 문맥에 이어지는 한 덩어리 말로 보고 처음부터 다시 번역한다. 조각 경계에서 생긴 반복·끊긴 단어·엉뚱한 해석을 없앤다.
2. 원문에서 생략된 주어와, 앞 문장에 걸린 지시대명사를 직전 문맥으로 복원한다. 한국어 원문에서 가장 흔한 오역 원인이다.
3. 위에 적힌 용어·확정 번역이 있으면 반드시 그 표현을 쓴다. 일관성이 곧 정확성이다.
4. 귀로 듣는 문장을 만든다. 괄호, 각주, "(원문: …)", 대안 병기, 설명 덧붙이기 금지. 읽을 문장 하나만 남긴다.
5. 원문에 없는 내용을 채워 넣지 않는다. 모호하면 문맥상 가장 근사한 하나를 고른다. 그것이 고유명사·전문용어라면 decisions 에 {term: 원어, chosen: 번역어} 로만 남긴다 — 설명·괄호 금지, 시제·어순·조각 연결 같은 처리는 남기지 않는다.
6. 화자의 말투를 살린다. 설교·강연의 호소, 반문, 감탄, 반복 강조 같은 수사는 목표 언어에서도 같은 힘으로 들리게 옮긴다.
7. 번역투를 없앤다. 그 언어 원어민 연사가 청중 앞에서 실제로 할 법한 구어 문장으로 다듬는다 — 영어라면 축약형(we're, it's)을 쓰고, 딱딱한 문어 어순·명사형 나열·"~하는 것이다"식 직역을 풀어 쓴다. 뜻은 바꾸지 않는다.
8. delivery 에는 이 문장을 원문 화자처럼 읽기 위한 영어 연기 지시를 쓴다. 감정(예: earnest, joyful, grave), 강도, 속도, 강세를 둘 단어를 짧게. 예: "Warm and earnest, building intensity; stress 'grace'; slight pause before the last clause." 문맥에서 알 수 없으면 앞 문장들의 어조를 이어간다.
9. 출력을 최소로 낸다. 설명하지 말고 결과만 낸다 — 여기서 쓰는 토큰이 그대로 송출 지연이 된다.`;

function respond(text: string, changed: boolean) {
  return NextResponse.json({
    ok: true,
    data: { text, delivery: "", changed, decisions: [] },
  });
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
    /** 이 발화를 이룬 번역 조각 수. 2 이상이면 따로 번역된 토막을 이어 붙인 것이다 */
    fragments?: number;
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
  const fragments = Math.max(1, Math.min(50, Math.floor(body.fragments ?? 1)));

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
              fragments > 1
                ? `(초안은 원문 조각 ${fragments}개를 각각 따로 번역해 이어 붙인 것 — 규칙 1-1 적용)`
                : "",
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
      delivery?: string;
      changed?: boolean;
      decisions?: { term: string; chosen: string }[];
    };

    // 모델이 문장을 통째로 날려 먹는 경우가 최악이다. 빈 결과는 초안으로 되돌린다
    const text = parsed.text?.trim() || draftText;
    const decisions = Array.isArray(parsed.decisions) ? parsed.decisions : [];
    // 지시문은 TTS 프롬프트에 그대로 들어간다. 길게 새어 나오지 않게 자른다
    const delivery = (parsed.delivery ?? "").trim().slice(0, 300);

    // 설명이 붙은 항목은 용어 선택이 아니다. 그대로 두면 이후 모든 프롬프트에 박힌다
    recordDecisions(
      context,
      decisions.filter(
        (item) =>
          typeof item?.chosen === "string" &&
          item.chosen.length <= 40 &&
          !/[()（）]/.test(item.chosen),
      ),
    );
    finish(text);

    return NextResponse.json({
      ok: true,
      data: {
        text,
        delivery,
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
