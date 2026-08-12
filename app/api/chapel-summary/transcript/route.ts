import { NextRequest, NextResponse } from "next/server";
import { extractVideoId } from "@/lib/chapel-summary/youtube";
import {
  fetchTranscriptFromProvider,
  parseTranscript,
} from "@/lib/chapel-summary/transcript";
import { verifyAdmin } from "@/lib/chapel-summary/auth";

export const dynamic = "force-dynamic";

interface TranscriptRequestBody {
  /** 유튜브 링크. 외부 전사 서비스에 물어볼 때 쓴다 */
  url?: string;
  /** 운영진이 붙여넣은 전사문 */
  raw?: string;
  durationSeconds?: number;
}

/**
 * 전사문을 세그먼트로 만들어 돌려준다.
 *
 * raw 가 오면 그것을 파싱하고, 없으면 외부 전사 서비스에 물어본다.
 * 유튜브 자막을 서버에서 직접 긁어오는 경로는 없다 — timedtext 가 막혀 있다.
 */
export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json(
      { ok: false, reason: "관리자 권한이 필요합니다." },
      { status: 403 }
    );
  }

  const body = (await request.json()) as TranscriptRequestBody;
  const raw = body.raw?.trim() ?? "";

  if (raw) {
    const segments = parseTranscript(raw, body.durationSeconds ?? 0);

    if (segments.length === 0) {
      return NextResponse.json(
        { ok: false, reason: "전사문에서 읽어낼 내용이 없습니다." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: { segments, source: "pasted" as const },
    });
  }

  const videoId = extractVideoId(body.url ?? "");
  if (!videoId) {
    return NextResponse.json(
      { ok: false, reason: "유튜브 링크를 인식하지 못했습니다." },
      { status: 400 }
    );
  }

  const result = await fetchTranscriptFromProvider(videoId);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, reason: result.reason ?? "전사문을 가져오지 못했습니다." },
      { status: 422 }
    );
  }

  return NextResponse.json({
    ok: true,
    data: { segments: result.segments, source: "provider" as const },
  });
}
