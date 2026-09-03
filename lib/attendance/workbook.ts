import { buildXlsx, type SheetData } from "@/lib/xlsx/writer";

import { formatKstDateTime, formatKstFileStamp } from "./format";
import { ATTENDANCE_FILTER_LABEL, type AttendanceSummary } from "./types";

const RANKING_HEADER = [
  "순위",
  "이름",
  "학번",
  "캠퍼스",
  "채플 출석",
  "리트릿 출석",
  "합계",
  "출석률(%)",
  "최근 출석",
];
const RANKING_WIDTHS = [6, 12, 14, 18, 10, 12, 8, 11, 20];

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

function buildRankingSheet(summary: AttendanceSummary): SheetData {
  return {
    name: "출석 순위",
    columnWidths: RANKING_WIDTHS,
    rows: [
      RANKING_HEADER,
      ...summary.rankings.map((row) => [
        row.rank,
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
      ["출석 인원", summary.totals.participants],
      ["총 출석 횟수", summary.totals.attendances],
      ["채플 회차", summary.totals.chapelSessions],
      ["리트릿 회차", summary.totals.retreatSessions],
      ["회차당 평균 출석", summary.totals.averagePerSession],
      ["내보낸 시각", formatKstDateTime(new Date().toISOString())],
    ],
  };
}

/** 출석 현황 요약을 3개 시트(순위/회차별/요약) 엑셀 파일로 만든다. */
export function buildAttendanceWorkbook(summary: AttendanceSummary): Buffer {
  return buildXlsx([
    buildRankingSheet(summary),
    buildSessionSheet(summary),
    buildSummarySheet(summary),
  ]);
}

/** "출석현황_2026년1학기_전체_20260903.xlsx" */
export function buildAttendanceFileName(summary: AttendanceSummary): string {
  const semester = summary.semesterLabel.replace(/\s+/g, "");
  const filter = ATTENDANCE_FILTER_LABEL[summary.filter];
  return `출석현황_${semester}_${filter}_${formatKstFileStamp()}.xlsx`;
}
