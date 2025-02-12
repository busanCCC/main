import { supabase } from "@/api/supabase";
import { Link2 } from "lucide-react";
import { useEffect, useState } from "react";

type PraiseProps = {
  className?: string;
  id: number;
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
          .eq("post_id", id);

        if (error) {
          throw new Error(error.message);
        }

        setPraiseList(data); // 데이터 받아오면 상태 업데이트
        setLoading(false); // 로딩 상태 종료
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message); // 에러 처리
        } else {
          setError("unknown Error");
        }
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
      {praiseList.map((praise, index) => (
        <div
          key={praise.id}
          className="flex justify-center items-center gap-2 gsans-bold text-xl"
        >
          <p>
            {index + 1}. {praise.title}
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
