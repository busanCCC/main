import type { Semester } from "./semester";

/** chapel_attendances.kind 값 */
export const ATTENDANCE_KIND_CHAPEL = "chapel";
export const ATTENDANCE_KIND_RETREAT = "retreat";

/** 화면/내보내기 필터 값 */
export const ATTENDANCE_FILTERS = ["all", "chapel", "retreat"] as const;
export type AttendanceFilter = (typeof ATTENDANCE_FILTERS)[number];

export const ATTENDANCE_FILTER_LABEL: Record<AttendanceFilter, string> = {
  all: "전체",
  chapel: "채플",
  retreat: "리트릿",
};

export function isAttendanceFilter(value: string): value is AttendanceFilter {
  return (ATTENDANCE_FILTERS as readonly string[]).includes(value);
}

/** 순장/순원 구분 (profiles.role 기준) */
export const ATTENDANCE_ROLES = ["leader", "member"] as const;
export type AttendanceRole = (typeof ATTENDANCE_ROLES)[number];

export const ATTENDANCE_ROLE_LABEL: Record<AttendanceRole, string> = {
  leader: "순장",
  member: "순원",
};

/** 화면/내보내기 순장·순원 필터 값 */
export const ATTENDANCE_ROLE_FILTERS = ["all", ...ATTENDANCE_ROLES] as const;
export type AttendanceRoleFilter = (typeof ATTENDANCE_ROLE_FILTERS)[number];

export const ATTENDANCE_ROLE_FILTER_LABEL: Record<AttendanceRoleFilter, string> = {
  all: "전체",
  ...ATTENDANCE_ROLE_LABEL,
};

export function isAttendanceRoleFilter(value: string): value is AttendanceRoleFilter {
  return (ATTENDANCE_ROLE_FILTERS as readonly string[]).includes(value);
}

/**
 * profiles.role 은 "LEADER"(순장) / "MEMBER"(순원) 이다. 대소문자는 무시한다.
 * 값이 비어 있거나 다른 값이면 순원으로 본다.
 */
const LEADER_ROLE_VALUES = new Set(["leader"]);

export function toAttendanceRole(role: string | null | undefined): AttendanceRole {
  return LEADER_ROLE_VALUES.has((role ?? "").trim().toLowerCase()) ? "leader" : "member";
}

/** 출석자 1명의 집계 결과 */
export interface AttendanceRankingRow {
  rank: number;
  userId: string;
  /** 실명 (profiles.name) */
  name: string;
  /** 캠퍼스 학번 (profiles.student_id) */
  studentId: string | null;
  campus: string | null;
  role: AttendanceRole;
  chapelCount: number;
  retreatCount: number;
  totalCount: number;
  /** 선택한 필터 기준 출석률 (0~100, 소수 첫째 자리) */
  attendanceRate: number;
  /** 마지막 출석 시각 (ISO) */
  lastAttendedAt: string | null;
}

/** 채플 1회차의 집계 결과 */
export interface AttendanceSessionRow {
  chapelId: number;
  topic: string;
  place: string | null;
  datetime: string | null;
  retreatDatetime: string | null;
  chapelCount: number;
  retreatCount: number;
  totalCount: number;
}

export interface AttendanceTotals {
  /** 한 번이라도 출석한 인원 수 */
  participants: number;
  /** 총 출석 횟수 */
  attendances: number;
  chapelSessions: number;
  retreatSessions: number;
  /** 선택한 필터 기준 회차당 평균 출석 인원 */
  averagePerSession: number;
  /** 순장·순원 필터 적용 전 구분별 출석 인원 (탭 배지용) */
  participantsByRole: Record<AttendanceRole, number>;
}

export interface AttendanceSummary {
  /** 선택 가능한 학기 목록 (최신순) */
  semesters: Semester[];
  /** 실제 적용된 학기 id ("all" 이면 전체) */
  semesterId: string;
  semesterLabel: string;
  filter: AttendanceFilter;
  role: AttendanceRoleFilter;
  totals: AttendanceTotals;
  rankings: AttendanceRankingRow[];
  sessions: AttendanceSessionRow[];
}
