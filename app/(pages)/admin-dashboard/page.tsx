"use client";

import { useState, useEffect } from "react";
import { StatCard } from "@/app/components/admin-dashboard/StatCard";
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
