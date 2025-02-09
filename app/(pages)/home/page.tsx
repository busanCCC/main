"use client";
import EventCarousel from "@/app/components/EventCarousel";
import Footer from "@/app/components/Footer";
import MainCarousel from "@/app/components/MainCarousel";
import Header from "@/app/components/ui/Header";
export default function Main() {
  return (
    <div className="w-full h-full flex-row justify-items-center">
      <div className="w-full flex-row justify-items-center">
        <Header />
        <MainCarousel/>
      </div>
      <main className="w-full flex-row justify-items-center py-10 px-4">
        {/* <div className="w-full h-full flex-row justify-items-center">
          <div className="text-3xl pt-32">이벤트</div>
          <div className="ring-[1.5px] rounded-3xl mt-10 px-8 py-2 hover:bg-slate-500 hover:text-white transition-colors">
            <button>자세히 보기</button>
          </div>
        </div> */}
        <div className="p-4 flex flex-col gap-0.5">
          <h1 className="text-lg font-semibold">목요채플</h1>
          <p className="text-xs font-light text-gray-600 pb-2">기쁨과 은혜가 가득한 목요채플</p>
          <EventCarousel />
        </div>
      </main>
      <Footer />
    </div>
  );
}
