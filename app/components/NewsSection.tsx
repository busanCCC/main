"use client";

import { motion } from "framer-motion";
import NewsYoutube from "./news/NewsYoutube";
import Image from "next/image";
import news2Img from "@/public/news2.png";
export default function NewsSection({
  activeIndexes,
  toggleAccordion,
}: {
  activeIndexes: Set<string>;
  toggleAccordion: (index: string) => void;
}) {
  return (
    <div className="w-full">
      <div className="bg-stone-200 bg-texture">
        <div
          onClick={() => toggleAccordion("news")}
          className="cursor-pointer  px-4 py-8 sticky top-0 z-10 flex justify-between bg-stone-200 bg-texture"
        >
          <div />
          <h2 className="gsans-bold text-3xl">부산지구 소식</h2>
          <div></div>
        </div>
        <motion.div
          initial={{ height: "auto" }}
          animate={{
            height: activeIndexes.has("news") ? "auto" : 0,
            opacity: activeIndexes.has("news") ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
          className={`flex flex-col 
              gap-28 justify-center items-center px-4 overflow-hidden`}
        >
          <div
            className={`flex flex-col justify-center items-center gap-4 text-gray-800 w-full`}
          >
            <h3 className="gsans-bold text-2xl">
              #1. 금식수련회 총단 간증영상
            </h3>
            <NewsYoutube youtubeId="cQcxxaMN87I" />
            <div className="font-medium whitespace-pre-line text-center flex flex-col gap-1">
              함께 가요 금식수련회
            </div>
          </div>

          <div
            className={`flex flex-col justify-center items-center gap-4 text-gray-800 w-full`}
          >
            <h3 className="gsans-bold text-2xl">
              #2. 소원 총단과 함께하는 여호수아 기도회 아웃도어
            </h3>
            <Image src={news2Img} alt="news2" priority></Image>
            <div className="font-medium whitespace-pre-line text-center flex flex-col gap-1">
              부산지구 10월 31일 목요채플 광고입니다 !<br />
              이번주 목요채플은 ❝ 여호수아 기도회 ❞ 로 함께합니다 ◡̈
              <br />
              소원총단 🐮☝🏻 과 함께하는 특별한 아웃도어 시간이 준비되어 있으니
              많관부‼️
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
