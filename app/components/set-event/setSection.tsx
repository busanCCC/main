"use client";

import { supabase } from "@/api/supabase";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Prayer from "../worship-order/Prayer";
import Praise from "../worship-order/Praise";
import Message from "../worship-order/Message";
import SetPrayerDialog from "./setPrayerDialog";

type Event = {
  id: number;
  title: string;
  createdAt: string;
  schedule: string;
  place: string | null;
  // 추가된 필드들도 여기 포함해야 할 경우 추가
  content: string | null;
  generalPrayer: string | null;
  liveUrl: string | null;
  messenger: string | null;
  openingPrayer: string | null;
  offeringPrayer: string | null;
  testimonyPrayer: string | null;
  word: string | null;
  passage: string | null;
};

export default function SetSection({ id }: { id: number }) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndexes, setActiveIndexes] = useState<Set<string>>(
    new Set(["order"])
  );

  const toggleAccordion = (index: string) => {
    setActiveIndexes((prevIndexes) => {
      const newIndexes = new Set(prevIndexes);
      if (newIndexes.has(index)) {
        newIndexes.delete(index);
      } else {
        newIndexes.add(index);
      }
      return newIndexes;
    });
  };

  useEffect(() => {
    if (!id) return; // id가 없으면 실행 안 함

    const fetchEvent = async () => {
      try {
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        setEvent(data); // 바로 객체를 저장
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]); // id가 변경될 때마다 실행

  return (
    <div className="w-full">
      <div>섹션별 입력</div>
      <div
        onClick={() => toggleAccordion("order")}
        className="cursor-pointer px-4 py-8 sticky top-0 z-10 flex justify-between bg-stone-200 bg-texture"
      >
        <div />
        <h2 className="gsans-bold text-3xl">예배 순서</h2>
        <div></div>
      </div>
      <motion.div
        initial={{ height: "auto" }}
        animate={{
          height: activeIndexes.has("order") ? "auto" : 0,
          opacity: activeIndexes.has("order") ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-28 justify-center items-center px-4 overflow-hidden"
      >
        {/* 시작기도 */}
        {event?.openingPrayer && (
          <SetPrayerDialog prayType="opening" prayer={event.openingPrayer} />
        )}
        {/* 찬양 */}
        <Praise id={id} />

        {/* 대표기도 */}
        {event?.generalPrayer && (
          <SetPrayerDialog prayType="general" prayer={event.generalPrayer} />
        )}
        {/* 간증 */}
        {event?.testimonyPrayer && (
          <SetPrayerDialog
            prayType="testimony"
            prayer={event.testimonyPrayer}
          />
        )}

        {/* 메시지 */}
        <Message
          title="한 밤중에 일어난 역사"
          passage={event?.passage ?? ""}
          messenger={event?.messenger ?? ""}
          words={event?.word ?? ""}
        />

        {/* 헌금기도 */}
        {event?.offeringPrayer && (
          <SetPrayerDialog prayType="offering" prayer={event.offeringPrayer} />
        )}
      </motion.div>
      
    </div>
  );
}
