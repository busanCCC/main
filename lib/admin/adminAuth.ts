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

/** 요청자가 user_info.is_admin 인지 확인한다. */
export async function verifyAdmin(): Promise<boolean> {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) return false;

  const { data, error } = await getAdminClient()
    .from("user_info")
    .select("is_admin")
    .eq("id", userId)
    .single();

  return !error && data?.is_admin === true;
}
