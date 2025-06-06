"use client";

import { motion } from "framer-motion";
import CustomAnnouncement from "./announcement/CustomAnnouncement";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/api/supabase";

type Props = {
  id: string;
};

type AnnouncementData = {
  id: number;
  title: string;
  post_id: number | null;
  content: string | null;
  subcontent: string | null;
  calltoaction: boolean | null;
  actionurl: string | null;
  actiontext: string | null;
};

export default function AnnouncementSection({ id }: Props) {
  const [activeIndexes, setActiveIndexes] = useState<Set<string>>(
    new Set(["announcement"])
  );
  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data: announcementsData, error: announcementsError } =
          await supabase
            .from("announcements")
            .select("*")
            .eq("post_id", parseInt(id))
            .order("id", { ascending: true });

        if (announcementsError) {
          throw error;
        }

        setAnnouncements(announcementsData); // 데이터 받아오면 상태 업데이트

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
    fetchAnnouncements();
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
            announcements.map((announcement, index) => {
              return (
                <CustomAnnouncement
                  key={announcement.id}
                  index={index + 1}
                  title={announcement.title}
                  className="my-12"
                >
                  <div style={{ whiteSpace: "pre-wrap" }}>
                    {announcement.content}
                  </div>
                  {announcement.subcontent && (
                    <div style={{ whiteSpace: "pre-wrap", color: "#6B7280" }}>
                      {announcement.subcontent}
                    </div>
                  )}

                  {announcement.calltoaction && (
                    <Button
                      className="mt-2"
                      onClick={() => {
                        window.open(announcement.actionurl ?? "", "_blank");
                      }}
                    >
                      {announcement.actiontext}
                    </Button>
                  )}
                </CustomAnnouncement>
              );
            })
          ) : (
            <div>No announcements available</div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
