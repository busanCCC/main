"use client";
import PrayerChainCard from "./PrayerChainCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/app/components/ui/carousel";

interface PrayerChainItem {
  date: string;
  day: string;
  campus: string;
  prayers: string[];
  prayingCount: number;
}

interface PrayerChainSectionProps {
  data: PrayerChainItem[];
}

export default function PrayerChainSection({ data }: PrayerChainSectionProps) {
  return (
    <section className="w-full bg-white/80 rounded-2xl shadow-md p-6 flex flex-col gap-2 mt-10">
      <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-500 to-blue-400 bg-clip-text text-transparent">
        여름수련회 기도체인
      </h1>
      <p className="text-xs font-light text-gray-600 pb-2">
        매일 각 캠퍼스에서 올라온 기도제목을 다시 볼 수 있어요
      </p>
      <div className="relative w-full flex items-center justify-center">
        <Carousel
          className="pl-1 flex-col justify-center w-full"
          opts={{ align: "center" }}
        >
          <CarouselPrevious />
          <CarouselContent className="flex-row sm:justify-start">
            {data.map((item, idx) => (
              <CarouselItem key={idx} className="max-w-fit transition group">
                <div className="mx-2">
                  <PrayerChainCard {...item} />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselNext />
        </Carousel>
      </div>
    </section>
  );
}
