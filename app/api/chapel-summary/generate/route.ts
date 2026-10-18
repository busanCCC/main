import { NextRequest, NextResponse } from "next/server";
import { generateChapelSummary } from "@/lib/chapel-summary/generate";
import type { TranscriptSegment } from "@/lib/chapel-summary/transcript";
import { adminAuthErrorResponse, authenticateAdmin } from "@/lib/admin/adminAuth";

/** Vercel Hobby 플랜은 Serverless Function 최대 60초 */
export const maxDuration = 60;
export const dynamic = "force-dynamic";

interface GenerateRequestBody {
  transcript?: TranscriptSegment[];
  videoTitle?: string;
  messenger?: string;
  topic?: string;
  chapelDate?: string;
}

/** @deprecated POST /api/chapel-summary/jobs 를 사용하세요 (백그라운드 큐) */
export async function POST(request: NextRequest) {
  const auth = await authenticateAdmin();
  if (!auth.ok) return adminAuthErrorResponse(auth);

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
