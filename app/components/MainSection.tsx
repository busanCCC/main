"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/api/supabase";
import { Button } from "./ui/button";
import { MapPinned } from "lucide-react";

export default function MainSection() {
  const { id: eventId } = useParams();

  const eventIdString = Array.isArray(eventId) ? eventId[0] : eventId;

  const [schedule, setSchedule] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [subTitle, setSubTitle] = useState<string | null>(null);
  const [place, setPlace] = useState<string | null>(null);
  const [placeurl, setPlaceurl] = useState<string | null>(null);

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
      setPlaceurl(data.placeurl);

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

  return (
    <div
      className="w-full h-screen bg-stone-100 flex
           justify-center items-center flex-col gap-2"
    >
      <div className="font-thin text-center">
        {schedule}
        <span className="flex-auto">
          {place}
          {placeurl && (
            <Button
              variant="link"
              size="icon"
              onClick={() => {
                window.open(placeurl, "_blank");
              }}
            >
              <MapPinned />
            </Button>
          )}
        </span>
      </div>
      <div className="font-extrabold text-4xl text-center responsive-text ">
        {title}
      </div>
      <div className="font-medium text-xl text-center">{subTitle}</div>
    </div>
  );
}
