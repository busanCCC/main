import { SEMESTER_AUTO } from "./semester";
import { isAttendanceFilter, type AttendanceFilter } from "./types";

const DEFAULT_FILTER: AttendanceFilter = "all";

export interface AttendanceQuery {
  semesterId: string;
  filter: AttendanceFilter;
}

/** 조회/내보내기 라우트가 같은 규칙으로 쿼리스트링을 읽도록 한 곳에 둔다. */
export function parseAttendanceQuery(searchParams: URLSearchParams): AttendanceQuery {
  const filterParam = searchParams.get("filter") ?? DEFAULT_FILTER;
  return {
    semesterId: searchParams.get("semester") ?? SEMESTER_AUTO,
    filter: isAttendanceFilter(filterParam) ? filterParam : DEFAULT_FILTER,
  };
}

/** 쿼리스트링으로 되돌린다 (클라이언트 fetch/다운로드 링크용) */
export function toAttendanceSearchParams({
  semesterId,
  filter,
}: AttendanceQuery): string {
  return new URLSearchParams({ semester: semesterId, filter }).toString();
}
