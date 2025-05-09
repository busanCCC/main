"use client";

import { Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardTitle } from "../ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/api/supabase";
import { Skeleton } from "../ui/skeleton";
import EventCard from "../EventCard";
import SetEventDropdown from "./setEventDropdown";
import Link from "next/link";

type Event = {
  id: number;
  title: string;
  createdat: string | null;
  schedule: string;
  place: string | null;
  subtitle: string | null;
};

export default function SetEventList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .order("createdat", { ascending: false });

        if (error) {
          throw new Error(error.message);
        }

        setEvents(data);
        setLoading(false);
      } catch {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleDelete = (id: number) => {
    setEvents(events.filter((event) => event.id !== id)); // 상태에서 삭제된 이벤트 제거
  };

  if (loading) {
    return (
      <div className="w-full flex gap-2 overflow-auto">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex flex-col min-w-52 gap-1">
            <Skeleton className="w-full h-52 rounded-2xl" />
            <Skeleton className="w-1/2 h-3" />
            <Skeleton className="w-full h-5" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-5 justify-center">
      <Link href={"/admin-page/add-event"} passHref prefetch={true}>
        <Card
          className="sm:min-h-96 md:min-h-80 lg:min-h-80 h-60 rounded-2xl aspect-square content-center transition-colors ease-linear duration-200 border-dashed border hover:cursor-pointer hover:bg-gray-100"
          style={{ borderWidth: "3px" }}
        >
          <CardContent className="flex-col justify-center text-center my-3">
            <span className="flex justify-center mb-3">
              <Plus />
            </span>
            <span>이벤트 추가</span>
          </CardContent>
        </Card>
      </Link>

      {events.map((event) => {
        const scheduleDate = new Date(event.schedule);
        const formattedDate = scheduleDate.toLocaleDateString("ko-KR", {
          month: "2-digit", // 두 자리 숫자로 월 표시 (ex: "02")
          day: "2-digit", // 두 자리 숫자로 일 표시 (ex: "24")
          weekday: "short", // 요일을 짧은 형식으로 표시 (ex: "월")
        });
        return (
          <div key={event.id}>
            <Link
              href={`/admin-page/set-event/${event.id}`}
              passHref
              prefetch={true}
            >
              <EventCard
                className="transition-colors duration-200 rounded-2xl hover:bg-gray-200 cursor-pointer"
                title={event.title}
                subtitle={event.subtitle ?? ""}
              />
              <div className="mt-3 flex justify-between ">
                <div className="flex-col truncate w-40">
                  <CardTitle className="text-lg font-thin">
                    {event.title}
                  </CardTitle>
                  <CardDescription className="text-xs font-thin content-center">
                    {formattedDate} {event.place}{" "}
                  </CardDescription>
                </div>
                <div>
                  <SetEventDropdown id={event.id} onDelete={handleDelete} />
                </div>
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
