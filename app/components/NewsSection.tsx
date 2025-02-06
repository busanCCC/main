"use client";

import { motion } from "framer-motion";
import NewsYoutube from "./news/NewsYoutube";
import Image from "next/image";
import news2Img from "@/public/news2.png";
import { useEffect, useState } from "react";

type Props = {
  id: string;
};

type NewsData = {
  id: number;
  title: string;
  type: "video" | "image" | "text";
  content: string; // 실제 내용 (영상 url, 이미지 url, 텍스트 등)
  callToAction?: CallToAction[];
  description?: string; // 부가설명 내용
};
type CallToAction = {
  text: string;
  url?: string;
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
        const response = await fetch(`/api/posts/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch News");
        }
        const data = await response.json();
        setNews(data.news || []);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [id]);

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
            news.map((newsItem) => (
              <div
                key={newsItem.id}
                className="flex flex-col justify-center items-center gap-4 my-8 text-gray-800 w-full"
              >
                <h3 className="gsans-bold text-2xl">
                  #{newsItem.id}. {newsItem.title}
                </h3>

                {/* 타입에 맞는 콘텐츠 렌더링 */}
                {newsItem.type === "video" && (
                  <NewsYoutube youtubeId={newsItem.content} />
                )}

                {newsItem.type === "image" && (
                  <Image
                    src={newsItem.content}
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
                {newsItem.callToAction && newsItem.callToAction.length > 0 && (
                  <div className="mt-4">
                    {newsItem.callToAction.map((cta, idx) => (
                      <a
                        key={idx}
                        href={cta.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-500 text-white rounded"
                      >
                        {cta.text}
                      </a>
                    ))}
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
