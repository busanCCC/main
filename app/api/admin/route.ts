import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Service Role Key를 사용하여 RLS 우회
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.");
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

// 현재 요청자가 admin인지 확인
async function verifyAdmin(): Promise<boolean> {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return false;

  const { data, error } = await supabase
    .from("user_info")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return !error && data?.is_admin === true;
}

// --- GET: 목록 조회 또는 단건 조회 ---
export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { ok: false, reason: "관리자 권한이 필요합니다." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const table = searchParams.get("table");
  const id = searchParams.get("id");
  const page = Number(searchParams.get("page") ?? 1);
  const pageSize = Number(searchParams.get("pageSize") ?? 20);
  const search = searchParams.get("search") ?? "";
  const searchColumn = searchParams.get("searchColumn") ?? "";
  const orderBy = searchParams.get("orderBy") ?? "id";
  const ascending = searchParams.get("ascending") === "true";

  if (!table) {
    return NextResponse.json(
      { ok: false, reason: "테이블명이 필요합니다." },
      { status: 400 }
    );
  }

  const adminClient = getAdminClient();

  // 단건 조회
  if (id) {
    const { data, error } = await adminClient
      .from(table)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ ok: false, reason: error.message });
    }
    return NextResponse.json({ ok: true, data });
  }

  // 목록 조회
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = adminClient
    .from(table)
    .select("*", { count: "exact" })
    .order(orderBy, { ascending })
    .range(from, to);

  if (search.trim() !== "" && searchColumn) {
    query = query.ilike(searchColumn, `%${search.trim()}%`);
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

// --- POST: 레코드 생성 ---
export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { ok: false, reason: "관리자 권한이 필요합니다." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { table, data: recordData } = body;

  if (!table || !recordData) {
    return NextResponse.json(
      { ok: false, reason: "테이블명과 데이터가 필요합니다." },
      { status: 400 }
    );
  }

  const adminClient = getAdminClient();
  const { data, error } = await adminClient
    .from(table)
    .insert(recordData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, reason: error.message });
  }

  return NextResponse.json({ ok: true, data });
}

// --- PUT: 레코드 수정 ---
export async function PUT(request: NextRequest) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { ok: false, reason: "관리자 권한이 필요합니다." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { table, id, data: recordData } = body;

  if (!table || id == null || !recordData) {
    return NextResponse.json(
      { ok: false, reason: "테이블명, ID, 데이터가 필요합니다." },
      { status: 400 }
    );
  }

  const adminClient = getAdminClient();
  const { data, error } = await adminClient
    .from(table)
    .update(recordData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, reason: error.message });
  }

  return NextResponse.json({ ok: true, data });
}

// --- DELETE: 레코드 삭제 ---
export async function DELETE(request: NextRequest) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { ok: false, reason: "관리자 권한이 필요합니다." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const table = searchParams.get("table");
  const id = searchParams.get("id");

  if (!table || !id) {
    return NextResponse.json(
      { ok: false, reason: "테이블명과 ID가 필요합니다." },
      { status: 400 }
    );
  }

  const adminClient = getAdminClient();
  const { data, error } = await adminClient
    .from(table)
    .delete()
    .eq("id", id)
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
