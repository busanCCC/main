import { buildXlsx, type SheetData } from "@/lib/xlsx/writer";

import { formatKstDateTime, formatKstFileStamp } from "./format";
import { assignRanks } from "./ranking";
import {
  ATTENDANCE_FILTER_LABEL,
  ATTENDANCE_ROLES,
  ATTENDANCE_ROLE_FILTER_LABEL,
  ATTENDANCE_ROLE_LABEL,
  type AttendanceRankingRow,
  type AttendanceSummary,
} from "./types";

const RANKING_HEADER = [
  "순위",
  "구분",
  "이름",
  "학번",
  "캠퍼스",
  "채플 출석",
  "리트릿 출석",
  "합계",
  "출석률(%)",
  "최근 출석",
];
const RANKING_WIDTHS = [6, 8, 12, 14, 18, 10, 12, 8, 11, 20];

const SESSION_HEADER = [
  "채플 일시",
  "주제",
  "장소",
  "리트릿 일시",
  "채플 출석",
  "리트릿 출석",
  "합계",
];
const SESSION_WIDTHS = [20, 30, 22, 20, 10, 12, 8];

const SUMMARY_HEADER = ["항목", "값"];
const SUMMARY_WIDTHS = [20, 24];

/** 머리글의 자동 필터로 "구분" 열을 골라 순장/순원만 걸러 볼 수 있다 */
function buildRankingSheet(name: string, rankings: AttendanceRankingRow[]): SheetData {
  return {
    name,
    columnWidths: RANKING_WIDTHS,
    rows: [
      RANKING_HEADER,
      ...rankings.map((row) => [
        row.rank,
        ATTENDANCE_ROLE_LABEL[row.role],
        row.name,
        row.studentId ?? "",
        row.campus ?? "",
        row.chapelCount,
        row.retreatCount,
        row.totalCount,
        row.attendanceRate,
        formatKstDateTime(row.lastAttendedAt),
      ]),
    ],
  };
}

function buildSessionSheet(summary: AttendanceSummary): SheetData {
  return {
    name: "회차별 출석",
    columnWidths: SESSION_WIDTHS,
    rows: [
      SESSION_HEADER,
      ...summary.sessions.map((session) => [
        formatKstDateTime(session.datetime),
        session.topic,
        session.place ?? "",
        session.retreatDatetime ? formatKstDateTime(session.retreatDatetime) : "",
        session.chapelCount,
        session.retreatCount,
        session.totalCount,
      ]),
    ],
  };
}

function buildSummarySheet(summary: AttendanceSummary): SheetData {
  return {
    name: "요약",
    columnWidths: SUMMARY_WIDTHS,
    rows: [
      SUMMARY_HEADER,
      ["학기", summary.semesterLabel],
      ["구분", ATTENDANCE_FILTER_LABEL[summary.filter]],
      ["순장/순원", ATTENDANCE_ROLE_FILTER_LABEL[summary.role]],
      ["출석 인원", summary.totals.participants],
      ["순장 출석 인원", summary.totals.participantsByRole.leader],
      ["순원 출석 인원", summary.totals.participantsByRole.member],
      ["총 출석 횟수", summary.totals.attendances],
      ["채플 회차", summary.totals.chapelSessions],
      ["리트릿 회차", summary.totals.retreatSessions],
      ["회차당 평균 출석", summary.totals.averagePerSession],
      ["내보낸 시각", formatKstDateTime(new Date().toISOString())],
    ],
  };
}

/** 전체 명단일 때는 순장·순원 명단을 그룹 내 순위로 따로 담은 시트를 덧붙인다 */
function buildRoleSheets(summary: AttendanceSummary): SheetData[] {
  if (summary.role !== "all") return [];
  return ATTENDANCE_ROLES.map((role) =>
    buildRankingSheet(
      `${ATTENDANCE_ROLE_LABEL[role]} 명단`,
      assignRanks(summary.rankings.filter((row) => row.role === role))
    )
  );
}

/**
 * 출석 현황을 엑셀 파일로 만든다.
 * 시트: 출석 순위 → (전체일 때) 순장 명단·순원 명단 → 회차별 출석 → 요약
 */
export function buildAttendanceWorkbook(summary: AttendanceSummary): Buffer {
  const rankingSheetName =
    summary.role === "all"
      ? "출석 순위"
      : `${ATTENDANCE_ROLE_LABEL[summary.role]} 출석 순위`;
  return buildXlsx([
    buildRankingSheet(rankingSheetName, summary.rankings),
    ...buildRoleSheets(summary),
    buildSessionSheet(summary),
    buildSummarySheet(summary),
  ]);
}

/** "출석현황_2026년1학기_전체_20260903.xlsx", 순장만이면 "..._전체_순장_20260903.xlsx" */
export function buildAttendanceFileName(summary: AttendanceSummary): string {
  const semester = summary.semesterLabel.replace(/\s+/g, "");
  const filter = ATTENDANCE_FILTER_LABEL[summary.filter];
  const role = summary.role === "all" ? "" : `_${ATTENDANCE_ROLE_LABEL[summary.role]}`;
  return `출석현황_${semester}_${filter}${role}_${formatKstFileStamp()}.xlsx`;
}
