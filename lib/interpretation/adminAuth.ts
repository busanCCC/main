import { createClient } from "@supabase/supabase-js";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!.trim();
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function verifyInterpretationAdmin(): Promise<{
  ok: boolean;
  userId?: string;
}> {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) return { ok: false };

  const adminClient = getAdminClient();
  const { data, error } = await adminClient
    .from("user_info")
    .select("is_admin")
    .eq("id", userId)
    .single();

  if (error || data?.is_admin !== true) return { ok: false };
  return { ok: true, userId };
}
