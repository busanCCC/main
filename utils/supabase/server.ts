import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export function createClient_s() {
  return createServerComponentClient({ cookies });
}
