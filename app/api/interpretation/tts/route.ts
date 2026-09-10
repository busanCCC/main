/**
 * 통역문 한 발화를 음성으로 합성해 흘려보낸다.
 *
 * mp3 를 받아 MediaSource 로 이어붙이는 것보다, 원시 PCM 을 그대로 흘려
 * 브라우저가 도착하는 대로 AudioBuffer 에 채우는 쪽이 단순하고 빠르다.
 * 합성이 끝나기 전에 소리가 나기 시작한다 — 실시간 송출에서는 이 차이가 크다.
 *
 * 출력 규격은 24kHz · 16bit · mono little-endian PCM 이며,
 * 클라이언트(ttsPlayer.ts)가 같은 규격을 가정하고 디코드한다.
 */

import { NextRequest } from "next/server";
import OpenAI from "openai";
import { verifyInterpretationAdmin } from "@/lib/interpretation/adminAuth";

export const dynamic = "force-dynamic";
/** 스트리밍 응답이므로 Edge 가 아니라 Node 런타임이어야 한다 */
export const runtime = "nodejs";

const DEFAULT_MODEL = "gpt-4o-mini-tts";

/** 한 발화가 이보다 길 일은 없다. 프롬프트 인젝션성 대용량 입력도 여기서 막힌다 */
const MAX_INPUT_CHARS = 1200;

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

  let body: { text?: string; voice?: string; speed?: number };
  try {
    body = await request.json();
  } catch {
    return fail(400, "잘못된 요청 본문입니다.");
  }

  const text = (body.text ?? "").trim().slice(0, MAX_INPUT_CHARS);
  if (!text) return fail(400, "합성할 문장이 비어 있습니다.");

  const voice = body.voice?.trim() || "alloy";
  // OpenAI 가 받는 범위. 벗어난 값을 그대로 넘기면 요청 전체가 실패한다
  const speed = Math.min(4, Math.max(0.25, body.speed ?? 1));

  const client = new OpenAI();

  try {
    const upstream = await client.audio.speech.create({
      model: process.env.INTERPRETATION_TTS_MODEL || DEFAULT_MODEL,
      voice: voice as "alloy",
      input: text,
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
