"use client";

import { motion } from "framer-motion";
import Announcement from "./announcement/Announcement";
import CustomAnnouncement from "./announcement/CustomAnnouncement";
import { Button } from "./ui/button";
import { SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  content?: string;
  id: string;
};

type AnnouncementData = {
  id: number;
  title: string;
  content?: string;
  subContent?: string;
  callToAction?: {
    text: string;
    url?: string;
  }[];
};

export default function AnnouncementSection({ content, id }: Props) {
  const [activeIndexes, setActiveIndexes] = useState<Set<string>>(
    new Set(["announcement"])
  );
  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch(`/api/posts/${id}`); // API URL
        if (!response.ok) {
          throw new Error("Failed to fetch announcements");
        }
        const data = await response.json();
        setAnnouncements(data.announcements || []); // 받은 데이터를 상태에 저장
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
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
      <div className="bg-zinc-100">
        <div
          onClick={() => toggleAccordion("announcement")}
          className="cursor-pointer  px-4 py-8 sticky top-0 z-10 flex justify-between bg-zinc-100"
        >
          <div />
          <h2 className="gsans-bold text-3xl">광고</h2>
          <div></div>
        </div>
        <motion.div
          initial={{ height: "auto" }}
          animate={{
            height: activeIndexes.has("announcement") ? "auto" : 0,
            opacity: activeIndexes.has("announcement") ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
          className={`flex flex-col 
              gap-28 justify-center items-center px-4 overflow-hidden`}
        >
          {/* 광고 */}
          {announcements.length > 0 ? (
            announcements.map((announcement) => (
              <CustomAnnouncement
                key={announcement.id}
                index={announcement.id}
                title={announcement.title}
                className="my-12"
              >
                <div style={{ whiteSpace: "pre-wrap" }}>
                  {announcement.content}
                </div>
                {announcement.subContent && (
                  <div style={{ whiteSpace: "pre-wrap", color: "#6B7280" }}>
                    {announcement.subContent}
                  </div>
                )}

                {announcement.callToAction &&
                  announcement.callToAction.length > 0 &&
                  announcement.callToAction.map((cta, idx) => (
                    <Button
                      key={idx}
                      className="mt-2"
                      onClick={() => {
                        window.open(cta.url, "_blank");
                      }}
                    >
                      {cta.text}
                    </Button>
                  ))}
              </CustomAnnouncement>
            ))
          ) : (
            <div>No announcements available</div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
