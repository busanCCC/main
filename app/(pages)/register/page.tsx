"use client";

import { useState } from "react";
import { supabase } from "@/api/supabase";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      return;
    }
    if (data.user) {
      const { error: userInfoError } = await supabase.from("userinfo").upsert([
        {
          id: data.user.id,
          email: data.user.email ?? "",
          username: name,
          role: "user",
          created_at: new Date().toISOString(),
        },
      ]);
      if (userInfoError) {
        console.error("userinfo upsert 실패:", userInfoError.message);
        // 필요하다면 에러를 무시하거나 별도 처리
      }
    }

    router.push("/");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">회원가입</h1>
      <input
        type="text"
        placeholder="이름"
        className="border p-2 mb-2 w-80"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="email"
        placeholder="이메일"
        className="border p-2 mb-2 w-80"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="비밀번호"
        className="border p-2 mb-2 w-80"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        onClick={handleRegister}
        className="bg-blue-500 text-white p-2 w-80"
      >
        회원가입
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}
