"use client";

import { createClient } from "@/utils/supabase/client";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { useState } from "react";

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [supabase] = useState(() => createClient());

  return (
    <SessionContextProvider supabaseClient={supabase}>
      {children}
    </SessionContextProvider>
  );
}
