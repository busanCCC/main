import { PrayType } from "@/app/types/worship";

type PrayerProps = {
  prayType: PrayType;
  prayer: string;
  className?: string;
};

export default function Prayer({
  prayType,
  prayer,
  className = "selection:",
}: PrayerProps) {
  const getPrayerTitle = (prayType: PrayType) => {
    switch (prayType) {
      case "opening":
        return "시작 기도";
      case "offering":
        return "헌금 기도";
      case "general":
        return "대표 기도";
      case "testimony":
        return "간증";
    }
  };

  return (
    <div
      className={`flex flex-col justify-center items-center gap-4 text-gray-800
    ${className}`}
    >
      <div className="font-light tracking-widest">
        {getPrayerTitle(prayType)}
      </div>
      <h3 className="gsans-bold text-2xl">{prayer}</h3>
    </div>
  );
}
