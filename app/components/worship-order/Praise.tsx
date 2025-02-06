import { Link2 } from "lucide-react";
import { useEffect, useState } from "react";

type PraiseProps = {
  className?: string;
  id: string;
};

type PraiseItem = {
  title: string;
  id: number;
  youtubeUrl: string;
};

export default function Praise({ className = "", id }: PraiseProps) {
  const [praiseList, setPraiseList] = useState<PraiseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // API에서 praise 데이터를 불러오는 함수
    async function fetchPraiseData() {
      try {
        const res = await fetch(`/api/posts/${id}`); // 동적 id 기반 API 호출
        if (!res.ok) {
          throw new Error("데이터를 불러오는데 실패했습니다.");
        }
        const data = await res.json();
        // praise 데이터를 데이터 구조에 맞게 추출
        setPraiseList(data.praises || []);
      } catch (error) {
        setError(error as string);
      } finally {
        setLoading(false);
      }
    }
    fetchPraiseData();
    console.log("받은 찬양 데이터", praiseList);
  }, [id]); // id가 변경될 때마다 새로 호출

  return (
    <div
      className={`flex flex-col justify-center items-center gap-6 text-gray-800
    ${className}`}
    >
      <div className="font-light tracking-widest">찬양 LIST</div>
      {praiseList.map((praise, index) => (
        <div
          key={index}
          className="flex justify-center items-center gap-2 gsans-bold text-xl"
        >
          <p>
            {praise.id}. {praise.title}
          </p>
          <Link2
            size={20}
            className="cursor-pointer"
            onClick={() => window.open(praise.youtubeUrl)}
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
