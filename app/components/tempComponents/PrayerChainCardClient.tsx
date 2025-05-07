// app/components/PrayerChainCardClient.tsx
"use client";
import { useEffect, useState } from "react";
import supabase from "@/utils/supabase/client";
import PrayerChainCard from "@/app/components/PrayerChainCard";

interface PrayerChainRow {
  id: number;
  date: string;
  campus: string;
  prayers: string[];
  praying_count: number;
}

export default function PrayerChainCardClient({
  initialData,
}: {
  initialData: PrayerChainRow;
}) {
  const [data, setData] = useState<PrayerChainRow | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [prayingCount, setPrayingCount] = useState<number>(
    initialData.praying_count ?? 0
  );
  const [disabled, setDisabled] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
        .from("prayer_chain")
        .select("*")
        .order("date", { ascending: false })
        .limit(1)
        .single();
      setData(data);
      setPrayingCount(data?.praying_count ?? 0);
      setLoading(false);
      // 세션 내 중복 클릭 방지
      if (data && typeof window !== "undefined") {
        const prayedAt = localStorage.getItem(`prayerChainPrayed_${data.id}`);
        if (prayedAt) {
          const prayedDate = new Date(prayedAt).toDateString();
          const today = new Date().toDateString();
          if (prayedDate === today) {
            setDisabled(true);
            setMessage("기도로 동역해주셔서 감사합니다");
          }
        }
      }
    }
    fetchData();
  }, []);

  const handlePray = async () => {
    if (!data) return;
    if (disabled) return;
    const { error } = await supabase
      .from("prayer_chain")
      .update({ praying_count: prayingCount + 1 })
      .eq("id", data.id);
    if (!error) {
      setPrayingCount(prayingCount + 1);
      setDisabled(true);
      setMessage("기도로 동역해주셔서 감사합니다");
      if (typeof window !== "undefined") {
        localStorage.setItem(
          `prayerChainPrayed_${data.id}`,
          new Date().toISOString()
        );
      }
    } else {
      alert("오류가 발생했습니다.");
    }
  };

  if (loading) return <div>로딩중...</div>;
  if (!data) return <div>데이터 없음</div>;

  const day = ["일", "월", "화", "수", "목", "금", "토"][
    new Date(data.date).getDay()
  ];

  return (
    <>
      <PrayerChainCard
        date={data.date}
        day={day}
        campus={data.campus}
        prayers={data.prayers}
        prayingCount={prayingCount}
        onPray={handlePray}
        disabled={disabled}
      />
      {message && (
        <div className="text-center text-blue-500 text-sm mt-2">{message}</div>
      )}
    </>
  );
}
