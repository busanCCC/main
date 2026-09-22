import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

import type { PrayerTopicItem } from "@/lib/prayer-topics/types";

interface PrayerChainCardProps {
  date: string; // 예: '2024.06.13'
  day: string; // 예: '목'
  campus: string; // 예: '부산대' 또는 '지구 전체'
  topics: PrayerTopicItem[]; // chapel_prayer_topics 의 기도제목들
  prayingCount: number; // 기도할게요 누른 사람 수
  onPray?: () => void; // 버튼 클릭 핸들러
  disabled?: boolean; // 버튼 비활성화
  resetKey?: number;
}

export default function PrayerChainCard({
  date,
  day,
  campus,
  topics,
  prayingCount,
  onPray,
  disabled,
  resetKey,
}: PrayerChainCardProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isClamped, setIsClamped] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!expanded) {
      setShowAll(false); // 접기 시 전체보기 해제
      setTimeout(() => {
        const el = contentRef.current;
        if (!el) return;
        setIsClamped(el.scrollHeight > el.clientHeight + 1);
      }, 0);
    }
  }, [topics, expanded]);

  useEffect(() => {
    setExpanded(false);
    setShowAll(false);
  }, [resetKey]);

  // 더보기 클릭 시: 먼저 expanded만 true로, showAll은 false
  const handleExpand = () => {
    setExpanded(true);
  };

  // 애니메이션 끝나면 showAll true로(글 전체 노출)
  const handleAnimationComplete = () => {
    if (expanded) setShowAll(true);
  };

  // 접기 클릭 시: 모두 false
  const handleCollapse = () => {
    setExpanded(false);
    setShowAll(false);
  };

  return (
    <motion.div
      className="min-w-[280px] max-w-[390px] shadow-[0_4px_16px_rgba(30,60,120,0.12)] w-full bg-[#f8fbff] border border-[#d7e6fa] rounded-3xl px-4 py-4 sm:px-7 sm:py-6 flex flex-col gap-3 overflow-hidden"
      animate={{ height: expanded ? "auto" : 400 }}
      initial={false}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      onAnimationComplete={handleAnimationComplete}
    >
      {/* 채플 날짜 요일 */}
      <div className="flex flex-col gap-1">
        <div className="text-[13px] font-semibold text-[#3b4a6b] tracking-tight">
          {date} ({day})
        </div>
        {/* 캠퍼스 이름 (지구 전체 기도제목은 '지구 전체') */}
        <div className="text-[22px] font-bold text-[#1a7f5a] tracking-tight">
          {campus}
        </div>
      </div>
      {/* 기도제목 내용 */}
      <div
        className={`mt-2 mb-3 relative ${!showAll ? "line-clamp-5" : ""}`}
        ref={contentRef}
        style={{ minHeight: "3.5em" }}
      >
        <div className="text-[15px] text-[#222] leading-relaxed whitespace-pre-line">
          {topics.map((topic) => (
            <div key={topic.id} className="mb-1 flex items-start">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#a3bffa] mt-2 mr-2 flex-shrink-0" />
              <span>
                {topic.title}
                {topic.body && (
                  <span className="block text-[13px] text-[#4a5a7a] mt-0.5">
                    {topic.body}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
        {/* 잘릴 때만 그라데이션 & 더보기 버튼 */}
        {!expanded && isClamped && (
          <>
            <div
              className="pointer-events-none absolute left-0 right-0 bottom-0 h-12 z-0"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(248,251,255,0) 0%, rgba(248,251,255,0.95) 90%)",
              }}
            />
            <button
              className="absolute left-1/2 -translate-x-1/2 bottom-2 z-10 bg-white/80 text-blue-500 text-xs font-semibold px-3 py-1 rounded-full shadow border border-blue-100 hover:bg-blue-50 transition"
              onClick={handleExpand}
              type="button"
            >
              더보기
            </button>
          </>
        )}
      </div>
      {/* 펼쳐진 상태에서 접기 버튼(absolute X, 일반 flow) */}
      {expanded && (
        <button
          className="mx-auto mb-2 bg-white/80 text-blue-500 text-xs font-semibold px-3 py-1 rounded-full shadow border border-blue-100 hover:bg-blue-50 transition"
          onClick={handleCollapse}
          type="button"
        >
          접기
        </button>
      )}
      {/* 기도할게요 버튼 - 카드의 기도제목 전체에 중보를 기록한다 */}
      <div className="mt-auto flex flex-col gap-2 mb-2">
        <motion.button
          className="w-full h-14 bg-[#2176ff] hover:bg-[#1761c6] transition rounded-xl shadow-[0_4px_16px_rgba(30,60,120,0.18)] flex items-center justify-center text-white text-lg font-bold mb-1 disabled:bg-gray-300 disabled:cursor-not-allowed"
          onClick={onPray}
          disabled={disabled}
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.04 }}
          transition={{ duration: 0.1, ease: "easeInOut" }}
        >
          🙏 기도할게요
        </motion.button>
        {/* 기도할게요 버튼 아래 현재 기도중인 사람 수 */}
        <div className="text-[13px] text-[#4a5a7a] text-center mt-1">
          현재 <span className="font-semibold">{prayingCount}명</span>이 함께
          기도중이에요! 🙏
        </div>
      </div>
    </motion.div>
  );
}
