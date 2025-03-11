"use client";

import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

export const createClient = () => {
  return createPagesBrowserClient();
};

// 클라이언트에서 싱글톤 패턴을 적용하여 재사용
const browserClient = createClient();
export default browserClient;
