"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchTableData } from "../actions";
import { ITEMS_PER_PAGE } from "../table-config";

interface UseTableDataOptions {
  tableName: string;
  searchColumn: string;
  defaultOrderBy?: string;
  defaultAscending?: boolean;
}

interface UseTableDataReturn {
  data: Record<string, unknown>[];
  totalCount: number;
  isLoading: boolean;
  page: number;
  search: string;
  orderBy: string;
  ascending: boolean;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  setOrderBy: (column: string) => void;
  toggleSortDirection: () => void;
  refetch: () => void;
}

export function useTableData({
  tableName,
  searchColumn,
  defaultOrderBy = "id",
  defaultAscending = false,
}: UseTableDataOptions): UseTableDataReturn {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [orderBy, setOrderBy] = useState(defaultOrderBy);
  const [ascending, setAscending] = useState(defaultAscending);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const result = await fetchTableData(tableName, {
      page,
      pageSize: ITEMS_PER_PAGE,
      search,
      searchColumn,
      orderBy,
      ascending,
    });

    if (result.ok) {
      setData(result.data.rows);
      setTotalCount(result.data.count);
    } else {
      setData([]);
      setTotalCount(0);
    }

    setIsLoading(false);
  }, [tableName, page, search, searchColumn, orderBy, ascending]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSetSearch = useCallback((newSearch: string) => {
    setSearch(newSearch);
    setPage(1);
  }, []);

  const toggleSortDirection = useCallback(() => {
    setAscending((prev) => !prev);
  }, []);

  return {
    data,
    totalCount,
    isLoading,
    page,
    search,
    orderBy,
    ascending,
    setPage,
    setSearch: handleSetSearch,
    setOrderBy,
    toggleSortDirection,
    refetch: fetchData,
  };
}
