import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

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

/** GET /api/admin/user/[id] - profiles + auth.users(이메일 등) 조합 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { ok: false, reason: "관리자 권한이 필요합니다." },
      { status: 403 }
    );
  }

  const { id } = await params;
  const adminClient = getAdminClient();

  const [profilesRes, authUserRes] = await Promise.all([
    adminClient.from("profiles").select("*").eq("id", id).maybeSingle(),
    adminClient.auth.admin.getUserById(id),
  ]);

  const profiles = (profilesRes.data ?? {}) as Record<string, unknown>;
  const authUser = authUserRes.data?.user;

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
