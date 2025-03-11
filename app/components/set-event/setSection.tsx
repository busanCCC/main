"use client";

import { supabase } from "@/api/supabase";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import SetPrayerDialog from "./setPrayerDialog";
import SetPraiseDialog from "./setPraiseDialog";
import SetMessageDialog from "./setMessageDialog";

type Event = {
  id: number;
  title: string;
  createdat: string | null;
  schedule: string;
  place: string | null;
  // 추가된 필드들도 여기 포함해야 할 경우 추가
  content: string | null;
  generalprayer: string | null;
  liveurl: string | null;
  messenger: string | null;
  openingprayer: string | null;
  offeringprayer: string | null;
  testimonyprayer: string | null;
  word: string | null;
  passage: string | null;
  messagetitle: string | null;
};

type SetSectionProps = {
  id: number;
};

export default function SetSection({ id }: SetSectionProps) {
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

  // ✅ Supabase에서 데이터를 다시 불러오는 함수
  const refreshEvent = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw new Error(error.message);

      setEvent(data);
      setLoading(false);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("unknown Error");
      }
      setLoading(false);
    }
  }, [id]); // `id`가 변경될 때만 재생성됨

  useEffect(() => {
    refreshEvent();
  }, [refreshEvent]); // 이제 안전하게 의존성 배열에 추가 가능

  return (
    <div className="w-full">
      <div>섹션별 입력</div>
      {loading && <div>로딩 중 ...</div>}
      {error && <div>오류 발생: {error}</div>}
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
        {event?.openingprayer && (
          <SetPrayerDialog
            id={id}
            prayType="opening"
            displaytext={event.openingprayer}
            openingprayer={event.openingprayer ?? ""}
            generalprayer={event.generalprayer ?? ""}
            testimonyprayer={event.testimonyprayer ?? ""}
            offeringprayer={event.offeringprayer ?? ""}
            refreshEvent={refreshEvent}
          />
        )}
        {/* 찬양 */}
        <SetPraiseDialog id={id} />

        {/* 대표기도 */}
        {event?.generalprayer && (
          <SetPrayerDialog
            id={id}
            prayType="general"
            displaytext={event.generalprayer}
            openingprayer={event.openingprayer ?? ""}
            generalprayer={event.generalprayer ?? ""}
            testimonyprayer={event.testimonyprayer ?? ""}
            offeringprayer={event.offeringprayer ?? ""}
            refreshEvent={refreshEvent}
          />
        )}
        {/* 간증 */}
        {event?.testimonyprayer && (
          <SetPrayerDialog
            id={id}
            prayType="testimony"
            displaytext={event.testimonyprayer}
            openingprayer={event.openingprayer ?? ""}
            generalprayer={event.generalprayer ?? ""}
            testimonyprayer={event.testimonyprayer ?? ""}
            offeringprayer={event.offeringprayer ?? ""}
            refreshEvent={refreshEvent}
          />
        )}

        {/* 메시지 */}
        <SetMessageDialog
          id={id}
          messenger={event?.messenger ?? ""}
          messagetitle={event?.messagetitle ?? ""}
          passage={event?.passage ?? ""}
          words={event?.word ?? ""}
          messengerinfo={event?.content ?? ""}
          refreshEvent={refreshEvent}
        />

        {/* 헌금기도 */}
        {event?.offeringprayer && (
          <SetPrayerDialog
            id={id}
            prayType="offering"
            displaytext={event.offeringprayer}
            openingprayer={event.openingprayer ?? ""}
            generalprayer={event.generalprayer ?? ""}
            testimonyprayer={event.testimonyprayer ?? ""}
            offeringprayer={event.offeringprayer ?? ""}
            refreshEvent={refreshEvent}
          />
        )}
      </motion.div>
    </div>
  );
}
