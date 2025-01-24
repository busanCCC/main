"use client";
import EventCarousel from "@/app/components/EventCarousel";
import Footer from "@/app/components/Footer";
import Header from "@/app/components/ui/Header";
export default function Home() {
  return (
    <div className="w-full h-full flex-row justify-items-center">
      <div className="w-full h-[45%] bg-slate-400 flex-row justify-items-center">
        <Header />
        <h1 className="pt-24 text-3xl font-black">Title</h1>
      </div>
      <main className="w-full flex-row justify-items-center pb-10">
        <div className="w-full h-full flex-row justify-items-center">
          <div className="text-3xl pt-32">이벤트</div>
          <div className="ring-[1.5px] rounded-3xl mt-10 px-8 py-2 hover:bg-slate-500 hover:text-white transition-colors">
            <button>자세히 보기</button>
          </div>
        </div>
        <div className="pt-10">
          <EventCarousel />
        </div>
      </main>
      <Footer />
    </div>
  );
}
