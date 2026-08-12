"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Languages } from "lucide-react";
import { StatCard } from "@/app/components/admin-dashboard/StatCard";
import { Button } from "@/app/components/ui/button";
import { fetchAllTableCounts } from "./actions";
import { tableConfig } from "./table-config";

export default function AdminDashboardPage() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const tableNames = Object.keys(tableConfig);
    fetchAllTableCounts(tableNames).then((result) => {
      if (result.ok) setCounts(result.data);
    });
  }, []);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">관리자 대시보드</h1>
        <p className="text-muted-foreground mt-1">
          콘텐츠 데이터를 관리할 수 있습니다.
        </p>
      </div>

      {/* Interpretation shortcut */}
      <div className="mb-8 rounded-xl border bg-card p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Languages className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">실시간 통번역</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            행사/예배 실시간 AI 통번역 세션을 생성하고 Live Console에서 운영합니다.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin-dashboard/interpretation">통번역 관리</Link>
        </Button>
      </div>

      {/* Stat Cards - 1회 배치 조회로 6회→1회 축소 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(tableConfig).map(([key, meta]) => (
          <StatCard
            key={key}
            tableName={key}
            label={meta.label}
            description={meta.description}
            icon={meta.icon}
            count={counts[key]}
          />
        ))}
      </div>
    </div>
  );
}
