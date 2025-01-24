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

// Event 타입 정의
type Event = {
  id: number;
  title: string;
  createdAt: string;
  schedule: string;
};

export default function EventCarousel() {
  const [events, setEvents] = useState<Event[]>([]);

  // 클라이언트 측에서 데이터 fetch
  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/events"); // 로컬 API 호출
      const data: Event[] = await res.json();
      setEvents(data);
    };

    fetchData();
  }, []);

  return (
    <div className="w-full">
      <Carousel className=" flex-col justify-center">
        <CarouselContent className="w-[350px] flex-row px-5">
          {events.map((event) => (
            <CarouselItem key={event.id} className="w-[300px] px-4">
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
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
