"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Skeleton } from "@/app/components/ui/skeleton";
import { RecordForm } from "@/app/components/admin-dashboard/RecordForm";
import { WeeklyFlowForm } from "@/app/components/admin-dashboard/WeeklyFlowForm";
import { DeleteConfirmDialog } from "@/app/components/admin-dashboard/DeleteConfirmDialog";
import { useRecordMutation } from "../../hooks/useRecordMutation";
import { fetchRecord } from "../../actions";
import { getTableMeta, getValidTableNames } from "../../table-config";

export default function EditRecordPage() {
  const params = useParams();
  const router = useRouter();
  const tableName = params.table as string;
  const recordId = params.id as string;

  const [record, setRecord] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const { updateRecord, deleteRecord } = useRecordMutation();
  const tableMeta = getTableMeta(tableName);

  useEffect(() => {
    if (!tableMeta) return;

    async function loadRecord() {
      const result = await fetchRecord(tableMeta!.tableName, recordId);
      if (result.ok) {
        setRecord(result.data);
      }
      setIsLoading(false);
    }
    loadRecord();
  }, [tableMeta, recordId]);

  if (!tableMeta || !getValidTableNames().includes(tableName)) {
    notFound();
  }

  const handleDelete = async () => {
    const result = await deleteRecord(tableMeta.tableName, recordId);
    if (result.ok) {
      router.push(`/admin-dashboard/${tableName}`);
    }
  };

  const handleBack = () => {
    router.push(`/admin-dashboard/${tableName}`);
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!record) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">레코드를 찾을 수 없습니다.</p>
        <Button variant="outline" onClick={handleBack} className="mt-4">
          목록으로 돌아가기
        </Button>
      </div>
    );
  }

  // weekly_flows 전용 폼 분기 (Separating Code Paths)
  if (tableName === "weekly_flows") {
    return (
      <div className="p-8">
        <WeeklyFlowForm
          defaultValues={record}
          mode="edit"
          recordId={recordId}
          onSubmitSuccess={() => router.push(`/admin-dashboard/${tableName}`)}
          onBack={handleBack}
        />

        {/* Delete section */}
        <div className="max-w-2xl mt-12 pt-8 border-t">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-destructive">
                위험 영역
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                이 레코드를 영구적으로 삭제합니다.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDelete(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              삭제
            </Button>
          </div>
        </div>

        <DeleteConfirmDialog
          open={showDelete}
          onOpenChange={setShowDelete}
          onConfirm={handleDelete}
        />
      </div>
    );
  }

  const handleSubmit = async (data: Record<string, unknown>) => {
    setIsSubmitting(true);
    const result = await updateRecord(tableMeta.tableName, recordId, data);
    setIsSubmitting(false);

    if (result.ok) {
      router.push(`/admin-dashboard/${tableName}`);
    }
  };

  return (
    <div className="p-8">
      <RecordForm
        tableMeta={tableMeta}
        defaultValues={record}
        onSubmit={handleSubmit}
        onBack={handleBack}
        isSubmitting={isSubmitting}
        mode="edit"
      />

      {/* Delete section */}
      <div className="max-w-2xl mt-12 pt-8 border-t">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-destructive">
              위험 영역
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              이 레코드를 영구적으로 삭제합니다.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDelete(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            삭제
          </Button>
        </div>
      </div>

      <DeleteConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        onConfirm={handleDelete}
      />
    </div>
  );
}
