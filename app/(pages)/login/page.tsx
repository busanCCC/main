"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

    // 로그인 성공 시 홈으로 이동
    router.push("/");
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // redirectTo: `${window.location.origin}/auth/callback` // 필요시
      },
    });
    if (error) {
      alert("구글 로그인 오류: " + error.message);
    }
    setLoading(false);
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
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="bg-white border border-gray-300 text-gray-700 font-bold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition"
          disabled={loading}
        >
          <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
          {loading ? "구글 로그인 중..." : "구글로 로그인/회원가입"}
        </button>
        <div>
          <button className="rounded-full bg-blue-500 text-white p-2">
            카카오 로그인
          </button>
        </div>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
    </div>
  );
}
