import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { TranscriptSegment } from "@/lib/chapel-summary/transcript";
import { verifyAdmin } from "@/lib/chapel-summary/auth";
import {
  createChapelSummaryJob,
  dispatchChapelSummaryJob,
} from "@/lib/chapel-summary/jobs";

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
  if (!(await verifyAdmin())) {
    return NextResponse.json(
      { ok: false, reason: "관리자 권한이 필요합니다." },
      { status: 403 }
    );
  }

  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json(
      { ok: false, reason: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  const body = (await request.json()) as CreateJobBody;

  const created = await createChapelSummaryJob(
    {
      transcript: body.transcript ?? [],
      videoTitle: body.videoTitle,
      knownMessenger: body.messenger,
      knownTopic: body.topic,
      chapelDate: body.chapelDate,
    },
    userId
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
