import { NextResponse } from "next/server";
import { getChapelSummaryJob } from "@/lib/chapel-summary/jobs";
import { adminAuthErrorResponse, authenticateAdmin } from "@/lib/admin/adminAuth";

export const maxDuration = 10;
export const dynamic = "force-dynamic";

/** job 상태·결과 폴링 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateAdmin();
  if (!auth.ok) return adminAuthErrorResponse(auth);

  const job = await getChapelSummaryJob(params.id);
  if (!job) {
    return NextResponse.json(
      { ok: false, reason: "작업을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      jobId: job.id,
      status: job.status,
      draft: job.draft,
      error: job.error,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
    },
  });
}
