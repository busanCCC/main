import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/** RLS를 우회해야 하는 관리자 조회 전용 클라이언트 */
export function getAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceKey) {
    throw new Error("Supabase 관리자 환경 변수가 설정되지 않았습니다.");
  }

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

/**
 * 요청자가 관리자이면 사용자 ID를, 아니면 null 을 반환한다.
 * getSession() 은 쿠키의 JWT 를 서명 검증 없이 읽으므로,
 * service role 로 RLS 를 우회하는 관리자 API 에서는 getUser() 로 토큰을 검증한다.
 */
export async function getVerifiedAdminId(): Promise<string | null> {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return null;

  const { data, error } = await getAdminClient()
    .from("user_info")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return !error && data?.is_admin === true ? user.id : null;
}

/** 요청자가 user_info.is_admin 인지 확인한다. */
export async function verifyAdmin(): Promise<boolean> {
  return (await getVerifiedAdminId()) !== null;
}
