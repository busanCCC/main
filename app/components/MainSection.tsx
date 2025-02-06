"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function MainSection() {
  const { id: eventId } = useParams();
  const [schedule, setSchedule] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [subTitle, setSubTitle] = useState<string | null>(null);
  useEffect(() => {
    async function fetchData() {
      if (!eventId) return;
      const response = await fetch(`/api/posts/${eventId}`);
      if (!response.ok) throw new Error(`API 요청 실패: ${response.status}`);

      const data = await response.json();
      console.log("📜 받은 데이터:", data);

      setTitle(data.title);
      setSubTitle(data.subTitle);
      // 📌 UTC -> KST 변환 (UTC+9)
      const utcDate = new Date(data.schedule);
      const formattedSchedule = `${utcDate.getFullYear()}년 ${
        utcDate.getMonth() + 1
      }월 ${utcDate.getDate()}일 | ${utcDate.getHours()}:${utcDate
        .getMinutes()
        .toString()
        .padStart(2, "0")} `;
      setSchedule(formattedSchedule);
    }
    fetchData();
  }, [eventId]);

  return (
    <div
      className="w-full h-screen bg-stone-100 flex
           justify-center items-center flex-col gap-2"
    >
      <div className="font-thin text-center">{schedule}| 산성교회</div>
      <div className="font-extrabold text-4xl gsans-bold text-center">
        {title}
      </div>
      <div className="font-medium text-xl text-center">{subTitle}</div>
    </div>
  );
}
