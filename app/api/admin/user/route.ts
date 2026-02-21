import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.");
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

async function verifyAdmin(): Promise<boolean> {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) return false;

  const adminClient = getAdminClient();
  const { data, error } = await adminClient
    .from("user_info")
    .select("is_admin")
    .eq("id", userId)
    .single();

  return !error && data?.is_admin === true;
}

/** GET /api/admin/user?id=xxx - 프로덕션에서 동적 [id] 404 시 쿼리 파라미터로 대체 */
export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { ok: false, reason: "관리자 권한이 필요합니다." },
      { status: 403 }
    );
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { ok: false, reason: "id 쿼리 파라미터가 필요합니다." },
      { status: 400 }
    );
  }

  const adminClient = getAdminClient();
  let profiles: Record<string, unknown> = {};
  let authUser: { email?: string; email_confirmed_at?: string; user_metadata?: Record<string, unknown> } | null = null;

  try {
    const [profilesRes, authUserRes] = await Promise.all([
      adminClient.from("profiles").select("*").eq("id", id).maybeSingle(),
      adminClient.auth.admin.getUserById(id),
    ]);
    profiles = (profilesRes.data ?? {}) as Record<string, unknown>;
    authUser = authUserRes.data?.user ?? null;
  } catch {
    // 삭제된 사용자 등
  }

  const merged: Record<string, unknown> = {
    ...profiles,
    ...(authUser && {
      email: authUser.email,
      email_confirmed_at: authUser.email_confirmed_at,
      raw_user_meta_data: authUser.user_metadata,
    }),
  };

  return NextResponse.json({ ok: true, data: merged });
}
