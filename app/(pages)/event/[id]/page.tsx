// ✅ 서버 컴포넌트
import WorshipOrderSection from "../../../components/WorshipOrderSection";
import MainSection from "../../../components/MainSection";
import AnnouncementSection from "../../../components/AnnouncementSection";
import NewsSection from "../../../components/NewsSection";
import Header from "../../../components/ui/Header";
import { supabase } from "@/api/supabase";

async function fetchPostData(id: number) {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  console.log("쿼리 결과 data:", data);
  if (error) {
    console.error("데이터를 가져오는 중 오류 발생:", error);
    return null;
  }
  console.log(id);
  return data;
}

// ✅ Next.js에서 서버 컴포넌트에서 동적 라우팅을 위한 props
export default async function EventPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const numericId = parseInt(id, 10);
  const postData = await fetchPostData(numericId);

  if (!postData) {
    return (
      <div className="text-center p-10 text-red-500">
        해당 게시물을 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto">
      <Header />
      <MainSection isAdmin={false} />
      <WorshipOrderSection
        openingPrayer={postData?.openingPrayer ?? ""}
        generalPrayer={postData?.generalPrayer ?? ""}
        offeringPrayer={postData?.offeringPrayer ?? ""}
        testimonyPrayer={postData?.testimonyPrayer ?? ""}
        passage={postData?.passage ?? ""}
        messenger={postData?.messenger ?? ""}
        word={postData?.word ?? ""}
        id={numericId}
      />
      <AnnouncementSection id={numericId.toString()} />
      <NewsSection id={numericId.toString()} />
    </div>
  );
}
