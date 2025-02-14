"use client"; // ✅ 클라이언트 컴포넌트에서만 사용
import { useState } from "react";
import Message from "./worship-order/Message";
import Praise from "./worship-order/Praise";
import Prayer from "./worship-order/Prayer";
import { motion } from "framer-motion";
import CopyAccountButton from "./worship-order/copyAccountButton";

type Props = {
  openingPrayer?: string; // 🔹 시작 기도
  generalPrayer?: string; // 🔹 대표 기도
  offeringPrayer?: string; // 🔹 헌금 기도
  testimonyPrayer?: string; // 간증
  testimonyTitle?: string; // 간증 제목
  passage?: string; // 🔹 메시지 관련 데이터
  messenger?: string;
  messageTitle?: string;
  messengerInfo?: string;
  word?: string;
  id: number;
};

export default function WorshipOrderSection({
  openingPrayer,
  generalPrayer,
  offeringPrayer,
  testimonyPrayer,
  passage,
  messenger,
  messageTitle,
  messengerInfo,
  word,
  id,
}: Props) {
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

  return (
    <div className="w-full">
      <div className="bg-stone-200 bg-texture">
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
          className="flex flex-col gap-24 justify-center items-center px-4 overflow-hidden"
        >
          {/* 시작기도 */}
          {openingPrayer && (
            <Prayer
              prayType="opening"
              prayer={openingPrayer}
              className="mt-24"
            />
          )}
          {/* 찬양 */}
          <Praise id={id} />

          {/* 대표기도 */}
          {generalPrayer && (
            <Prayer prayType="general" prayer={generalPrayer} />
          )}

          {testimonyPrayer && (
            <Prayer prayType="testimony" prayer={testimonyPrayer} />
          )}

          {/* 메시지 */}
          <Message
            title={messageTitle as string}
            passage={passage}
            messenger={messenger}
            messengerInfo={messengerInfo}
            words={word}
          />

          {/* 헌금기도 */}
          {offeringPrayer && (
            <Prayer
              prayType="offering"
              prayer={offeringPrayer}
              className="mb-2"
            />
          )}
          <CopyAccountButton />
        </motion.div>
      </div>
    </div>
  );
}
