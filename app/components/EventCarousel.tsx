import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/app/components/ui/carousel";
import EventCard from "./EventCard";
import { CardDescription, CardTitle } from "./ui/card";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/api/supabase";
import { Skeleton } from "./ui/skeleton";
import { ScrollArea, ScrollBar } from "./ui/scrollArea";

// Event 타입 정의
type Event = {
  id: number;
  title: string;
  createdat: string | null;
  schedule: string;
  subtitle: string | null;
  place: string | null;
};

export default function EventCarousel() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState<boolean>(true);

  // 화면 크기 감지 (데스크톱 여부 체크)
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // 클라이언트 측에서 데이터 fetch
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

        setEvents(data); // 데이터 받아오면 상태 업데이트
        setLoading(false);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message); // 에러 처리
        } else {
          setError("unknown Error");
        }
        setLoading(false); // 로딩 상태 종료
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="w-full flex gap-2 overflow-clip">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex flex-col min-w-80 md:min-w-92 gap-1">
            <Skeleton className="sm:min-h-80 md:min-h-92 lg:min-h-92 h-80 aspect-square flex-auto rounded-2xl" />
            <Skeleton className="w-1/2 h-3" />
            <Skeleton className="w-full h-5" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const testColors = [
    "bg-gradient-to-bl from-fuchsia-100 via-gray-100 to-white",
    "bg-gradient-to-bl from-green-100 via-gray-100 to-white",
    "bg-gradient-to-bl from-yellow-100 via-gray-100 to-white",
  ];

  return (
    <div className="w-full">
      {isDesktop ? (
        /** 🖥️ 데스크톱일 때 ScrollArea 적용 */
        <ScrollArea className="w-full whitespace-nowrap">
          <Carousel className="pl-1 flex-col justify-center">
            <CarouselContent className="flex-row sm:justify-start">
              {events.map((event, index) => {
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
                    <Link href={`event/${event.id}`} passHref prefetch={true}>
                      <EventCard
                        className={`group-hover:scale-95 transform duration-300 ${
                          testColors[index % 3]
                        }`}
                        title={event.title}
                        subtitle={event.subtitle ?? ""}
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
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ) : (
        /** 📱 모바일일 때 일반 div로 처리 */
        <div className="w-full overflow-x-auto whitespace-nowrap">
          <Carousel className="pl-1 flex-col justify-center">
            <CarouselContent className="flex-row sm:justify-start">
              {events.map((event, index) => {
                const scheduleDate = new Date(event.schedule);
                const formattedDate = scheduleDate.toLocaleDateString("ko-KR", {
                  month: "2-digit",
                  day: "2-digit",
                  weekday: "short",
                });
                return (
                  <CarouselItem
                    key={event.id}
                    className="max-w-fit transition group"
                  >
                    <Link href={`event/${event.id}`} passHref prefetch={true}>
                      <EventCard
                        className={`group-hover:scale-95 transform duration-300 ${
                          testColors[index % 3]
                        }`}
                        title={event.title}
                        subtitle={event.subtitle ?? ""}
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
      )}
    </div>
  );
}
