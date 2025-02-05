"use client";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { CalendarDays, Clock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function EventTimePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const title = searchParams.get("title") || "";
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  async function handleSubmit() {
    if (!date || !time) {
      alert("날짜와 시간을 모두 입력해주세요.");
      return;
    }

    const schedule = `${date}T${time}:00Z`;

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          schedule, // 'schedule' 값은 날짜/시간 형식이어야 합니다.
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
    <div className="h-full flex-col m-4 space-y-10">
      <h1 className="cursor-pointer" onClick={() => router.back()}>
        취소
      </h1>
      <div className="pt-10 pb-20 text-2xl">이벤트 시간을 입력해주세요.</div>
      <div className="flex-col">
        <div className="py-2">
          <Label htmlFor="Date">날짜</Label>
          <Input
            className="justify-center"
            type="date"
            id="date"
            placeholder={"날짜"}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="py-2 pb-4">
          <Input
            className="justify-center"
            type="time"
            id="time"
            placeholder={`${(<Clock />)}시간`}
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSubmit}>이벤트 저장</Button>
        </div>
      </div>
    </div>
  );
}
