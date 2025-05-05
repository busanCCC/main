import React from "react";

interface PrayerChainCardProps {
  date: string; // 예: '2024.06.13'
  day: string; // 예: '목'
  campus: string; // 예: '부산대 캠퍼스'
  prayers: string[]; // 기도제목 리스트
  prayingCount: number; // 기도할게요 누른 사람 수
  onPray?: () => void; // 버튼 클릭 핸들러
}

export default function PrayerChainCard({
  date,
  day,
  campus,
  prayers,
  prayingCount,
  onPray,
}: PrayerChainCardProps) {
  return (
    <div className="w-[390px] min-h-[340px] bg-[#f8fbff] border border-[#d7e6fa] rounded-3xl shadow-sm px-7 py-6 flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <div className="text-[15px] font-semibold text-[#3b4a6b] tracking-tight">
          {date} ({day})
        </div>
        <div className="text-[16px] font-bold text-[#1a7f5a] tracking-tight">
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
      <button
        className="w-full h-14 bg-[#2176ff] hover:bg-[#1761c6] transition rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-sm mb-1"
        onClick={onPray}
      >
        🙏 기도할게요
      </button>
      <div className="text-[13px] text-[#4a5a7a] text-center mt-1">
        현재 <span className="font-semibold">{prayingCount}명</span>이 함께
        기도중이에요! 🙏
      </div>
    </div>
  );
}
