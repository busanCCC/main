"use client";

import { useState, useEffect } from "react";
import supabase from "@/utils/supabase/client";

interface AdminAuthState {
  isAdmin: boolean;
  isLoading: boolean;
}

export function useAdminAuth(): AdminAuthState {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAdminStatus() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.warn("[AdminAuth] 인증 실패:", authError?.message ?? "유저 없음");
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_info")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (error) {
        console.warn("[AdminAuth] user_info 조회 실패:", error.message);
      }

      const hasAdminAccess = !error && data?.is_admin === true;
      setIsAdmin(hasAdminAccess);
      setIsLoading(false);
    }

    checkAdminStatus();
  }, []);

  return { isAdmin, isLoading };
}
