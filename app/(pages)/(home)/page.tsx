"use client";
import EventCarousel from "@/app/components/EventCarousel";
import FooterSection from "@/app/components/FooterSection";
import MainCarousel from "@/app/components/MainCarousel";
import Header from "@/app/components/ui/Header";
import { Cover } from "@/components/ui/cover";
export default function Main() {
  return (
    <div className="w-full h-full flex flex-col justify-items-center max-w-8xl">
      <div className="w-full flex-row justify-items-center">
        <Header />
        <MainCarousel />
      </div>
      <main className="w-full max-w-6xl self-center flex-row justify-items-center py-10 px-1">
        <div className="w-full flex flex-col gap-0.5">
          <h1 className="text-lg font-semibold px-4">목요채플</h1>
          <p className="text-xs font-light text-gray-600 pb-2 px-4">
            기쁨과 은혜가 가득한 목요채플
          </p>
          <EventCarousel />
        </div>

        <div className="w-full flex flex-col gap-0.5 py-10">
          <h1 className="text-lg font-semibold px-4">캠퍼스 소식</h1>
          <p className="text-xs font-light text-gray-600 pb-2 px-4">
            부산지구 캠퍼스의 소식들
          </p>
          <div className="w-full h-36 flex flex-col text-3xl bg-gray-300 rounded-lg p-5 items-center justify-center">
            Comming soooooon!
          </div>
        </div>

        <div className="p-4 mt-20">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold max-w-7xl mx-auto text-center mt-6 relative z-20 py-6 bg-clip-text bg-gradient-to-b ">
            미디어 팀에서 <Cover>빠른 속도로</Cover>
            <br /> 새 컨텐츠를 추가중이에요..!
          </h1>
        </div>
      </main>
      <FooterSection />
    </div>
  );
}
