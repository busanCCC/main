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
};

export default function EventCarousel() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 클라이언트 측에서 데이터 fetch
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase.from("posts").select("*");

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
    return <div>Loading...</div>; // 로딩 중일 때 표시
  }

  if (error) {
    return <div>Error: {error}</div>; // 에러 발생 시 표시
  }

  return (
    <div className="w-full">
      <Carousel className=" flex-col justify-center">
        <CarouselContent className="w-[350px] flex-row px-5">
          {events.map((event) => (
            <CarouselItem
              key={event.id}
              className="w-[300px] px-4 transition delay-150 duration-300 ease-in-out lg:hover:translate-y-1 lg:hover:scale-110 hover:text-gray-400"
            >
              <Link href={`event/${event.id}`}>
                <EventCard
                  title={event.title}
                  createdAt={event.createdAt}
                  schedule={event.schedule}
                />
                <div className="pt-2 ">
                  <CardTitle className="text-[18px] font-thin">
                    {event.title}
                  </CardTitle>
                  <CardDescription className="text-sm font-thin">
                    일정 :{new Date(event.schedule).toLocaleString()}
                  </CardDescription>
                  <CardDescription>
                    생성된 시간 : {new Date(event.createdAt).toLocaleString()}
                  </CardDescription>
                </div>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
