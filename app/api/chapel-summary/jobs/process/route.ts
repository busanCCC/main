import { NextRequest, NextResponse } from "next/server";
import {
  failChapelSummaryJob,
  processChapelSummaryJob,
  verifyJobWorkerAuth,
} from "@/lib/chapel-summary/jobs";

/** Vercel Hobby 플랜은 Serverless Function 최대 60초 */
export const maxDuration = 60;
export const dynamic = "force-dynamic";

interface ProcessBody {
  jobId?: string;
}

/** 큐에 쌓인 job 을 실제로 처리한다 (내부 worker 전용) */
export async function POST(request: NextRequest) {
  if (!verifyJobWorkerAuth(request.headers.get("authorization"))) {
    return NextResponse.json(
      { ok: false, reason: "unauthorized" },
      { status: 401 }
    );
  }

  const body = (await request.json()) as ProcessBody;
  const jobId = body.jobId?.trim();

  if (!jobId) {
    return NextResponse.json(
      { ok: false, reason: "jobId 가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    await processChapelSummaryJob(jobId);
    return NextResponse.json({ ok: true, data: { jobId } });
  } catch (err) {
    const reason =
      err instanceof Error ? err.message : "요약 처리 중 오류가 발생했습니다.";
    console.error("[chapel-jobs] process error:", err);
    await failChapelSummaryJob(jobId, reason);
    return NextResponse.json({ ok: false, reason }, { status: 500 });
  }
}
