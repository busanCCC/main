import { NextRequest, NextResponse } from "next/server";

import { parseAttendanceQuery } from "@/lib/attendance/params";
import { loadAttendanceSummary } from "@/lib/attendance/server";
import { adminAuthErrorResponse, authenticateAdmin, getAdminClient } from "@/lib/admin/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/attendance?semester=2026-1&filter=all — 채플/리트릿 출석 집계 */
export async function GET(request: NextRequest) {
  const auth = await authenticateAdmin();
  if (!auth.ok) return adminAuthErrorResponse(auth);

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
