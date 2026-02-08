"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleLogin = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    // 로그인 성공 시 redirectTo가 있으면 해당 경로로, 없으면 홈으로 이동 (내부 경로만 허용)
    const target =
      redirectTo?.startsWith("/") && !redirectTo.startsWith("//")
        ? redirectTo
        : "/";
    router.push(target);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-center text-indigo-600 mb-2">
          로그인
        </h2>
        <input
          type="email"
          placeholder="이메일"
          className="border-2 border-blue-200 rounded-lg p-2 mb-2 w-80"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="비밀번호"
          className="border-2 border-blue-200 rounded-lg p-2 mb-2 w-80"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex flex-col gap-2">
          <button
            onClick={handleLogin}
            className="bg-blue-500 rounded-lg text-white p-2 w-80"
          >
            로그인
          </button>
          <button className="bg-blue-500 rounded-lg text-white p-2 w-80">
            회원가입
          </button>
        </div>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
    </div>
  );
}
