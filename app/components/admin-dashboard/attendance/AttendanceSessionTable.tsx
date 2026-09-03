"use client";

import { formatKstDateTime } from "@/lib/attendance/format";
import type { AttendanceSessionRow } from "@/lib/attendance/types";

const EMPTY_PLACEHOLDER = "-";

interface AttendanceSessionTableProps {
  sessions: AttendanceSessionRow[];
}

/** 채플 회차별 출석 인원 — 순위표만으로는 보이지 않는 회차별 편차를 확인한다. */
export function AttendanceSessionTable({ sessions }: AttendanceSessionTableProps) {
  if (sessions.length === 0) {
    return (
      <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        선택한 학기에 등록된 채플 일정이 없습니다.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            <th className="whitespace-nowrap px-4 py-3 text-left font-medium">채플 일시</th>
            <th className="px-4 py-3 text-left font-medium">주제</th>
            <th className="whitespace-nowrap px-4 py-3 text-left font-medium">장소</th>
            <th className="whitespace-nowrap px-4 py-3 text-left font-medium">리트릿 일시</th>
            <th className="whitespace-nowrap px-4 py-3 text-right font-medium">채플</th>
            <th className="whitespace-nowrap px-4 py-3 text-right font-medium">리트릿</th>
            <th className="whitespace-nowrap px-4 py-3 text-right font-medium">합계</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr key={session.chapelId} className="border-t hover:bg-muted/30">
              <td className="whitespace-nowrap px-4 py-2.5">
                {formatKstDateTime(session.datetime)}
              </td>
              <td className="px-4 py-2.5 font-medium">{session.topic}</td>
              <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                {session.place || EMPTY_PLACEHOLDER}
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                {session.retreatDatetime
                  ? formatKstDateTime(session.retreatDatetime)
                  : EMPTY_PLACEHOLDER}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums">{session.chapelCount}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">{session.retreatCount}</td>
              <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                {session.totalCount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
