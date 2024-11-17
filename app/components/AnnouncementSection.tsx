import { motion } from "framer-motion";
import Announcement from "./announcement/Announcement";
import CustomAnnouncement from "./announcement/CustomAnnouncement";
import { Button } from "./ui/button";
import { SearchIcon } from "lucide-react";

export default function AnnouncementSection({
  activeIndexes,
  toggleAccordion,
}: {
  activeIndexes: Set<string>;
  toggleAccordion: (index: string) => void;
}) {
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
          <CustomAnnouncement
            index={1}
            title="2024 금식수련회 가등록"
            className="mt-24"
          >
            <div>
              일시: 12월 26일~28일 | 장소: 감림산 기도원
              <br />
              회비: 가등록 2만원/완등록 6만원
            </div>
            <Button
              className="mt-2"
              onClick={() => {
                window.open(
                  "https://sites.google.com/kccc.org/2024fastpray/home",
                  "_blank"
                );
              }}
            >
              지금 등록하러 가기
            </Button>
          </CustomAnnouncement>
          <Announcement
            index={2}
            title="금식수련회 이벤트: 복권 이벤트"
            content={`금식수련회 기도회 노트가 오늘 배부됩니다!\n기도 노트에 10개의 기도제목을 작성하시면 복권 1개!`}
          />
          <Announcement
            index={3}
            title="홀리라이프 금식수련회 연합찬양팀 모집"
            content={`모집분야: 건반, 드럼, 베이스, 일렉기타, 싱어, 호산나\n연습일정: 12월 23~24일\n신청 및 문의사항 최기정순장(010-1234-5678)`}
            subContent={`*캠퍼스 간사님과 사전 협의 후 신청하세요!`}
          />

          <Announcement
            index={4}
            title="예배 전 기도회"
            content={`시간: 오후 5시\n장소: 산성교회 지하 세미나실\n예배를 위해서 기도할 기도핑을 찾습니다!\n함께 예배를 세워가는 모두가 됩시다!`}
          />

          <Announcement
            index={5}
            title="부산지구 리트릿"
            content={`시간: 오후 9시\n장소: 부산 CCC 비전센터\n기도로 무장하는 부산지구 C맨이 됩시다!`}
            subContent={`*졸업반 모임이 시작됩니다`}
          />

          <CustomAnnouncement
            index={6}
            title="다음주 채플은 '넘치는 교회'에서 진행합니다."
            className="mb-24"
          >
            <Button
              className=""
              onClick={() => {
                window.open("https://naver.me/xOC1Cl3z", "_blank");
              }}
            >
              <SearchIcon />
              넘치는 교회 위치 확인하기
            </Button>
          </CustomAnnouncement>
        </motion.div>
      </div>
    </div>
  );
}
