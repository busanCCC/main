"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/app/components/ui/carousel";
import EventCard from "./EventCard";
import { CardDescription, CardTitle } from "./ui/card";

export default function EventCarousel() {
  return (
    <Carousel className="flex justify-center">
      <CarouselContent className="flex-col px-5">
        <EventCard />
        <div className="pt-2 ">
          <CardTitle className="text-[18px] font-thin">123</CardTitle>
          <CardDescription className="text-sm font-thin">
            테스트
          </CardDescription>
          <CardDescription>time --:--</CardDescription>
        </div>
      </CarouselContent>
    </Carousel>
  );
}
