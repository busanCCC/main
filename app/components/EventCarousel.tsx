import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/app/components/ui/carousel";
import EventCard from "./EventCard";
import { CardDescription, CardTitle } from "./ui/card";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/api/supabase";
import { Skeleton } from "./ui/skeleton";
import { ScrollArea, ScrollBar } from "./ui/scrollArea";

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
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  // 마우스 드래그 이벤트 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollAreaRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - scrollAreaRef.current.offsetLeft;
    scrollLeft.current = scrollAreaRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollAreaRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollAreaRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5; // 스크롤 속도 조절
    scrollAreaRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
  };

  // 터치 이벤트 핸들러 (모바일 지원)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollAreaRef.current) return;
    isDragging.current = true;
    startX.current = e.touches[0].clientX - scrollAreaRef.current.offsetLeft;
    scrollLeft.current = scrollAreaRef.current.scrollLeft;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !scrollAreaRef.current) return;
    const x = e.touches[0].clientX - scrollAreaRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    scrollAreaRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  // 클라이언트 측에서 데이터 fetch
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .order("createdAt", { ascending: false });

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
          <div key={index} className="flex flex-col min-w-60 md:min-w-92 gap-1">
            <Skeleton className="w-full h-80 rounded-2xl" />
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
      <ScrollArea
        ref={scrollAreaRef}
        className="w-full whitespace-nowrap overflow-x-auto cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
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
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
