import { NextRequest, NextResponse } from "next/server";

import { getAdminClient, verifyAdmin } from "@/lib/admin/adminAuth";
import { parseAttendanceQuery } from "@/lib/attendance/params";
import { loadAttendanceSummary } from "@/lib/attendance/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/attendance?semester=2026-1&filter=all — 채플/리트릿 출석 집계 */
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json(
      { ok: false, reason: "관리자 권한이 필요합니다." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);

  try {
    const summary = await loadAttendanceSummary(
      getAdminClient(),
      parseAttendanceQuery(searchParams)
    );
    return NextResponse.json({ ok: true, data: summary });
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "출석 현황을 불러오지 못했습니다.";
    return NextResponse.json({ ok: false, reason }, { status: 500 });
  }
}
