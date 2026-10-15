import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/** RLS를 우회해야 하는 관리자 작업 전용 클라이언트 */
export function getAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceKey) {
    throw new Error("Supabase 관리자 환경 변수가 설정되지 않았습니다.");
  }

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export type AdminAuthResult =
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 403; reason: string };

/**
 * 관리자 API 공통 인증·인가.
 * 1) 인증: getUser() 로 Auth 서버에서 JWT 를 검증한다.
 *    getSession() 은 쿠키의 JWT 를 서명 검증 없이 읽으므로 service role 을 쓰는 API 에서 사용하지 않는다.
 * 2) 인가: 검증된 사용자 ID 로 user_info.is_admin 을 조회한다.
 *    (클라이언트의 is_admin 변경은 protect_user_info_is_admin 트리거가 차단)
 */
export async function authenticateAdmin(): Promise<AdminAuthResult> {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false, status: 401, reason: "로그인이 필요합니다." };
  }

  const { data, error } = await getAdminClient()
    .from("user_info")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (error || data?.is_admin !== true) {
    return { ok: false, status: 403, reason: "관리자 권한이 필요합니다." };
  }
  return { ok: true, userId: user.id };
}

export function adminAuthErrorResponse(
  result: Extract<AdminAuthResult, { ok: false }>
) {
  return NextResponse.json(
    { ok: false, reason: result.reason },
    { status: result.status }
  );
}
