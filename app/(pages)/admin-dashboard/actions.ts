import type { ActionResult } from "./table-config";
import { ITEMS_PER_PAGE } from "./table-config";

// --- 서버 사이드 Admin API를 호출하는 클라이언트 유틸 (Predictability) ---
// RLS를 우회하기 위해 /api/admin 라우트를 거쳐 service role key로 DB 조작

interface FetchOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  searchColumn?: string;
  orderBy?: string;
  ascending?: boolean;
}

export async function fetchTableData(
  tableName: string,
  options: FetchOptions = {}
): Promise<ActionResult<{ rows: Record<string, unknown>[]; count: number }>> {
  const {
    page = 1,
    pageSize = ITEMS_PER_PAGE,
    search = "",
    searchColumn = "",
    orderBy = "id",
    ascending = false,
  } = options;

  const params = new URLSearchParams({
    table: tableName,
    page: String(page),
    pageSize: String(pageSize),
    search,
    searchColumn,
    orderBy,
    ascending: String(ascending),
  });

  try {
    const res = await fetch(`/api/admin?${params.toString()}`);
    const result = await res.json();
    return result;
  } catch (err) {
    return { ok: false, reason: "네트워크 오류가 발생했습니다." };
  }
}

export async function fetchRecord(
  tableName: string,
  id: number | string
): Promise<ActionResult<Record<string, unknown>>> {
  const params = new URLSearchParams({
    table: tableName,
    id: String(id),
  });

  try {
    const res = await fetch(`/api/admin?${params.toString()}`);
    const result = await res.json();
    return result;
  } catch (err) {
    return { ok: false, reason: "네트워크 오류가 발생했습니다." };
  }
}

export async function createRecord(
  tableName: string,
  data: Record<string, unknown>
): Promise<ActionResult<Record<string, unknown>>> {
  try {
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: tableName, data }),
    });
    const result = await res.json();
    return result;
  } catch (err) {
    return { ok: false, reason: "네트워크 오류가 발생했습니다." };
  }
}

export async function updateRecord(
  tableName: string,
  id: number | string,
  data: Record<string, unknown>
): Promise<ActionResult<Record<string, unknown>>> {
  try {
    const res = await fetch("/api/admin", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: tableName, id, data }),
    });
    const result = await res.json();
    return result;
  } catch (err) {
    return { ok: false, reason: "네트워크 오류가 발생했습니다." };
  }
}

export async function deleteRecord(
  tableName: string,
  id: number | string
): Promise<ActionResult<null>> {
  const params = new URLSearchParams({
    table: tableName,
    id: String(id),
  });

  try {
    const res = await fetch(`/api/admin?${params.toString()}`, {
      method: "DELETE",
    });
    const result = await res.json();
    return result;
  } catch (err) {
    return { ok: false, reason: "네트워크 오류가 발생했습니다." };
  }
}

export async function getTableCount(
  tableName: string
): Promise<ActionResult<number>> {
  const params = new URLSearchParams({
    table: tableName,
    page: "1",
    pageSize: "1",
  });

  try {
    const res = await fetch(`/api/admin?${params.toString()}`);
    const result = await res.json();
    if (result.ok) {
      return { ok: true, data: result.data.count };
    }
    return { ok: false, reason: result.reason };
  } catch (err) {
    return { ok: false, reason: "네트워크 오류가 발생했습니다." };
  }
}
