"use client";

import { supabase } from "@/api/supabase";
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
  const subTitle = searchParams.get("subTitle") || "";
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  async function handleSubmit() {
    if (!date || !time) {
      alert("날짜와 시간을 모두 입력해주세요.");
      return;
    }
    const schedule = new Date(`${date}T${time}:00`).toISOString();

    try {
      const { data, error } = await supabase.from("posts").insert([
        {
          title,
          subTitle,
          schedule, // 날짜/시간 ISO 형식
          passage: "q", // 기본값 설정
          messenger: "q",
          word: "q",
          content: "q",
        },
      ]);

      if (error) {
        throw error;
      }

      console.log("이벤트 추가 성공:", data);
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
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="py-2 pb-4">
          <Label htmlFor="Time">시간</Label>
          <Input
            className="justify-center"
            type="time"
            id="time"
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
