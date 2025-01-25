"use client";

import Footer from "@/app/components/Footer";
import Header from "@/app/components/ui/Header";
import { useEffect, useState } from "react";

export default function EventList() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/events");
      const data = await res.json();
      setEvents(data);
    };

    fetchData();
  }, []);

  return (
    <div className="w-full h-full flex-row justify-items-center">
      <div className="w-full h-[45%] bg-slate-400 flex-row justify-items-center">
        <Header />
        <h1 className="pt-24 text-3xl font-black">Title</h1>
      </div>
      <main className="w-full flex-row justify-items-center pb-10">
        <div className="text-3xl pt-32">이벤트 페이지</div>
      </main>
      <Footer />
    </div>
  );
}
