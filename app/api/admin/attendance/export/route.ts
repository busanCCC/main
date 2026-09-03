import { NextRequest, NextResponse } from "next/server";

import { getAdminClient, verifyAdmin } from "@/lib/admin/adminAuth";
import { parseAttendanceQuery } from "@/lib/attendance/params";
import { loadAttendanceSummary } from "@/lib/attendance/server";
import {
  buildAttendanceFileName,
  buildAttendanceWorkbook,
} from "@/lib/attendance/workbook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const XLSX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
/** 한글 파일명을 못 읽는 클라이언트를 위한 대체 이름 */
const ASCII_FALLBACK_FILE_NAME = "attendance.xlsx";

/** GET /api/admin/attendance/export?semester=2026-1&filter=all — 엑셀 다운로드 */
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
    const file = buildAttendanceWorkbook(summary);
    const fileName = encodeURIComponent(buildAttendanceFileName(summary));

    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": XLSX_CONTENT_TYPE,
        "Content-Length": String(file.length),
        "Content-Disposition": `attachment; filename="${ASCII_FALLBACK_FILE_NAME}"; filename*=UTF-8''${fileName}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "엑셀 파일을 만들지 못했습니다.";
    return NextResponse.json({ ok: false, reason }, { status: 500 });
  }
}
