import type { SupabaseClient } from "@supabase/supabase-js";

import {
  ATTENDANCE_KIND_RETREAT,
  type AttendanceFilter,
  type AttendanceRankingRow,
  type AttendanceSessionRow,
  type AttendanceSummary,
} from "./types";
import {
  SEMESTER_ALL,
  collectSemesters,
  parseSemesterId,
  semesterOf,
  type Semester,
} from "./semester";

/** PostgREST가 한 번에 돌려주는 최대 행 수 */
const PAGE_SIZE = 1000;

const CHAPEL_COLUMNS = "id,topic,place,datetime,retreat_datetime";
const ATTENDANCE_COLUMNS =
  "chapel_id,user_id,kind,created_at,profiles(name,student_id,campus)";

const ALL_SEMESTERS_LABEL = "전체 학기";
const UNKNOWN_NAME = "(이름 없음)";
const UNKNOWN_TOPIC = "(제목 없음)";

interface ChapelRow {
  id: number;
  topic: string | null;
  place: string | null;
  datetime: string | null;
  retreat_datetime: string | null;
}

interface AttendanceRow {
  chapel_id: number;
  user_id: string;
  kind: string | null;
  created_at: string;
  profiles: {
    name: string | null;
    student_id: string | null;
    campus: string | null;
  } | null;
}

function isRetreat(row: AttendanceRow): boolean {
  return row.kind === ATTENDANCE_KIND_RETREAT;
}

function matchesFilter(row: AttendanceRow, filter: AttendanceFilter): boolean {
  if (filter === "all") return true;
  return filter === "retreat" ? isRetreat(row) : !isRetreat(row);
}

/**
 * 채플은 주 단위로 쌓이는 소량 데이터라 전부 읽어 메모리에서 학기별로 나눈다.
 * 덕분에 학기 선택 목록과 회차 목록을 한 번의 쿼리로 얻는다.
 */
async function fetchChapels(client: SupabaseClient): Promise<ChapelRow[]> {
  const { data, error } = await client
    .from("chapels")
    .select(CHAPEL_COLUMNS)
    .order("datetime", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ChapelRow[];
}

async function fetchAttendances(
  client: SupabaseClient,
  chapelIds: number[] | null
): Promise<AttendanceRow[]> {
  if (chapelIds !== null && chapelIds.length === 0) return [];

  const rows: AttendanceRow[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    let query = client
      .from("chapel_attendances")
      .select(ATTENDANCE_COLUMNS)
      .order("id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (chapelIds !== null) query = query.in("chapel_id", chapelIds);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const page = (data ?? []) as unknown as AttendanceRow[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows;
}

/** 지정이 없으면 데이터가 있는 가장 최근 학기, 그것도 없으면 오늘 기준 학기 */
function resolveSemester(semesterId: string, available: Semester[]): Semester | null {
  if (semesterId === SEMESTER_ALL) return null;
  return (
    parseSemesterId(semesterId) ??
    available[0] ??
    semesterOf(new Date().toISOString())
  );
}

function buildSessions(
  chapels: ChapelRow[],
  attendances: AttendanceRow[]
): AttendanceSessionRow[] {
  const counts = new Map<number, { chapel: number; retreat: number }>();
  for (const row of attendances) {
    const entry = counts.get(row.chapel_id) ?? { chapel: 0, retreat: 0 };
    if (isRetreat(row)) entry.retreat += 1;
    else entry.chapel += 1;
    counts.set(row.chapel_id, entry);
  }

  return chapels.map((chapel) => {
    const entry = counts.get(chapel.id) ?? { chapel: 0, retreat: 0 };
    return {
      chapelId: chapel.id,
      topic: chapel.topic ?? UNKNOWN_TOPIC,
      place: chapel.place,
      datetime: chapel.datetime,
      retreatDatetime: chapel.retreat_datetime,
      chapelCount: entry.chapel,
      retreatCount: entry.retreat,
      totalCount: entry.chapel + entry.retreat,
    };
  });
}

/** 동점자는 같은 순위를 받고 다음 순위는 그만큼 건너뛴다 (1, 1, 3) */
function assignRanks(rows: Omit<AttendanceRankingRow, "rank">[]): AttendanceRankingRow[] {
  let previousTotal: number | null = null;
  let previousRank = 0;

  return rows.map((row, index) => {
    const rank = row.totalCount === previousTotal ? previousRank : index + 1;
    previousTotal = row.totalCount;
    previousRank = rank;
    return { ...row, rank };
  });
}

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

function buildRankings(
  attendances: AttendanceRow[],
  sessionCount: number
): AttendanceRankingRow[] {
  interface Accumulator {
    userId: string;
    name: string;
    studentId: string | null;
    campus: string | null;
    chapelCount: number;
    retreatCount: number;
    lastAttendedAt: string | null;
  }

  const byUser = new Map<string, Accumulator>();

  for (const row of attendances) {
    const entry = byUser.get(row.user_id) ?? {
      userId: row.user_id,
      name: row.profiles?.name?.trim() || UNKNOWN_NAME,
      studentId: row.profiles?.student_id ?? null,
      campus: row.profiles?.campus ?? null,
      chapelCount: 0,
      retreatCount: 0,
      lastAttendedAt: null,
    };

    if (isRetreat(row)) entry.retreatCount += 1;
    else entry.chapelCount += 1;

    if (!entry.lastAttendedAt || row.created_at > entry.lastAttendedAt) {
      entry.lastAttendedAt = row.created_at;
    }
    byUser.set(row.user_id, entry);
  }

  const sorted = Array.from(byUser.values())
    .map((entry) => {
      const totalCount = entry.chapelCount + entry.retreatCount;
      return {
        ...entry,
        totalCount,
        attendanceRate:
          sessionCount > 0 ? roundToTenth((totalCount / sessionCount) * 100) : 0,
      };
    })
    .sort((a, b) => b.totalCount - a.totalCount || a.name.localeCompare(b.name, "ko"));

  return assignRanks(sorted);
}

export interface LoadAttendanceOptions {
  /** "2026-1", "all", 또는 빈 문자열(가장 최근 학기 자동 선택) */
  semesterId: string;
  filter: AttendanceFilter;
}

/**
 * 선택한 학기/구분의 채플·리트릿 출석 현황을 집계한다.
 * 화면 조회와 엑셀 내보내기가 항상 같은 수치를 쓰도록 한 곳에서 계산한다.
 */
export async function loadAttendanceSummary(
  client: SupabaseClient,
  { semesterId, filter }: LoadAttendanceOptions
): Promise<AttendanceSummary> {
  const chapels = await fetchChapels(client);
  const semesters = collectSemesters(chapels.map((chapel) => chapel.datetime));
  const semester = resolveSemester(semesterId, semesters);

  const scopedChapels = semester
    ? chapels.filter((chapel) => semesterOf(chapel.datetime)?.id === semester.id)
    : chapels;

  const attendances = await fetchAttendances(
    client,
    semester ? scopedChapels.map((chapel) => chapel.id) : null
  );
  const filtered = attendances.filter((row) => matchesFilter(row, filter));

  const sessions = buildSessions(scopedChapels, attendances);
  const chapelSessions = sessions.length;
  // 리트릿 일정이 비어 있어도 출석 기록이 있으면 회차로 인정한다
  const retreatSessions = sessions.filter(
    (session) => session.retreatDatetime !== null || session.retreatCount > 0
  ).length;

  const sessionCountByFilter: Record<AttendanceFilter, number> = {
    all: chapelSessions + retreatSessions,
    chapel: chapelSessions,
    retreat: retreatSessions,
  };
  const sessionCount = sessionCountByFilter[filter];
  const rankings = buildRankings(filtered, sessionCount);

  return {
    semesters,
    semesterId: semester?.id ?? SEMESTER_ALL,
    semesterLabel: semester?.label ?? ALL_SEMESTERS_LABEL,
    filter,
    totals: {
      participants: rankings.length,
      attendances: filtered.length,
      chapelSessions,
      retreatSessions,
      averagePerSession:
        sessionCount > 0 ? roundToTenth(filtered.length / sessionCount) : 0,
    },
    rankings,
    sessions,
  };
}
