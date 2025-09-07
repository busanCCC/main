"use client";
import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/app/components/ui/carousel";
import PrayerChainCardClient from "./tempComponents/PrayerChainCardClient";
import supabase from "@/utils/supabase/client";

interface PrayerChainItem {
  id: number;
  date: string;
  day: string;
  campus: string;
  prayers: string[];
  prayingCount: number;
}

export default function PrayerChainSection() {
  const [data, setData] = useState<PrayerChainItem[]>([]);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    // supabase에서 데이터 fetch
    async function fetchData() {
      const { data } = await supabase
        .from("prayer_chain")
        .select("*")
        .order("date", { ascending: false })
        .order("id", { ascending: false });
      setData(data ?? []);
    }
    fetchData();
  }, []);

  const handlePrev = () => {
    setResetKey((k) => k + 1); // resetKey를 변경해 리셋 트리거
  };
  const handleNext = () => {
    setResetKey((k) => k + 1);
  };

  return (
    <section className="w-full h-full bg-white/80 rounded-2xl shadow-md p-6 flex flex-col gap-2 mt-10">
      <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-500 to-blue-400 bg-clip-text text-transparent">
        부산지구 기도제목
      </h1>
      <p className="text-xs font-light text-gray-600 pb-2">
        각 캠퍼스의 기도제목을 확인하고 함께 기도해요
      </p>
      <div className="relative w-full flex items-center justify-center">
        <Carousel
          className="pl-1 flex-col justify-center w-full items-center"
          opts={{ align: "center" }}
        >
          <CarouselPrevious onClick={handlePrev} />
          <CarouselContent className="flex-row items-center overflow-visible">
            {data.map((item) => (
              <CarouselItem
                key={item.id}
                className="max-w-fit transition group flex justify-center items-center mx-auto"
              >
                <div className="mx-2">
                  <PrayerChainCardClient
                    initialData={{
                      id: item.id,
                      date: item.date,
                      campus: item.campus,
                      prayers: item.prayers,
                      resetKey: resetKey,
                      praying_count: item.prayingCount,
                    }}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselNext onClick={handleNext} />
        </Carousel>
      </div>
    </section>
  );
}
