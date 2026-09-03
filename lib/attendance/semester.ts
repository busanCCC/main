/**
 * 학기(semester) 계산 유틸.
 *
 * 대학 학사일정을 따라 1학기는 3월~8월, 2학기는 9월~다음 해 2월로 본다.
 * (1~2월 출석은 직전 해 2학기에 포함된다.)
 * 라벨 형식은 DB의 semester_mvp_groups.semester_label("2026년 1학기")과 맞춘다.
 */

export const SEMESTER_ALL = "all";
/** 학기를 지정하지 않았을 때 — 데이터가 있는 최근 학기를 서버가 고른다 */
export const SEMESTER_AUTO = "";

export type SemesterTerm = 1 | 2;

export interface Semester {
  /** "2026-1" 형태의 식별자, 전체 조회는 "all" */
  id: string;
  /** "2026년 1학기" */
  label: string;
  year: number;
  term: SemesterTerm;
}

/** 학기 경계가 되는 달 — 학사일정이 바뀌면 이 두 값만 고치면 된다 */
const FIRST_TERM_START_MONTH = 3;
const SECOND_TERM_START_MONTH = 9;

/** 출석 시각은 항상 한국 시간 기준으로 학기를 판정한다 */
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function createSemester(year: number, term: SemesterTerm): Semester {
  return { id: `${year}-${term}`, label: `${year}년 ${term}학기`, year, term };
}

function toKstMonthAndYear(timestamp: number): { year: number; month: number } {
  const kst = new Date(timestamp + KST_OFFSET_MS);
  return { year: kst.getUTCFullYear(), month: kst.getUTCMonth() + 1 };
}

/** ISO 문자열이 속한 학기. 파싱할 수 없으면 null */
export function semesterOf(isoDate: string | null | undefined): Semester | null {
  if (!isoDate) return null;
  const timestamp = Date.parse(isoDate);
  if (Number.isNaN(timestamp)) return null;

  const { year, month } = toKstMonthAndYear(timestamp);
  if (month >= SECOND_TERM_START_MONTH) return createSemester(year, 2);
  if (month >= FIRST_TERM_START_MONTH) return createSemester(year, 1);
  // 1~2월은 직전 해 2학기의 연장
  return createSemester(year - 1, 2);
}

/** "2026-1" → Semester. 형식이 맞지 않으면 null */
export function parseSemesterId(id: string | null | undefined): Semester | null {
  if (!id) return null;
  const matched = /^(\d{4})-([12])$/.exec(id);
  if (!matched) return null;
  return createSemester(Number(matched[1]), Number(matched[2]) as SemesterTerm);
}

/** 여러 날짜에서 중복 없는 학기 목록을 뽑는다 (최신순) */
export function collectSemesters(isoDates: (string | null | undefined)[]): Semester[] {
  const byId = new Map<string, Semester>();
  for (const isoDate of isoDates) {
    const semester = semesterOf(isoDate);
    if (semester) byId.set(semester.id, semester);
  }
  return Array.from(byId.values()).sort((a, b) => b.year - a.year || b.term - a.term);
}
