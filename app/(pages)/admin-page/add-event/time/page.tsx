"use client";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function EventTimePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const title = searchParams.get("title") || "";
  const [time, setTime] = useState("");

  async function handleSubmit() {
    if (!time) {
      alert("시간을 입력해주세요.");
      return;
    }

    const eventData = { title, time };

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: eventData.title,
          schedule: eventData.time, // 'schedule' 값은 날짜/시간 형식이어야 합니다.
          passage: "q", // 빈 문자열이지만, 필수 파라미터로 처리될 수 있습니다.
          messenger: "q",
          word: "q",
          content: "q", // content 필드도 빈 문자열로 보내고 있습니다.
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        const errorResult = await response.text();
        throw new Error(`서버 오류: ${errorResult || "Unknown error"}`);
      }

      console.log("이벤트 추가 성공:", result);
      router.push("/admin-page");
    } catch (error) {
      console.error("이벤트 추가 실패:", error);
    }
  }

  return (
    <div>
      <h1 className="cursor-pointer" onClick={() => router.back()}>
        취소
      </h1>
      <div>이벤트 시간을 입력해주세요.</div>
      <p>이벤트 제목: {title}</p>
      <Input
        placeholder="시간 입력 (예: 14:00)"
        value={time}
        onChange={(e) => setTime(e.target.value)}
      />
      <Button onClick={handleSubmit}>이벤트 저장</Button>
    </div>
  );
}
