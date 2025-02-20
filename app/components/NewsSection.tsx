"use client";

import { motion } from "framer-motion";
import NewsYoutube from "./news/NewsYoutube";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/api/supabase";

type Props = {
  id: string;
};

type NewsData = {
  id: number;
  title: string;
  type: string;
  content: string | null; // 실제 내용 (영상 url, 이미지 url, 텍스트 등)
  description: string | null; // 부가설명 내용
  calltoaction: boolean | null;
  actionurl: string | null;
  actiontext: string | null;
};
export default function NewsSection({ id }: Props) {
  const [activeIndexes, setActiveIndexes] = useState<Set<string>>(
    new Set(["news"])
  );
  const [news, setNews] = useState<NewsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const { data: newsData, error: newsError } = await supabase
          .from("news")
          .select("*")
          .eq("post_id", parseInt(id));

        if (newsError) {
          throw error;
        }

        setNews(newsData); // 데이터 받아오면 상태 업데이트

        setLoading(false); // 로딩 상태 종료
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message); // 에러 처리
        } else {
          setError("unknown Error");
        }
        setLoading(false); // 로딩 상태 종료
      }
    };
    fetchNews();
  }, [id, error]); // id가 변경될 때마다 새로 호출

  if (loading) {
    return <div>Loading...</div>; // 로딩 중일 때 표시
  }

  if (error) {
    return <div>Error: {error}</div>; // 에러 발생 시 표시
  }

  const toggleAccordion = (index: string) => {
    setActiveIndexes((prevIndexes) => {
      const newIndexes = new Set(prevIndexes);
      if (newIndexes.has(index)) {
        newIndexes.delete(index);
      } else {
        newIndexes.add(index);
      }
      return newIndexes;
    });
  };
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
          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <div>{error}</div>
          ) : (
            news.map((newsItem, index) => (
              <div
                key={newsItem.id}
                className="flex flex-col justify-center items-center gap-4 my-8 text-gray-800 w-full"
              >
                <h3 className="gsans-bold text-2xl">
                  #{index + 1}. {newsItem.title}
                </h3>

                {/* 타입에 맞는 콘텐츠 렌더링 */}
                {newsItem.type === "video" && (
                  <NewsYoutube youtubeId={newsItem.content ?? ""} />
                )}

                {newsItem.type === "image" && (
                  <Image
                    src={newsItem.content ?? ""}
                    alt={newsItem.title}
                    priority
                    layout="intrinsic"
                    width={500}
                    height={300}
                  />
                )}

                {newsItem.type === "text" && (
                  <div className="font-medium whitespace-pre-line text-center flex flex-col gap-1">
                    {newsItem.content}
                  </div>
                )}

                {/* 부가설명 */}
                {newsItem.description && (
                  <div className="font-medium whitespace-pre-line text-center flex flex-col gap-1">
                    {newsItem.description}
                  </div>
                )}

                {/* Call to Action */}
                {newsItem.calltoaction && (
                  <div className="mt-4">
                    <a
                      href={newsItem.actionurl ?? ""}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 text-white rounded"
                    >
                      {newsItem.actiontext}
                    </a>
                  </div>
                )}
              </div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
}
