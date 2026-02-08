"use client";

import { BookOpen, MapPin, Clock, Mic2 } from "lucide-react";

export interface ChapelPreviewValues {
  topic?: string;
  messenger?: string;
  place?: string;
  place_link?: string;
  datetime?: string;
  thumbnail_url?: string;
  active_from?: string;
  active_until?: string;
}

/** 앱 formatDateTimeForDisplay와 동일: "목요일 오후 5시 30분" 형식 */
function formatDateTimeForDisplay(datetimeStr: string | null | undefined): string {
  if (!datetimeStr || !datetimeStr.trim()) return "일시 미정";
  if (datetimeStr.startsWith("2099-")) return "일시 미정"; // 미정 센티널
  const date = new Date(datetimeStr);
  if (Number.isNaN(date.getTime())) return "일시 미정";

  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const dayName = dayNames[date.getDay()];
  const hour = date.getHours();
  const minute = date.getMinutes();

  const ampm = hour >= 12 ? "오후" : "오전";
  const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const timeStr = minute > 0 ? `${hour12}시 ${minute}분` : `${hour12}시`;

  return `${dayName}요일 ${ampm} ${timeStr}`;
}

/** 앱 buildSlidesFromChapel과 동일한 슬라이드 데이터 */
function buildSlides(values: ChapelPreviewValues) {
  const topic = values.topic?.trim() || "주제";
  const messenger = values.messenger?.trim() || "메신저";
  const place = values.place?.trim() || "장소";
  const timeDisplay = formatDateTimeForDisplay(values.datetime ?? null);

  return [
    {
      id: "topic",
      backgroundColor: "#fef3c7",
      icon: <BookOpen size={32} color="#f59e0b" />,
      title: "이번주 채플은",
      subtitle: `"${topic}" 주제로\n진행됩니다!`,
    },
    {
      id: "speaker",
      backgroundColor: "#dbeafe",
      icon: <Mic2 size={32} color="#3b82f6" />,
      title: `${messenger}의`,
      subtitle: "메세지가 준비되어 있어요!",
    },
    {
      id: "location",
      backgroundColor: "#dcfce7",
      icon: <MapPin size={32} color="#22c55e" />,
      title: `${place}에서`,
      subtitle: "진행됩니다!",
    },
    {
      id: "time",
      backgroundColor: "#fce7f3",
      icon: <Clock size={32} color="#ec4899" />,
      title: `${timeDisplay}까지`,
      subtitle: "와주세요!",
    },
  ];
}

export function ChapelPreview({ values }: { values: ChapelPreviewValues }) {
  const topic = values.topic?.trim() || "준비 중";
  const messenger = values.messenger?.trim() || "메신저";
  const place = values.place?.trim() || "장소";
  const timeDisplay = formatDateTimeForDisplay(values.datetime ?? null);
  const slides = buildSlides(values);

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground">
        앱 화면 미리보기 · ChapelDetail
      </p>

      {/* 모바일 프레임 - 스크롤 가능 */}
      <div
        className="rounded-[2rem] overflow-y-auto overflow-x-hidden border-2 border-slate-200 shadow-xl max-h-[520px]"
        style={{ maxWidth: 280 }}
      >
        {/* 4개 인트로 슬라이드 */}
        {slides.map((slide) => (
          <div
            key={slide.id}
            className="p-6 flex flex-col items-center justify-center min-h-[180px]"
            style={{ backgroundColor: slide.backgroundColor }}
          >
            <div className="rounded-full bg-white/50 p-4 mb-4">
              {slide.icon}
            </div>
            <p className="text-base font-bold text-center text-gray-800 mb-1">
              {slide.title}
            </p>
            <p className="text-sm text-center text-gray-600 whitespace-pre-line">
              {slide.subtitle}
            </p>
          </div>
        ))}

        {/* CTA 슬라이드 - 앱과 동일한 #14b8a6 배경 */}
        <div
          className="p-4 pb-6 flex flex-col items-center min-h-[420px]"
          style={{ backgroundColor: "#14b8a6" }}
        >
          <h3 className="text-lg font-bold text-white text-center mb-4">
            이번 주 채플 안내
          </h3>

          {/* 정보 카드 */}
          <div className="w-full rounded-2xl bg-white/95 p-4 mb-4">
            <div className="mb-3 flex items-center gap-3 border-b border-gray-100 pb-3">
              <div
                className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#fef3c7" }}
              >
                <BookOpen size={18} color="#f59e0b" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400">주제</p>
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {topic}
                </p>
              </div>
            </div>

            <div className="mb-3 flex items-center gap-3 border-b border-gray-100 pb-3">
              <div
                className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#dbeafe" }}
              >
                <Mic2 size={18} color="#3b82f6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400">메신저</p>
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {messenger}
                </p>
              </div>
            </div>

            <div className="mb-3 flex items-center gap-3 border-b border-gray-100 pb-3">
              <div
                className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#dcfce7" }}
              >
                <MapPin size={18} color="#22c55e" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400">장소</p>
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {place}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#fce7f3" }}
              >
                <Clock size={18} color="#ec4899" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400">일시</p>
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {timeDisplay}
                </p>
              </div>
            </div>
          </div>

          {/* 썸네일 - 항상 friends.webp 고정 */}
          <img
            src="/friends.webp"
            alt="채플"
            className="mb-3"
          />

          <p className="text-sm font-medium text-white/90 mb-4">
            채플에서 만나요! 🙏
          </p>

          <div
            className="w-full rounded-xl py-3 text-center"
            style={{ backgroundColor: "white" }}
          >
            <span className="text-sm font-bold" style={{ color: "#0d9488" }}>
              홈으로 돌아가기
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
