"use client";

import { CalendarDays } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";

// --- 매직넘버 상수화 (Readability) ---
const DAYS_IN_WEEK = 7;
const SUNDAY = 0;

// --- 날짜 유틸 (Cohesion: 컴포넌트 내 인라인 정의) ---

/** 주어진 날짜 기준으로 이번 주 일요일(또는 오늘이 일요일이면 오늘)을 반환 */
function getThisSunday(base: Date = new Date()): Date {
  const d = new Date(base);
  const day = d.getDay();
  const diff = day === SUNDAY ? 0 : DAYS_IN_WEEK - day;
  d.setDate(d.getDate() + diff);
  return d;
}

/** 다음 주 일요일을 반환 */
function getNextSunday(base: Date = new Date()): Date {
  const thisSunday = getThisSunday(base);
  const next = new Date(thisSunday);
  next.setDate(next.getDate() + DAYS_IN_WEEK);
  return next;
}

/** Date를 YYYY-MM-DD 문자열로 변환 */
function formatDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 두 날짜 문자열 사이의 일수 차이 */
function daysBetween(from: string, until: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = new Date(until).getTime() - new Date(from).getTime();
  return Math.round(diff / msPerDay);
}

// --- 게시 상태 타입 및 판별 (named condition, Readability) ---
type PublishStatus = "unset" | "scheduled" | "active" | "expired";

function getPublishStatus(activeFrom: string, activeUntil: string): PublishStatus {
  const hasBothDates = activeFrom !== "" && activeUntil !== "";
  if (!hasBothDates) return "unset";

  const today = formatDateString(new Date());
  const isBeforeStart = today < activeFrom;
  const isWithinPeriod = today >= activeFrom && today < activeUntil;

  if (isBeforeStart) return "scheduled";
  if (isWithinPeriod) return "active";
  return "expired";
}

// --- 상태별 배지 설정 ---
const STATUS_CONFIG: Record<
  PublishStatus,
  { label: string; className: string } | null
> = {
  unset: null,
  scheduled: {
    label: "게시 예정",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  active: {
    label: "게시 중",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  expired: {
    label: "게시 종료",
    className: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  },
};

// --- Props ---
interface PublishPeriodSectionProps {
  activeFrom: string;
  activeUntil: string;
  onChangeFrom: (value: string) => void;
  onChangeUntil: (value: string) => void;
  errorFrom?: string;
  errorUntil?: string;
}

// --- 메인 컴포넌트 ---
export function PublishPeriodSection({
  activeFrom,
  activeUntil,
  onChangeFrom,
  onChangeUntil,
  errorFrom,
  errorUntil,
}: PublishPeriodSectionProps) {
  const publishStatus = getPublishStatus(activeFrom, activeUntil);
  const badgeConfig = STATUS_CONFIG[publishStatus];

  const hasBothDates = activeFrom !== "" && activeUntil !== "";
  const periodDays = hasBothDates ? daysBetween(activeFrom, activeUntil) : 0;
  const isPeriodValid = periodDays > 0;

  // 단축 버튼 핸들러
  const handleThisWeek = () => {
    const from = getThisSunday();
    const until = getNextSunday();
    onChangeFrom(formatDateString(from));
    onChangeUntil(formatDateString(until));
  };

  const handleNextWeek = () => {
    const from = getNextSunday();
    const until = new Date(from);
    until.setDate(until.getDate() + DAYS_IN_WEEK);
    onChangeFrom(formatDateString(from));
    onChangeUntil(formatDateString(until));
  };

  return (
    <div className="space-y-4 pt-4 border-t">
      {/* 헤더 + 상태 배지 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-base font-semibold">게시 기간</h3>
            <p className="text-sm text-muted-foreground">
              이 흐름이 사용자에게 노출되는 기간입니다.
            </p>
          </div>
        </div>
        {badgeConfig && (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeConfig.className}`}
          >
            {badgeConfig.label}
          </span>
        )}
      </div>

      {/* 날짜 입력 (2-column grid) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="active_from">
            시작일<span className="text-destructive ml-1">*</span>
          </Label>
          <Input
            id="active_from"
            type="date"
            value={activeFrom}
            onChange={(e) => onChangeFrom(e.target.value)}
            className={errorFrom ? "border-destructive" : ""}
          />
          {errorFrom && (
            <p className="text-sm text-destructive">{errorFrom}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="active_until">
            종료일<span className="text-destructive ml-1">*</span>
          </Label>
          <Input
            id="active_until"
            type="date"
            value={activeUntil}
            onChange={(e) => onChangeUntil(e.target.value)}
            className={errorUntil ? "border-destructive" : ""}
          />
          {errorUntil && (
            <p className="text-sm text-destructive">{errorUntil}</p>
          )}
        </div>
      </div>

      {/* 단축 버튼 */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleThisWeek}
        >
          이번 주 일요일~
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleNextWeek}
        >
          다음 주 일요일~
        </Button>
      </div>

      {/* 기간 요약 */}
      {hasBothDates && isPeriodValid && (
        <p className="text-sm text-muted-foreground">
          {periodDays}일간 게시됩니다.
        </p>
      )}
      {hasBothDates && !isPeriodValid && (
        <p className="text-sm text-destructive">
          종료일은 시작일 이후여야 합니다.
        </p>
      )}
    </div>
  );
}
