"use client";

import { useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import { RecordForm } from "@/app/components/admin-dashboard/RecordForm";
import { WeeklyFlowForm } from "@/app/components/admin-dashboard/WeeklyFlowForm";
import { useRecordMutation } from "../../hooks/useRecordMutation";
import { getTableMeta, getValidTableNames } from "../../table-config";

export default function CreateRecordPage() {
  const params = useParams();
  const router = useRouter();
  const tableName = params.table as string;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createRecord } = useRecordMutation();
  const tableMeta = getTableMeta(tableName);

  if (!tableMeta || !getValidTableNames().includes(tableName)) {
    notFound();
  }

  const handleBack = () => {
    router.push(`/admin-dashboard/${tableName}`);
  };

  // weekly_flows 전용 폼 분기 (Separating Code Paths)
  if (tableName === "weekly_flows") {
    return (
      <div className="p-8">
        <WeeklyFlowForm
          mode="create"
          onSubmitSuccess={() => router.push(`/admin-dashboard/${tableName}`)}
          onBack={handleBack}
        />
      </div>
    );
  }

  const handleSubmit = async (data: Record<string, unknown>) => {
    setIsSubmitting(true);
    const result = await createRecord(tableMeta.tableName, data);
    setIsSubmitting(false);

    if (result.ok) {
      router.push(`/admin-dashboard/${tableName}`);
    }
  };

  return (
    <div className="p-8">
      <RecordForm
        tableMeta={tableMeta}
        onSubmit={handleSubmit}
        onBack={handleBack}
        isSubmitting={isSubmitting}
        mode="create"
      />
    </div>
  );
}
