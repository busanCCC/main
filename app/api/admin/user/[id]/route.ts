import { NextRequest, NextResponse } from "next/server";
import { adminAuthErrorResponse, authenticateAdmin, getAdminClient } from "@/lib/admin/adminAuth";

export const dynamic = "force-dynamic";

/** GET /api/admin/user/[id] - profiles + auth.users(이메일 등) 조합 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateAdmin();
  if (!auth.ok) return adminAuthErrorResponse(auth);

  const { id } = params;
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
    // 삭제된 사용자 등으로 조회 실패 시 빈 데이터 반환 (404 대신 200)
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
