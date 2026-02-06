"use client";

import { useParams, notFound } from "next/navigation";
import { DataTable } from "@/app/components/admin-dashboard/DataTable";
import { useTableData } from "../hooks/useTableData";
import { getTableMeta, getValidTableNames } from "../table-config";

export default function TableListPage() {
  const params = useParams();
  const tableName = params.table as string;
  const tableMeta = getTableMeta(tableName);

  const {
    data,
    totalCount,
    isLoading,
    page,
    search,
    setPage,
    setSearch,
    setOrderBy,
    refetch,
  } = useTableData({
    tableName: tableMeta?.tableName ?? "",
    searchColumn: tableMeta?.searchColumn ?? "title",
    defaultOrderBy: tableMeta?.defaultSort.column ?? "id",
    defaultAscending: tableMeta?.defaultSort.ascending ?? false,
  });

  if (!tableMeta || !getValidTableNames().includes(tableName)) {
    notFound();
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{tableMeta.label}</h1>
        <p className="text-muted-foreground mt-1">{tableMeta.description}</p>
      </div>

      <DataTable
        tableMeta={tableMeta}
        data={data}
        totalCount={totalCount}
        isLoading={isLoading}
        page={page}
        search={search}
        onPageChange={setPage}
        onSearchChange={setSearch}
        onSortChange={setOrderBy}
        onRefetch={refetch}
      />
    </div>
  );
}
