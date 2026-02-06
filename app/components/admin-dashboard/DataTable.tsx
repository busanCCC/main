"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Trash2, Pencil, ArrowUpDown } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Skeleton } from "@/app/components/ui/skeleton";
import { EmptyState } from "./EmptyState";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { useRecordMutation } from "@/app/(pages)/admin-dashboard/hooks/useRecordMutation";
import {
  ITEMS_PER_PAGE,
  SEARCH_DEBOUNCE_MS,
} from "@/app/(pages)/admin-dashboard/table-config";
import type { TableMeta } from "@/app/(pages)/admin-dashboard/table-config";

interface DataTableProps {
  tableMeta: TableMeta;
  data: Record<string, unknown>[];
  totalCount: number;
  isLoading: boolean;
  page: number;
  search: string;
  onPageChange: (page: number) => void;
  onSearchChange: (search: string) => void;
  onSortChange: (column: string) => void;
  onRefetch: () => void;
}

export function DataTable({
  tableMeta,
  data,
  totalCount,
  isLoading,
  page,
  search,
  onPageChange,
  onSearchChange,
  onSortChange,
  onRefetch,
}: DataTableProps) {
  const router = useRouter();
  const { deleteRecord } = useRecordMutation();
  const [searchInput, setSearchInput] = useState(search);
  const [deleteTarget, setDeleteTarget] = useState<number | string | null>(null);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // 디바운스된 검색 (SEARCH_DEBOUNCE_MS 상수 사용)
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchInput);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput, onSearchChange]);

  const handleDelete = useCallback(async () => {
    if (deleteTarget === null) return;
    const result = await deleteRecord(tableMeta.tableName, deleteTarget);
    if (result.ok) {
      onRefetch();
    }
  }, [deleteTarget, deleteRecord, tableMeta.tableName, onRefetch]);

  const formatCellValue = (value: unknown): string => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "boolean") return value ? "Y" : "N";
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`${tableMeta.label} 검색...`}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          onClick={() =>
            router.push(`/admin-dashboard/${tableMeta.tableName}/new`)
          }
        >
          <Plus className="h-4 w-4 mr-2" />
          새로 만들기
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <EmptyState
          title="데이터가 없습니다"
          description={`아직 ${tableMeta.label} 데이터가 없습니다. 새로 만들어보세요.`}
          actionLabel="새로 만들기"
          onAction={() =>
            router.push(`/admin-dashboard/${tableMeta.tableName}/new`)
          }
        />
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  {tableMeta.listColumns.map((col) => (
                    <th
                      key={col}
                      className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => onSortChange(col)}
                    >
                      <span className="flex items-center gap-1">
                        {col}
                        <ArrowUpDown className="h-3 w-3" />
                      </span>
                    </th>
                  ))}
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground w-24">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => {
                  const rowId = row[tableMeta.primaryKey] as number | string;
                  return (
                    <tr
                      key={rowId}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      {tableMeta.listColumns.map((col) => (
                        <td key={col} className="px-4 py-3 max-w-[200px] truncate">
                          {formatCellValue(row[col])}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              router.push(
                                `/admin-dashboard/${tableMeta.tableName}/${rowId}`
                              )
                            }
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(rowId)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            총 {totalCount}건 중 {(page - 1) * ITEMS_PER_PAGE + 1}-
            {Math.min(page * ITEMS_PER_PAGE, totalCount)}건
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              이전
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              다음
            </Button>
          </div>
        </div>
      )}

      {/* Delete dialog */}
      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}
