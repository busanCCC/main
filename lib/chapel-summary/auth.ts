import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/** RLS 를 우회해야 하는 관리자 작업용 클라이언트 */
export function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.");
  }

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

/** 요청자가 관리자인지 확인한다 (getSession: 쿠키만 읽음, token 요청 없음) */
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
