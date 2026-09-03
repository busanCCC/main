import { toAttendanceSearchParams, type AttendanceQuery } from "./params";
import type { AttendanceSummary } from "./types";

const SUMMARY_ENDPOINT = "/api/admin/attendance";
const EXPORT_ENDPOINT = "/api/admin/attendance/export";
const FALLBACK_FILE_NAME = "attendance.xlsx";

async function readErrorReason(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json();
    return typeof body?.reason === "string" ? body.reason : fallback;
  } catch {
    return fallback;
  }
}

export async function fetchAttendanceSummary(
  query: AttendanceQuery
): Promise<AttendanceSummary> {
  const response = await fetch(`${SUMMARY_ENDPOINT}?${toAttendanceSearchParams(query)}`);
  if (!response.ok) {
    throw new Error(await readErrorReason(response, "출석 현황을 불러오지 못했습니다."));
  }

  const body = await response.json();
  if (!body.ok) throw new Error(body.reason ?? "출석 현황을 불러오지 못했습니다.");
  return body.data as AttendanceSummary;
}

/** Content-Disposition의 filename*(RFC 5987)에서 한글 파일명을 복원한다 */
function readFileName(response: Response): string {
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
  if (!encoded) return FALLBACK_FILE_NAME;
  try {
    return decodeURIComponent(encoded);
  } catch {
    return FALLBACK_FILE_NAME;
  }
}

/** 엑셀 파일을 내려받는다. 실패 시 서버가 보낸 사유로 throw 한다. */
export async function downloadAttendanceExcel(query: AttendanceQuery): Promise<void> {
  const response = await fetch(`${EXPORT_ENDPOINT}?${toAttendanceSearchParams(query)}`);
  if (!response.ok) {
    throw new Error(await readErrorReason(response, "엑셀 파일을 만들지 못했습니다."));
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = readFileName(response);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
