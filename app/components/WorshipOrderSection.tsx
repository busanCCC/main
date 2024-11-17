import Message from "./worship-order/Message";
import Praise from "./worship-order/Praise";
import Prayer from "./worship-order/Prayer";
import { motion } from "framer-motion";

export default function WorshipOrderSection({
  activeIndexes,
  toggleAccordion,
}: {
  activeIndexes: Set<string>;
  toggleAccordion: (index: string) => void;
}) {
  return (
    <div className="w-full">
      <div className="bg-stone-200 bg-texture">
        <div
          onClick={() => toggleAccordion("order")}
          className="cursor-pointer  px-4 py-8 sticky top-0 z-10 flex justify-between bg-stone-200 bg-texture"
        >
          <div />
          <h2 className="gsans-bold text-3xl">예배 순서</h2>
          <div></div>
        </div>
        <motion.div
          initial={{ height: "auto" }}
          animate={{
            height: activeIndexes.has("order") ? "auto" : 0,
            opacity: activeIndexes.has("order") ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
          className={`flex flex-col 
              gap-28 justify-center items-center px-4 overflow-hidden`}
        >
          {/* 시작기도 */}
          <Prayer prayType="opening" prayer="권혜림 순장" className="mt-24" />

          {/* 찬양 */}
          <Praise />

          {/* 대표기도 */}
          <Prayer prayType="general" prayer="심민균 순장" />

          {/* 메시지 */}
          <Message
            title="한 밤중에 일어난 역사"
            passage="사도행전 16장 25-31"
            messenger="정선원 간사"
            words={`25   한밤중에 바울과 실라가 기도하고 하나님을 찬송하매 죄수들이 듣더라\n26   이에 갑자기 큰 지진이 나서 옥터가 움직이고 문이 곧 다 열리며 모든 사람의 매인 것이 다 벗어진지라\n27   간수가 자다가 깨어 옥문들이 열린 것을 보고 죄수들이 도망한 줄 생각하고 칼을 빼어 자결하려 하거늘\n28   바울이 크게 소리 질러 이르되 네 몸을 상하지 말라 우리가 다 여기 있노라 하니\n29   간수가 등불을 달라고 하며 뛰어 들어가 무서워 떨며 바울과 실라 앞에 엎드리고\n30   그들을 데리고 나가 이르되 선생들이여 내가 어떻게 하여야 구원을 받으리이까 하거늘\n31   이르되 주 예수를 믿으라 그리하면 너와 네 집이 구원을 받으리라 하고\n`}
          />

          {/* 헌금기도 */}
          <Prayer prayType="offering" prayer="서혜나 순장" className="mb-24" />
        </motion.div>
      </div>
    </div>
  );
}
