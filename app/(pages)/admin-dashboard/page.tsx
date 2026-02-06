"use client";

import { StatCard } from "@/app/components/admin-dashboard/StatCard";
import { tableConfig } from "./table-config";

export default function AdminDashboardPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">관리자 대시보드</h1>
        <p className="text-muted-foreground mt-1">
          콘텐츠 데이터를 관리할 수 있습니다.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(tableConfig).map(([key, meta]) => (
          <StatCard
            key={key}
            tableName={key}
            label={meta.label}
            description={meta.description}
            icon={meta.icon}
          />
        ))}
      </div>
    </div>
  );
}
