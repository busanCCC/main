"use client";

import { useCallback, useEffect, useState, type ElementType } from "react";
import {
  CalendarCheck,
  ClipboardCheck,
  Download,
  Gauge,
  Loader2,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { AttendanceRankingTable } from "@/app/components/admin-dashboard/attendance/AttendanceRankingTable";
import { AttendanceSessionTable } from "@/app/components/admin-dashboard/attendance/AttendanceSessionTable";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Skeleton } from "@/app/components/ui/skeleton";
import {
  downloadAttendanceExcel,
  fetchAttendanceSummary,
} from "@/lib/attendance/clientApi";
import type { AttendanceQuery } from "@/lib/attendance/params";
import { SEMESTER_ALL, SEMESTER_AUTO } from "@/lib/attendance/semester";
import {
  ATTENDANCE_FILTERS,
  ATTENDANCE_FILTER_LABEL,
  type AttendanceFilter,
  type AttendanceSummary,
} from "@/lib/attendance/types";

const ALL_SEMESTERS_LABEL = "전체 학기";
const STAT_CARD_COUNT = 4;

const SELECT_CLASS =
  "h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

interface StatTileProps {
  icon: ElementType;
  label: string;
  value: string;
  hint?: string;
}

function StatTile({ icon: Icon, label, value, hint }: StatTileProps) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <span className="text-2xl font-bold tabular-nums">{value}</span>
      </div>
      <h3 className="text-sm font-semibold">{label}</h3>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export default function AttendanceDashboardPage() {
  const [query, setQuery] = useState<AttendanceQuery>({
    semesterId: SEMESTER_AUTO,
    filter: "all",
  });
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [search, setSearch] = useState("");

  const loadSummary = useCallback(async () => {
    setIsLoading(true);
    try {
      setSummary(await fetchAttendanceSummary(query));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "출석 현황을 불러오지 못했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // 서버가 자동으로 고른 학기를 select에 그대로 반영한다
  const selectedSemesterId =
    query.semesterId || summary?.semesterId || SEMESTER_AUTO;

  const handleExport = async () => {
    if (!summary) return;
    setIsExporting(true);
    try {
      await downloadAttendanceExcel({
        semesterId: selectedSemesterId,
        filter: query.filter,
      });
      toast.success("엑셀 파일을 내려받았습니다.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "엑셀 파일을 만들지 못했습니다."
      );
    } finally {
      setIsExporting(false);
    }
  };

  const setFilter = (filter: AttendanceFilter) =>
    setQuery((current) => ({ ...current, filter }));

  const totals = isLoading ? null : summary?.totals;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">출석 현황</h1>
          </div>
          <p className="text-muted-foreground">
            채플·리트릿 출석을 학기별로 집계하고 순위와 명단을 확인합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadSummary} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            새로고침
          </Button>
          <Button onClick={handleExport} disabled={isExporting || !summary}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            엑셀 내보내기
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select
          value={selectedSemesterId}
          onChange={(event) =>
            setQuery((current) => ({ ...current, semesterId: event.target.value }))
          }
          className={SELECT_CLASS}
          aria-label="학기 선택"
          disabled={!summary}
        >
          {summary ? (
            <>
              {summary.semesters.map((semester) => (
                <option key={semester.id} value={semester.id}>
                  {semester.label}
                </option>
              ))}
              <option value={SEMESTER_ALL}>{ALL_SEMESTERS_LABEL}</option>
            </>
          ) : (
            <option value={SEMESTER_AUTO}>학기 불러오는 중...</option>
          )}
        </select>

        <div className="flex rounded-md border p-0.5">
          {ATTENDANCE_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setFilter(filter)}
              className={`rounded px-3 py-1.5 text-sm transition-colors ${
                query.filter === filter
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {ATTENDANCE_FILTER_LABEL[filter]}
            </button>
          ))}
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="이름 또는 학번 검색..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {!totals
          ? Array.from({ length: STAT_CARD_COUNT }).map((_, index) => (
              <Skeleton key={index} className="h-[122px] rounded-xl" />
            ))
          : [
              {
                icon: Users,
                label: "출석 인원",
                value: `${totals.participants}명`,
                hint: `${summary?.semesterLabel} · ${ATTENDANCE_FILTER_LABEL[query.filter]}`,
              },
              {
                icon: ClipboardCheck,
                label: "총 출석 횟수",
                value: `${totals.attendances}회`,
                hint: "선택한 구분의 출석 기록 합계",
              },
              {
                icon: CalendarCheck,
                label: "진행 회차",
                value: `${totals.chapelSessions + totals.retreatSessions}회`,
                hint: `채플 ${totals.chapelSessions}회 · 리트릿 ${totals.retreatSessions}회`,
              },
              {
                icon: Gauge,
                label: "회차당 평균 출석",
                value: `${totals.averagePerSession}명`,
                hint: "출석 횟수 ÷ 진행 회차",
              },
            ].map((stat) => <StatTile key={stat.label} {...stat} />)}
      </div>

      {/* Ranking */}
      <section className="mb-10">
        <div className="mb-3 flex items-baseline gap-2">
          <h2 className="font-semibold">출석 순위</h2>
          <span className="text-xs text-muted-foreground">
            항목을 클릭하면 해당 기준으로 정렬됩니다
          </span>
        </div>
        <AttendanceRankingTable
          rows={summary?.rankings ?? []}
          isLoading={isLoading}
          search={search}
        />
      </section>

      {/* Sessions */}
      <section>
        <h2 className="mb-3 font-semibold">회차별 출석</h2>
        {isLoading ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : (
          <AttendanceSessionTable sessions={summary?.sessions ?? []} />
        )}
      </section>
    </div>
  );
}
