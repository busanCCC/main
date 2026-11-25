import type { AttendanceRankingRow } from "./types";

type UnrankedRow = Omit<AttendanceRankingRow, "rank">;

/**
 * 합계 내림차순으로 정렬된 행에 순위를 매긴다.
 * 동점자는 같은 순위를 받고 다음 순위는 그만큼 건너뛴다 (1, 1, 3).
 * 순장·순원으로 나눈 명단도 그룹 안에서 다시 순위를 매기도록 서버·클라이언트가 함께 쓴다.
 */
export function assignRanks(rows: UnrankedRow[]): AttendanceRankingRow[] {
  let previousTotal: number | null = null;
  let previousRank = 0;

  return rows.map((row, index) => {
    const rank = row.totalCount === previousTotal ? previousRank : index + 1;
    previousTotal = row.totalCount;
    previousRank = rank;
    return { ...row, rank };
  });
}
