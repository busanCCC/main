"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/api/supabase";

export default function MainSection({ isAdmin }: { isAdmin: boolean }) {
  const { id: eventId } = useParams();

  const eventIdString = Array.isArray(eventId) ? eventId[0] : eventId;

  const [schedule, setSchedule] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [subTitle, setSubTitle] = useState<string | null>(null);
  const [place, setPlace] = useState<string | null>(null);

  // 🔥 편집 상태 관리 (관리자만 사용)
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [isEditingPlace, setIsEditingPlace] = useState(false);
  const [isEditingSubTitle, setIsEditingSubTitle] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!eventIdString) return;

      // Supabase에서 데이터를 가져옵니다.
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", parseInt(eventIdString))
        .single(); // 한 개의 데이터만 가져옵니다
      if (error) {
        console.error("데이터를 가져오는 중 오류 발생:", error);
        return;
      }

      setTitle(data.title);
      setSubTitle(data.subtitle);
      setPlace(data.place);

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
  }, [eventIdString]);

  // 🔄 서버로 데이터 업데이트 (관리자 전용)
  async function updateEvent(field: string, value: string) {
    if (!isAdmin || !eventIdString) return;

    try {
      // ✅ 업데이트할 데이터 생성
      const updatedData: { [key: string]: string } = {};
      if (field === "title") updatedData.title = value;
      if (field === "subTitle") updatedData.subTitle = value;
      if (field === "place") updatedData.place = value;
      if (field === "schedule") {
        updatedData.schedule = new Date(value).toISOString();
      }
      updatedData.createdAt = new Date().toISOString();

      // ✅ Supabase에서 데이터 업데이트
      const { error } = await supabase
        .from("posts") // 테이블 이름
        .update(updatedData) // 수정할 데이터
        .eq("id", parseInt(eventIdString)); // 특정 ID의 데이터만 수정

      if (error) {
        throw error;
      }

      console.log("✅ 업데이트 성공!");
    } catch (error) {
      console.error("업데이트 실패:", error);
    }
  }
  return (
    <div
      className="w-full h-screen bg-stone-100 flex
           justify-center items-center flex-col gap-2"
    >
      {/* 🕒 일정 (관리자만 수정 가능) */}
      {isAdmin && isEditingSchedule ? (
        <input
          type="datetime-local"
          value={schedule ?? ""}
          onChange={(e) => setSchedule(e.target.value)}
          onBlur={() => {
            setIsEditingSchedule(false);
            if (schedule) updateEvent("schedule", schedule);
          }}
          onKeyDown={(e) => e.key === "Enter" && setIsEditingSchedule(false)}
          className="border-b border-gray-400 focus:outline-none"
          autoFocus
        />
      ) : (
        <div
          className={`font-thin text-center ${
            isAdmin ? "cursor-pointer hover:text-blue-500" : ""
          }`}
          onClick={() => isAdmin && setIsEditingSchedule(true)}
        >
          {schedule} |{" "}
          {isAdmin && isEditingPlace ? (
            <input
              type="text"
              value={place ?? ""}
              onChange={(e) => setPlace(e.target.value)}
              onBlur={() => {
                setIsEditingPlace(false);
                if (place) updateEvent("place", place);
              }}
              onKeyDown={(e) => e.key === "Enter" && setIsEditingPlace(false)}
              className="border-b border-gray-400 focus:outline-none"
              autoFocus
            />
          ) : (
            <span
              className={`${
                isAdmin ? "cursor-pointer hover:text-blue-500" : ""
              }`}
              onClick={() => isAdmin && setIsEditingPlace(true)}
            >
              {place}
            </span>
          )}
        </div>
      )}
      {/* 🏷 제목 (관리자만 수정 가능) */}
      {isAdmin && isEditingTitle ? (
        <input
          type="text"
          value={title ?? ""}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => {
            setIsEditingTitle(false);
            if (title) updateEvent("title", title);
          }}
          onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
          className="text-4xl font-extrabold text-center border-b border-gray-400 focus:outline-none"
          autoFocus
        />
      ) : (
        <div
          className={`font-extrabold text-4xl text-center ${
            isAdmin ? "cursor-pointer hover:text-blue-500" : ""
          }`}
          onClick={() => isAdmin && setIsEditingTitle(true)}
        >
          {title}
        </div>
      )}
      {/* 📌 부제목 (관리자만 수정 가능) */}
      {isAdmin && isEditingSubTitle ? (
        <input
          type="text"
          value={subTitle ?? ""}
          onChange={(e) => setSubTitle(e.target.value)}
          onBlur={() => {
            setIsEditingSubTitle(false);
            if (subTitle) updateEvent("subTitle", subTitle);
          }}
          onKeyDown={(e) => e.key === "Enter" && setIsEditingSubTitle(false)}
          className="font-medium text-xl text-center border-b border-gray-400 focus:outline-none"
          autoFocus
        />
      ) : (
        <div
          className={`font-medium text-xl text-center ${
            isAdmin ? "cursor-pointer hover:text-blue-500" : ""
          }`}
          onClick={() => isAdmin && setIsEditingSubTitle(true)}
        >
          {subTitle}
        </div>
      )}
    </div>
  );
}
