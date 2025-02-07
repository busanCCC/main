import { supabase } from "@/api/supabase";
import { Link2 } from "lucide-react";
import { useEffect, useState } from "react";

type PraiseProps = {
  className?: string;
  id: string;
};

type PraiseItem = {
  title: string;
  id: number;
  youtubeurl: string | null;
};

export default function Praise({ className = "", id }: PraiseProps) {
  const [praiseList, setPraiseList] = useState<PraiseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // API에서 praise 데이터를 불러오는 함수
    async function fetchPraiseData() {
      try {
        const { data, error } = await supabase
          .from("praises")
          .select("*")
          .eq("post_id", parseInt(id));

        if (error) {
          throw error;
        }

        console.log("praises:", data);
        setPraiseList(data); // 데이터 받아오면 상태 업데이트
        setLoading(false); // 로딩 상태 종료
      } catch (err: any) {
        setError(err.message); // 에러 처리
        setLoading(false); // 로딩 상태 종료
      }
    }
    fetchPraiseData();
  }, [id]); // id가 변경될 때마다 새로 호출

  if (loading) {
    return <div>Loading...</div>; // 로딩 중일 때 표시
  }

  if (error) {
    return <div>Error: {error}</div>; // 에러 발생 시 표시
  }

  return (
    <div
      className={`flex flex-col justify-center items-center gap-6 text-gray-800
    ${className}`}
    >
      <div className="font-light tracking-widest">찬양 LIST</div>
      {praiseList.map((praise) => (
        <div
          key={praise.id}
          className="flex justify-center items-center gap-2 gsans-bold text-xl"
        >
          <p>
            {praise.id}. {praise.title}
          </p>
          <Link2
            size={20}
            className="cursor-pointer"
            onClick={() => window.open(praise.youtubeurl ?? "")}
          />
        </div>
      ))}
    </div>
  );
}

const praiseDummyData = [
  {
    title: "01. 예수 사랑합니다",
    youtubeUrl: "https://youtu.be/4LnEHg4nFuI?si=MnMilTBxZbAokU5Q",
  },
  {
    title: "02. 주를 찾는 모든 자들이",
    youtubeUrl: "https://youtu.be/Fi2waeWY18g?si=zQAe2mRs8OC_0q_D",
  },
  {
    title: "03. 주를 바라보며",
    youtubeUrl: "https://youtu.be/GoDfGIzFIyA?si=zZgRmWt-Kz_f8zdCA",
  },
  {
    title: "04. 시선",
    youtubeUrl: "https://youtu.be/xI920TT1fRY?si=qFklGXnHZN-2Jpi6",
  },
  {
    title: "05. 나 가진재물 없으나",
    youtubeUrl: "https://youtu.be/xfMR117MG_0?si=hi-0Fd5tIXIlF4uk",
  },
];
