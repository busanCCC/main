"use client";
import CampusStory from "@/app/components/CampusStory";
import EventCarousel from "@/app/components/EventCarousel";
import FooterSection from "@/app/components/FooterSection";
import MainCarousel from "@/app/components/MainCarousel";
import Header from "@/app/components/ui/Header";
import { Cover } from "@/components/ui/cover";
import PrayerChainSectionServer from "@/app/components/tempComponents/PrayerChainSectionServer";
export default function Main() {
  return (
    <>
      <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-b from-white via-blue-50 to-blue-100">
        <div className="w-full max-w-7xl flex flex-col items-center">
          <Header />
          <div className="w-full px-2 md:px-0 mt-2">
            <MainCarousel />
          </div>
        </div>
        <main className="w-full max-w-4xl flex flex-col items-center gap-10 py-2 px-2 md:px-0">
          {/* 기도체인 섹션 */}
          <PrayerChainSectionServer />
          {/* 목요채플 섹션 */}
          <section className="w-full bg-white/80 rounded-2xl shadow-md p-6 flex flex-col gap-2">
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
              목요채플
            </h1>
            <p className="text-xs font-light text-gray-600 pb-2">
              기쁨과 은혜가 가득한 목요채플
            </p>
            <EventCarousel />
          </section>

          {/* 캠퍼스 소식 섹션 */}
          <section className="w-full bg-white/80 rounded-2xl shadow-md p-6 flex flex-col gap-2">
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-green-500 to-blue-400 bg-clip-text text-transparent">
              캠퍼스 소식
            </h1>
            <p className="text-xs font-light text-gray-600 pb-2">
              부산지구 캠퍼스의 소식들
            </p>
            <CampusStory />
          </section>

          {/* 미디어팀 안내 섹션 */}
          <section className="w-full bg-gradient-to-r from-yellow-100 via-pink-100 to-blue-100 rounded-2xl shadow-inner p-8 flex flex-col items-center mb-10">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-center">
              미디어 팀에서 <Cover>빠른 속도로</Cover>
              <br /> 새 컨텐츠를 추가중이에요..!
            </h1>
          </section>
        </main>
        <FooterSection />
      </div>
    </>
  );
}
