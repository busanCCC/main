import { NextRequest, NextResponse } from "next/server";
import type { TranscriptSegment } from "@/lib/chapel-summary/transcript";
import {
  createChapelSummaryJob,
  dispatchChapelSummaryJob,
} from "@/lib/chapel-summary/jobs";
import { adminAuthErrorResponse, authenticateAdmin } from "@/lib/admin/adminAuth";

export const maxDuration = 15;
export const dynamic = "force-dynamic";

interface CreateJobBody {
  transcript?: TranscriptSegment[];
  videoTitle?: string;
  messenger?: string;
  topic?: string;
  chapelDate?: string;
}

/** 요약 job 을 큐에 넣고 즉시 jobId 를 반환한다 */
export async function POST(request: NextRequest) {
  const auth = await authenticateAdmin();
  if (!auth.ok) return adminAuthErrorResponse(auth);

  const body = (await request.json()) as CreateJobBody;

  const created = await createChapelSummaryJob(
    {
      transcript: body.transcript ?? [],
      videoTitle: body.videoTitle,
      knownMessenger: body.messenger,
      knownTopic: body.topic,
      chapelDate: body.chapelDate,
    },
    auth.userId
  );

  if (!created.ok) {
    return NextResponse.json(
      { ok: false, reason: created.reason },
      { status: 400 }
    );
  }

  dispatchChapelSummaryJob(created.jobId);

  return NextResponse.json({
    ok: true,
    data: { jobId: created.jobId, status: "queued" as const },
  });
}
