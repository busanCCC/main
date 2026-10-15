import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  adminAuthErrorResponse,
  authenticateAdmin,
  getAdminClient,
} from "@/lib/admin/adminAuth";
import {
  MAX_PAGE_SIZE,
  canPerform,
  formatZodError,
  getTablePolicy,
  recordIdSchema,
  type AdminOperation,
  type TablePolicy,
} from "./table-policy";

// --- 공통 응답 헬퍼 ---

function fail(reason: string, status: number) {
  return NextResponse.json({ ok: false, reason }, { status });
}

/** 테이블 화이트리스트와 작업 권한을 함께 확인 */
function authorizeTable(
  table: unknown,
  operation: AdminOperation
): { policy: TablePolicy } | { response: NextResponse } {
  const policy = getTablePolicy(table);
  if (!policy) {
    return { response: fail("허용되지 않은 테이블입니다.", 400) };
  }
  if (!canPerform(policy, operation)) {
    return { response: fail("이 테이블에서 허용되지 않은 작업입니다.", 403) };
  }
  return { policy };
}

/** URL 쿼리의 id 는 문자열이므로 숫자 PK 도 문자열 형태로 검증 */
function parseRecordId(raw: unknown) {
  return recordIdSchema.safeParse(typeof raw === "number" ? raw : String(raw ?? ""));
}

async function readJsonBody(request: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === "object" && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}

/** ilike 패턴의 와일드카드를 리터럴로 취급 */
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(20),
  search: z.string().max(100).default(""),
  searchColumn: z.string().default(""),
  filterColumn: z.string().default(""),
  filterValue: z.string().max(200).default(""),
  orderBy: z.string().default("id"),
  ascending: z.enum(["true", "false"]).default("false"),
});

/** 빈 문자열 쿼리 파라미터는 미지정으로 취급 */
function queryParams(searchParams: URLSearchParams): Record<string, string> {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    if (value !== "") params[key] = value;
  });
  return params;
}

// --- GET: 목록 조회, 단건 조회, 배치 카운트 ---
export async function GET(request: NextRequest) {
  const adminAuth = await authenticateAdmin();
  if (!adminAuth.ok) return adminAuthErrorResponse(adminAuth);

  const { searchParams } = new URL(request.url);
  const table = searchParams.get("table");
  const tablesParam = searchParams.get("tables");
  const id = searchParams.get("id");

  const adminClient = getAdminClient();

  // 배치 카운트 조회 (tables=table1,table2 → 1회 요청으로 모든 카운트)
  if (tablesParam) {
    const tableNames = tablesParam.split(",").map((t) => t.trim()).filter(Boolean);
    for (const name of tableNames) {
      const auth = authorizeTable(name, "list");
      if ("response" in auth) return auth.response;
    }

    const counts: Record<string, number> = {};
    await Promise.all(
      tableNames.map(async (t) => {
        const { count } = await adminClient
          .from(t)
          .select("*", { count: "exact", head: true });
        counts[t] = count ?? 0;
      })
    );
    return NextResponse.json({ ok: true, data: counts });
  }

  if (!table) return fail("테이블명이 필요합니다.", 400);

  // 단건 조회
  if (id) {
    const auth = authorizeTable(table, "read");
    if ("response" in auth) return auth.response;

    const parsedId = parseRecordId(id);
    if (!parsedId.success) return fail("올바르지 않은 ID입니다.", 400);

    const { data, error } = await adminClient
      .from(table)
      .select("*")
      .eq("id", parsedId.data)
      .single();

    if (error) {
      return NextResponse.json({ ok: false, reason: error.message });
    }
    return NextResponse.json({ ok: true, data });
  }

  // 목록 조회
  const auth = authorizeTable(table, "list");
  if ("response" in auth) return auth.response;
  const { policy } = auth;

  const parsedQuery = listQuerySchema.safeParse(queryParams(searchParams));
  if (!parsedQuery.success) {
    return fail(formatZodError(parsedQuery.error), 400);
  }
  const { page, pageSize, search, searchColumn, filterColumn, filterValue, orderBy, ascending } =
    parsedQuery.data;

  if (!policy.sortColumns.includes(orderBy)) {
    return fail("허용되지 않은 정렬 컬럼입니다.", 400);
  }
  if (searchColumn && !policy.searchColumns.includes(searchColumn)) {
    return fail("허용되지 않은 검색 컬럼입니다.", 400);
  }
  if (filterColumn && !policy.filterColumns.includes(filterColumn)) {
    return fail("허용되지 않은 필터 컬럼입니다.", 400);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = adminClient
    .from(table)
    .select("*", { count: "exact" })
    .order(orderBy, { ascending: ascending === "true" })
    .range(from, to);

  if (search.trim() !== "" && searchColumn) {
    query = query.ilike(searchColumn, `%${escapeLikePattern(search.trim())}%`);
  }

  if (filterColumn && filterValue !== "") {
    query = query.eq(filterColumn, filterValue);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ ok: false, reason: error.message });
  }

  return NextResponse.json({
    ok: true,
    data: { rows: data ?? [], count: count ?? 0 },
  });
}

// --- POST: 레코드 생성 (onConflict 지정 시 upsert) ---
export async function POST(request: NextRequest) {
  const adminAuth = await authenticateAdmin();
  if (!adminAuth.ok) return adminAuthErrorResponse(adminAuth);

  const body = await readJsonBody(request);
  if (!body) return fail("잘못된 요청 본문입니다.", 400);
  const { table, data: recordData, onConflict } = body;

  if (!table || !recordData) {
    return fail("테이블명과 데이터가 필요합니다.", 400);
  }

  const auth = authorizeTable(table, "create");
  if ("response" in auth) return auth.response;
  const { policy } = auth;

  // upsert 는 기존 행을 덮어쓰므로 수정 권한과 허용된 충돌 키가 모두 필요
  if (onConflict !== undefined) {
    if (
      !canPerform(policy, "update") ||
      typeof onConflict !== "string" ||
      !policy.upsertConflicts?.includes(onConflict)
    ) {
      return fail("허용되지 않은 upsert 요청입니다.", 403);
    }
  }

  const parsed = policy.writeSchema.safeParse(recordData);
  if (!parsed.success) {
    return fail(formatZodError(parsed.error), 422);
  }

  const adminClient = getAdminClient();
  const tableName = table as string;
  const mutation =
    typeof onConflict === "string"
      ? adminClient.from(tableName).upsert(parsed.data, { onConflict })
      : adminClient.from(tableName).insert(parsed.data);

  const { data, error } = await mutation.select().single();

  if (error) {
    return NextResponse.json({ ok: false, reason: error.message });
  }

  return NextResponse.json({ ok: true, data });
}

// --- PUT: 레코드 수정 ---
export async function PUT(request: NextRequest) {
  const adminAuth = await authenticateAdmin();
  if (!adminAuth.ok) return adminAuthErrorResponse(adminAuth);

  const body = await readJsonBody(request);
  if (!body) return fail("잘못된 요청 본문입니다.", 400);
  const { table, id, data: recordData } = body;

  if (!table || id == null || !recordData) {
    return fail("테이블명, ID, 데이터가 필요합니다.", 400);
  }

  const auth = authorizeTable(table, "update");
  if ("response" in auth) return auth.response;

  const parsedId = parseRecordId(id);
  if (!parsedId.success) return fail("올바르지 않은 ID입니다.", 400);

  const parsed = auth.policy.writeSchema.partial().safeParse(recordData);
  if (!parsed.success) {
    return fail(formatZodError(parsed.error), 422);
  }
  if (Object.keys(parsed.data).length === 0) {
    return fail("수정할 데이터가 없습니다.", 400);
  }

  const adminClient = getAdminClient();
  const { data, error } = await adminClient
    .from(table as string)
    .update(parsed.data)
    .eq("id", parsedId.data)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, reason: error.message });
  }

  return NextResponse.json({ ok: true, data });
}

// --- DELETE: 레코드 삭제 ---
export async function DELETE(request: NextRequest) {
  const adminAuth = await authenticateAdmin();
  if (!adminAuth.ok) return adminAuthErrorResponse(adminAuth);

  const { searchParams } = new URL(request.url);
  const table = searchParams.get("table");
  const id = searchParams.get("id");

  if (!table || !id) {
    return fail("테이블명과 ID가 필요합니다.", 400);
  }

  const auth = authorizeTable(table, "delete");
  if ("response" in auth) return auth.response;

  const parsedId = parseRecordId(id);
  if (!parsedId.success) return fail("올바르지 않은 ID입니다.", 400);

  const adminClient = getAdminClient();
  const { data, error } = await adminClient
    .from(table)
    .delete()
    .eq("id", parsedId.data)
    .select();

  if (error) {
    return NextResponse.json({ ok: false, reason: error.message });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({
      ok: false,
      reason: "레코드를 찾을 수 없습니다.",
    });
  }

  return NextResponse.json({ ok: true, data: null });
}
