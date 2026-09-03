"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { EmptyState } from "@/app/components/admin-dashboard/EmptyState";
import { Skeleton } from "@/app/components/ui/skeleton";
import { formatKstDateTime } from "@/lib/attendance/format";
import type { AttendanceRankingRow } from "@/lib/attendance/types";

type SortKey = keyof Pick<
  AttendanceRankingRow,
  | "rank"
  | "name"
  | "studentId"
  | "campus"
  | "chapelCount"
  | "retreatCount"
  | "totalCount"
  | "attendanceRate"
  | "lastAttendedAt"
>;
type SortDirection = "asc" | "desc";

interface ColumnConfig {
  key: SortKey;
  label: string;
  /** 헤더를 처음 클릭했을 때의 정렬 방향 */
  initialDirection: SortDirection;
  numeric: boolean;
  alignRight?: boolean;
}

const COLUMNS: ColumnConfig[] = [
  { key: "rank", label: "순위", initialDirection: "asc", numeric: true },
  { key: "name", label: "이름", initialDirection: "asc", numeric: false },
  { key: "studentId", label: "학번", initialDirection: "asc", numeric: false },
  { key: "campus", label: "캠퍼스", initialDirection: "asc", numeric: false },
  { key: "chapelCount", label: "채플", initialDirection: "desc", numeric: true, alignRight: true },
  { key: "retreatCount", label: "리트릿", initialDirection: "desc", numeric: true, alignRight: true },
  { key: "totalCount", label: "합계", initialDirection: "desc", numeric: true, alignRight: true },
  { key: "attendanceRate", label: "출석률", initialDirection: "desc", numeric: true, alignRight: true },
  { key: "lastAttendedAt", label: "최근 출석", initialDirection: "desc", numeric: false },
];

const SKELETON_ROW_COUNT = 8;
const EMPTY_PLACEHOLDER = "-";

/** 1~3위 강조 색 */
const RANK_BADGE_CLASS: Record<number, string> = {
  1: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  2: "bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
  3: "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300",
};

function compareValues(
  a: AttendanceRankingRow,
  b: AttendanceRankingRow,
  column: ColumnConfig
): number {
  const left = a[column.key];
  const right = b[column.key];

  if (column.numeric) return Number(left ?? 0) - Number(right ?? 0);
  // 값이 비어 있는 행은 항상 뒤로 보낸다
  if (!left && !right) return 0;
  if (!left) return 1;
  if (!right) return -1;
  return String(left).localeCompare(String(right), "ko");
}

function renderCell(row: AttendanceRankingRow, key: SortKey): string {
  switch (key) {
    case "attendanceRate":
      return `${row.attendanceRate}%`;
    case "lastAttendedAt":
      return formatKstDateTime(row.lastAttendedAt);
    case "studentId":
      return row.studentId || EMPTY_PLACEHOLDER;
    case "campus":
      return row.campus || EMPTY_PLACEHOLDER;
    default:
      return String(row[key]);
  }
}

interface AttendanceRankingTableProps {
  rows: AttendanceRankingRow[];
  isLoading: boolean;
  /** 이름 또는 학번 검색어 */
  search: string;
}

export function AttendanceRankingTable({
  rows,
  isLoading,
  search,
}: AttendanceRankingTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [direction, setDirection] = useState<SortDirection>("asc");

  const visibleRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const filtered = keyword
      ? rows.filter(
          (row) =>
            row.name.toLowerCase().includes(keyword) ||
            (row.studentId ?? "").toLowerCase().includes(keyword)
        )
      : rows;

    const column = COLUMNS.find((item) => item.key === sortKey) ?? COLUMNS[0];
    const sign = direction === "asc" ? 1 : -1;
    return [...filtered].sort(
      (a, b) => compareValues(a, b, column) * sign || a.rank - b.rank
    );
  }, [rows, search, sortKey, direction]);

  const handleSort = (column: ColumnConfig) => {
    if (column.key === sortKey) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(column.key);
    setDirection(column.initialDirection);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
          <Skeleton key={index} className="h-11 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title="출석 기록이 없습니다"
        description="선택한 학기와 구분에 해당하는 출석 기록이 아직 없습니다."
      />
    );
  }

  if (visibleRows.length === 0) {
    return (
      <EmptyState
        title="검색 결과가 없습니다"
        description={`"${search}" 와 일치하는 이름 또는 학번이 없습니다.`}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            {COLUMNS.map((column) => {
              const isActive = column.key === sortKey;
              const SortIcon = !isActive
                ? ArrowUpDown
                : direction === "asc"
                  ? ArrowUp
                  : ArrowDown;
              return (
                <th
                  key={column.key}
                  className={`whitespace-nowrap px-4 py-3 font-medium ${
                    column.alignRight ? "text-right" : "text-left"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSort(column)}
                    className={`inline-flex items-center gap-1 transition-colors hover:text-foreground ${
                      isActive ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {column.label}
                    <SortIcon className="h-3.5 w-3.5" />
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row) => (
            <tr key={row.userId} className="border-t hover:bg-muted/30">
              {COLUMNS.map((column) => (
                <td
                  key={column.key}
                  className={`whitespace-nowrap px-4 py-2.5 ${
                    column.alignRight ? "text-right tabular-nums" : "text-left"
                  }`}
                >
                  {column.key === "rank" ? (
                    <span
                      className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-semibold ${
                        RANK_BADGE_CLASS[row.rank] ?? "text-muted-foreground"
                      }`}
                    >
                      {row.rank}
                    </span>
                  ) : (
                    <span className={column.key === "name" ? "font-medium" : ""}>
                      {renderCell(row, column.key)}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
