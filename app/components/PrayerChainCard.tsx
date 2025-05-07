import React from "react";
import { motion } from "framer-motion";

interface PrayerChainCardProps {
  date: string; // 예: '2024.06.13'
  day: string; // 예: '목'
  campus: string; // 예: '부산대 캠퍼스'
  prayers: string[]; // 기도제목 리스트
  prayingCount: number; // 기도할게요 누른 사람 수
  onPray?: () => void; // 버튼 클릭 핸들러
  disabled?: boolean; // 버튼 비활성화
}

export default function PrayerChainCard({
  date,
  day,
  campus,
  prayers,
  prayingCount,
  onPray,
  disabled,
}: PrayerChainCardProps) {
  return (
    <div className="min-w-[280px] max-w-[390px] shadow-[0_4px_16px_rgba(30,60,120,0.12)] w-full min-h-[340px] bg-[#f8fbff] border border-[#d7e6fa] rounded-3xl px-4 py-4 sm:px-7 sm:py-6 flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <div className="text-[13px] font-semibold text-[#3b4a6b] tracking-tight">
          {date} ({day})
        </div>
        <div className="text-[22px] font-bold text-[#1a7f5a] tracking-tight">
          {campus}
        </div>
      </div>
      <div className="mt-2 mb-3">
        <div className="text-[15px] text-[#222] leading-relaxed whitespace-pre-line">
          {prayers.map((prayer, idx) => (
            <div key={idx} className="mb-1 flex items-start">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#a3bffa] mt-2 mr-2 flex-shrink-0" />
              <span>{prayer}</span>
            </div>
          ))}
        </div>
      </div>
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
      <div className="text-[13px] text-[#4a5a7a] text-center mt-1">
        현재 <span className="font-semibold">{prayingCount}명</span>이 함께
        기도중이에요! 🙏
      </div>
    </div>
  );
}
