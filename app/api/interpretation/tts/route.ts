/**
 * 통역문 한 발화를 음성으로 합성해 흘려보낸다.
 *
 * mp3 를 받아 MediaSource 로 이어붙이는 것보다, 원시 PCM 을 그대로 흘려
 * 브라우저가 도착하는 대로 AudioBuffer 에 채우는 쪽이 단순하고 빠르다.
 * 합성이 끝나기 전에 소리가 나기 시작한다 — 실시간 송출에서는 이 차이가 크다.
 *
 * 출력 규격은 24kHz · 16bit · mono little-endian PCM 이며,
 * 클라이언트(ttsPlayer.ts)가 같은 규격을 가정하고 디코드한다.
 *
 * 억양과 말투는 instructions 로 잡는다. 세션 내내 같은 화자 스타일(style)에
 * 문장마다 정제 단계가 뽑은 연기 지시(delivery)를 얹는다 — 둘이 없으면
 * 모델은 평이한 낭독톤으로 읽는다.
 */

import { NextRequest } from "next/server";
import OpenAI from "openai";
import { verifyInterpretationAdmin } from "@/lib/interpretation/adminAuth";
import { getLanguageLabel } from "@/lib/interpretation/streamStats";
import { CUSTOM_VOICE_PREFIX } from "@/lib/interpretation/ttsTypes";

export const dynamic = "force-dynamic";
/** 스트리밍 응답이므로 Edge 가 아니라 Node 런타임이어야 한다 */
export const runtime = "nodejs";

const DEFAULT_MODEL = "gpt-4o-mini-tts-2025-12-15";

/** 한 발화가 이보다 길 일은 없다. 프롬프트 인젝션성 대용량 입력도 여기서 막힌다 */
const MAX_INPUT_CHARS = 1200;
/** 지시문은 짧을수록 잘 따른다. 길면 첫 소리까지의 지연만 는다 */
const MAX_STYLE_CHARS = 400;
const MAX_DELIVERY_CHARS = 300;

/** 화자 말투를 비워 두면 쓰는 기본값. 비워 두면 모델은 안내방송 톤으로 돌아간다 */
const DEFAULT_STYLE =
  "A sincere, warm speaker addressing a live audience in person, as in a sermon or talk.";

/**
 * 음성 연기 지시.
 *
 * "통역사" 역할을 주면 모델이 실제 통역사처럼 평평하고 중립적으로 읽는다 —
 * 기계 같다는 인상의 주된 원인이었다. 화자 본인이 청중 앞에서 직접 말하는
 * 것으로 세우고, 낭독·내레이션 톤을 명시적으로 금한다.
 * 항목별로 짧게 끊어 쓰는 형식을 이 모델이 가장 잘 따른다.
 */
function buildInstructions(lang: string, style: string, delivery: string): string {
  const language = lang ? getLanguageLabel(lang) : "the target language";
  return [
    `Identity: You ARE the speaker, talking live to people in the room in ${language}. You are not reading a script, not narrating, and not interpreting.`,
    `Speaker: ${style || DEFAULT_STYLE}`,
    "Voice: Natural native accent. Conversational and human — relaxed throat, real breath, varied pitch. Never the even, polished tone of an audiobook, announcer or assistant.",
    "Tone: Mean every word. Let conviction, warmth or urgency come through as the content calls for it.",
    "Pacing: Uneven like real speech — move quickly through familiar phrases, slow down on the words that matter. Let sentence endings fall naturally.",
    "Pauses: Short, natural pauses at thought boundaries only; do not pause evenly after every phrase.",
    delivery ? `This sentence: ${delivery}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function fail(status: number, reason: string) {
  return new Response(JSON.stringify({ ok: false, reason }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: NextRequest) {
  const auth = await verifyInterpretationAdmin();
  if (!auth.ok) return fail(403, "관리자 권한이 필요합니다.");

  if (!process.env.OPENAI_API_KEY) {
    return fail(500, "OPENAI_API_KEY 가 설정되지 않았습니다.");
  }

  let body: {
    text?: string;
    voice?: string;
    speed?: number;
    lang?: string;
    style?: string;
    delivery?: string;
  };
  try {
    body = await request.json();
  } catch {
    return fail(400, "잘못된 요청 본문입니다.");
  }

  const text = (body.text ?? "").trim().slice(0, MAX_INPUT_CHARS);
  if (!text) return fail(400, "합성할 문장이 비어 있습니다.");

  const voiceName = body.voice?.trim() || "marin";
  if (voiceName === CUSTOM_VOICE_PREFIX) {
    return fail(400, "커스텀 보이스 ID 를 입력해 주세요.");
  }
  // 화자 음성을 등록한 커스텀 보이스는 문자열이 아니라 { id } 로 넘겨야 한다
  const voice = voiceName.startsWith(CUSTOM_VOICE_PREFIX)
    ? { id: voiceName }
    : voiceName;
  // OpenAI 가 받는 범위. 벗어난 값을 그대로 넘기면 요청 전체가 실패한다
  const speed = Math.min(4, Math.max(0.25, body.speed ?? 1));
  const instructions = buildInstructions(
    body.lang?.trim() ?? "",
    (body.style ?? "").trim().slice(0, MAX_STYLE_CHARS),
    (body.delivery ?? "").trim().slice(0, MAX_DELIVERY_CHARS),
  );

  const client = new OpenAI();

  try {
    const upstream = await client.audio.speech.create({
      model: process.env.INTERPRETATION_TTS_MODEL || DEFAULT_MODEL,
      voice,
      input: text,
      instructions,
      response_format: "pcm",
      speed,
    });

    if (!upstream.body) return fail(502, "TTS 응답이 비어 있습니다.");

    return new Response(upstream.body as ReadableStream<Uint8Array>, {
      headers: {
        // 실제로는 헤더 없는 raw PCM 이다. 클라이언트가 규격을 알고 받는다
        "Content-Type": "audio/L16; rate=24000; channels=1",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    if (err instanceof OpenAI.APIError) {
      console.error("[통역 TTS] OpenAI 오류:", err.status, err.message);
      return fail(502, `음성 합성 실패 (${err.status})`);
    }
    console.error("[통역 TTS] 합성 실패:", err);
    return fail(502, "음성 합성에 실패했습니다.");
  }
}
