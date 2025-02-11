import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/app/components/ui/carousel";
import EventCard from "./EventCard";
import { CardDescription, CardTitle } from "./ui/card";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/api/supabase";
import { Skeleton } from "./ui/skeleton";

type Props = {
  content?: string;
  id: string;
};

// Event 타입 정의
type Event = {
  id: number;
  title: string;
  createdAt: string;
  schedule: string;
  subTitle: string | null;
  place: string | null;
};

export default function EventCarousel() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 클라이언트 측에서 데이터 fetch
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .order("createdAt", { ascending: false });

        if (error) {
          throw error;
        }

        setEvents(data); // 데이터 받아오면 상태 업데이트
        setLoading(false);
      } catch (err: any) {
        setError(err.message); // 에러 처리
        setLoading(false); // 로딩 상태 종료
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="w-full flex gap-2 overflow-clip">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex flex-col min-w-52 gap-1">
            <Skeleton className="w-full h-52 rounded-2xl" />
            <Skeleton className="w-1/2 h-3" />
            <Skeleton className="w-full h-5" />
          </div>
        ))}
      </div>
    ); // 로딩 중일 때 표시
  }

  if (error) {
    return <div>Error: {error}</div>; // 에러 발생 시 표시
  }

  return (
    <div className="w-full">
      <Carousel className="flex-col justify-center">
        <CarouselContent className="flex-row">
          {events.map((event) => {
            const scheduleDate = new Date(event.schedule);
            const formattedDate = scheduleDate.toLocaleDateString("ko-KR", {
              month: "2-digit", // 두 자리 숫자로 월 표시 (ex: "02")
              day: "2-digit", // 두 자리 숫자로 일 표시 (ex: "24")
              weekday: "short", // 요일을 짧은 형식으로 표시 (ex: "월")
            });
            return (
              <CarouselItem
                key={event.id}
                className="max-w-fit transition group"
              >
                <Link href={`event/${event.id}`}>
                  <EventCard
                    className="group-hover:scale-110 transform duration-300"
                    title={event.title}
                    createdAt={event.createdAt}
                    schedule={event.schedule}
                    subTitle={event.subTitle ?? ""}
                  />
                  <div className="pt-2">
                    <CardDescription className="text-[8px] font-thin">
                      {formattedDate} {event.place}
                    </CardDescription>
                    <CardTitle className="text-md font-thin">
                      {event.title}
                    </CardTitle>
                  </div>
                </Link>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
