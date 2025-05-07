// app/components/PrayerChainSectionServer.tsx
import PrayerChainSection from "@/app/components/PrayerChainSection";
import supabase from "@/utils/supabase/client";

export default async function PrayerChainSectionServer() {
  const { data, error } = await supabase
    .from("prayer_chain")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    return <div>에러: {error.message}</div>;
  }

  // 요일 계산
  const dataWithDay = (data ?? []).map((item) => ({
    ...item,
    day: ["일", "월", "화", "수", "목", "금", "토"][
      new Date(item.date).getDay()
    ],
    prayingCount: item.praying_count,
  }));

  return <PrayerChainSection data={dataWithDay} />;
}
