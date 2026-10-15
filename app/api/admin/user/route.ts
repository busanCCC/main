import { NextRequest, NextResponse } from "next/server";
import { adminAuthErrorResponse, authenticateAdmin, getAdminClient } from "@/lib/admin/adminAuth";

export const dynamic = "force-dynamic";

/** GET /api/admin/user?id=xxx - 프로덕션에서 동적 [id] 404 시 쿼리 파라미터로 대체 */
export async function GET(request: NextRequest) {
  const auth = await authenticateAdmin();
  if (!auth.ok) return adminAuthErrorResponse(auth);

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
