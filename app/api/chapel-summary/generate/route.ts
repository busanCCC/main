import { NextRequest, NextResponse } from "next/server";
import { generateChapelSummary } from "@/lib/chapel-summary/generate";
import type { TranscriptSegment } from "@/lib/chapel-summary/transcript";
import { verifyAdmin } from "@/lib/chapel-summary/auth";

/** 긴 전사문은 Claude 응답이 몇 분까지 갈 수 있다 */
export const maxDuration = 300;
export const dynamic = "force-dynamic";

interface GenerateRequestBody {
  transcript?: TranscriptSegment[];
  videoTitle?: string;
  messenger?: string;
  topic?: string;
  chapelDate?: string;
}

/** 전사문으로 채플 요약 초안을 만든다. 저장은 하지 않고 폼으로 돌려준다 */
export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json(
      { ok: false, reason: "관리자 권한이 필요합니다." },
      { status: 403 }
    );
  }

  const body = (await request.json()) as GenerateRequestBody;
  const transcript = body.transcript ?? [];

  if (transcript.length === 0) {
    return NextResponse.json(
      { ok: false, reason: "전사문을 먼저 준비해 주세요." },
      { status: 400 }
    );
  }

  const result = await generateChapelSummary({
    transcript,
    videoTitle: body.videoTitle,
    knownMessenger: body.messenger,
    knownTopic: body.topic,
    chapelDate: body.chapelDate,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, reason: result.reason }, { status: 502 });
  }

  return NextResponse.json({ ok: true, data: result.draft });
}
