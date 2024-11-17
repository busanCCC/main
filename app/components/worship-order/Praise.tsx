import { Link2 } from "lucide-react";

type PraiseProps = {
  className?: string;
};

export default function Praise({ className = "" }: PraiseProps) {
  return (
    <div
      className={`flex flex-col justify-center items-center gap-6 text-gray-800
    ${className}`}
    >
      <div className="font-light tracking-widest">찬양 LIST</div>
      {praiseDummyData.map((praise, index) => (
        <div
          key={index}
          className="flex justify-center items-center gap-2 gsans-bold text-xl"
        >
          <p>{praise.title}</p>
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
