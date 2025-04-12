"use client";
import { motion } from "motion/react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/app/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { type ChartConfig } from "@/app/components/ui/chart";
import animationData from "@/public/animation_prize.json";
import animationThinking from "@/public/animation_thinking.json";
import animationPrize from "@/public/animation_prize2.json";
import animationMeet from "@/public/animation_meet.json";
import FooterSection from "@/app/components/FooterSection";
import Header from "@/app/components/ui/Header";
import dynamic from "next/dynamic";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });
const chartConfig = {
  contact: {
    label: "접촉",
    color: "#2563eb",
  },
  welcome: {
    label: "전도",
    color: "#60a5fa",
  },
} satisfies ChartConfig;

const chartData = [
  { campus: "가야대", contact: 30, welcome: 12 },
  { campus: "경남정보대", contact: 36, welcome: 20 },
  { campus: "경성대", contact: 623, welcome: 34 },
  { campus: "고신대", contact: 36, welcome: 31 },
  { campus: "동명대", contact: 120, welcome: 100 },
  { campus: "동서대", contact: 394, welcome: 144 },
  { campus: "동아/보건대", contact: 300, welcome: 58 },
  { campus: "동의/동과/부산여대", contact: 804, welcome: 49 },
  { campus: "부경대", contact: 300, welcome: 150 },
  { campus: "부산교대", contact: 236, welcome: 53 },
  { campus: "부산대", contact: 683, welcome: 254 },
  { campus: "부산외대", contact: 270, welcome: 48 },
  { campus: "아가페", contact: 153, welcome: 40 },
  { campus: "신라대", contact: 493, welcome: 43 },
  { campus: "인제대", contact: 214, welcome: 62 },
  { campus: "해양대", contact: 227, welcome: 150 },
];

export default function Next_page() {
  return (
    <div className="w-full h-full">
      <Header />
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.8,
          delay: 0.5,
          ease: [0, 0.71, 0.2, 1.01],
        }}
        className="flex-col justify-center mx-2 pt-2"
      >
        <p className="text-4xl font-extrabold">N E X T</p>
        <p className="text-xl font-semibold">New Evangelism X Truth</p>
        <p>진리 안에서 새로운 전도 방법 찾기</p>
      </motion.div>
      <div className="w-full flex space-x-2 px-2 pt-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="w-1/4 h-[100px] text-white content-center flex-col text-center bg-blue-800 px-1 rounded-md"
        >
          <p>16</p>
          <p className="text-[10px]">
            캠퍼스
            <br />
            사역의 수
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.95 }}
          className="w-1/4 h-[100px] text-white content-center flex-col text-center bg-blue-300 px-1 rounded-md"
        >
          <p>528</p>
          <p className="text-[10px]">신학기 가입현황</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="w-1/4 h-[100px] text-white content-center flex-col text-center bg-slate-500 px-1 rounded-md"
        >
          <p>6167</p>
          <p className="text-[10px]">접촉 및 전도</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.25 }}
          className="w-1/4 h-[100px] text-white content-center flex-col text-center bg-blue-400 rounded-md"
          px-1
        >
          <p>?</p>
          <p className="text-[10px]">우리의 목표</p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.25 }}
        className="py-2"
      >
        <div className="pt-4 px-2">
          <p className="text-2xl">3월 신학기 사역 현황</p>
          <p>접촉 4919명 전도 1248명</p>
        </div>
        <ChartContainer config={chartConfig} className="h-[200px] w-full pt-4">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="campus"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="contact" fill="var(--color-contact)" radius={4} />
            <Bar dataKey="welcome" fill="var(--color-welcome)" radius={4} />
          </BarChart>
        </ChartContainer>
      </motion.div>
      <motion.div
        className="m-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.3 }}
      >
        <div>
          <p className="text-2xl">전도 목표</p>
        </div>
      </motion.div>
      <div className="m-2 flex space-x-2 pt-2">
        <motion.div
          className="bg-blue-500 text-center w-1/4 p-2 rounded-md text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.35 }}
        >
          지속적인
          <br />
          전도
        </motion.div>
        <motion.div
          className="content-center"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.8,
            delay: 1.4,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        >
          순장 1명이 매주 1명이상 전도하기
        </motion.div>
      </div>
      <div className="m-2 flex space-x-2">
        <motion.div
          className="bg-blue-700 text-center w-1/4 p-2 rounded-md text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.35 }}
        >
          능동적인
          <br />
          전도
        </motion.div>
        <motion.div
          className="content-center"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.8,
            delay: 1.4,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        >
          이벤트가 아닌 자발적인 전도 참여
        </motion.div>
      </div>
      <div className="m-2 flex space-x-2">
        <motion.div
          className="bg-blue-500 text-center w-1/4 p-2 rounded-md text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.35 }}
        >
          전도의
          <br />
          확장
        </motion.div>
        <motion.div
          className="content-center"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.8,
            delay: 1.4,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        >
          내국인을 넘어 유학생 전도의 도전
        </motion.div>
      </div>
      <div className="m-2 flex space-x-2">
        <motion.div
          className="bg-blue-700 text-center w-1/4 p-2 rounded-md text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.35 }}
        >
          전도의
          <br />
          전수
        </motion.div>
        <motion.div
          className="content-center w-3/4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.8,
            delay: 1.4,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        >
          순장의 전도하는 삶을 통해 전도를 가르침
        </motion.div>
      </div>
      <div>
        <motion.div
          className="w-full flex-col"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.6,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="w-full h-32 flex justify-center">
            <Lottie
              animationData={animationData}
              loop={false}
              className="w-32"
            />
          </div>
          <div className="flex-col text-center">
            <div className="text-2xl">관계전도</div>
            <div className="text-xl">아이디어 콘테스트</div>
          </div>
          <div className="m-2">
            <div className="flex justify-center">
              <Lottie
                animationData={animationThinking}
                loop={true}
                className="w-64"
              />
            </div>
            <div className="flex text-center justify-center mt-2">
              <p className="w-64">
                다양한 전도 아이디어를 생각해내고 사역 지원비도 받을수 있다고?!
              </p>
            </div>
          </div>
        </motion.div>
      </div>
      <div className="m-2 pt-2">
        <div className="w-full flex-col justify-center space-y-2">
          <motion.p
            className="bg-blue-300 w-full mx-auto p-2 rounded-md text-white"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.4,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            viewport={{ once: true, amount: 0.2 }}
          >
            1 단계 <br />
            관계전도를 함께할 동역자 3명이상의 팀을 만든다
          </motion.p>
          <motion.p
            className="bg-blue-400 w-full mx-auto p-2 rounded-md text-white"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.6,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            viewport={{ once: true, amount: 0.2 }}
          >
            2 단계 <br />
            관계전도 아이디어 보고서를 제출한다
          </motion.p>
          <motion.p
            className="bg-blue-600 w-full mx-auto p-2 rounded-md text-white"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.8,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            viewport={{ once: true, amount: 0.2 }}
          >
            3 단계 <br />
            제출 후 심사를 기다린다
          </motion.p>
        </div>
        <div>
          <motion.div
            className="flex-col flex items-center pt-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.8,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            viewport={{ once: true, amount: 0.2 }}
          >
            <Lottie
              animationData={animationPrize}
              loop={false}
              className="w-32"
            />
            <div className="flex-col text-center">
              <p className="text-2xl">랜덤전도</p>
              <p className="text-xl">콘테스트</p>
            </div>
            <div className="flex justify-center">
              <Lottie
                animationData={animationMeet}
                loop={true}
                className="w-64"
              />
            </div>
          </motion.div>
          <div className="pt-4 flex justify-center">
            <p>
              부산지구에서 가장 열심히 전도하는 <br />
              7개 캠퍼스에게 상금이 주어집니다!
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.8,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            viewport={{ once: true, amount: 0.2 }}
          >
            <div className="space-y-2 pt-2">
              <p className="bg-blue-300  w-full mx-auto p-2 rounded-md text-white text-center">
                매주 캠퍼스별 전도 현황 파악
              </p>
              <p className="bg-blue-500 w-full mx-auto p-2 rounded-md text-white text-center">
                기간은 4월 첫주부터 5월 마지막 주 까지
              </p>
            </div>
            <div className="flex-col text-center space-y-2 py-4">
              <p className="bg-yellow-300 rounded-md p-2">총 상금 200만원</p>
              <p className="bg-yellow-400 rounded-md p-2">
                모든 콘테스트 시상은 6월 첫째주 시상 예정
              </p>
              <p className="bg-yellow-500 rounded-md p-2">
                랜덤전도 상위 7 캠퍼스
                <br /> 관계전도 상위 3 캠퍼스
              </p>
            </div>
          </motion.div>
        </div>
        <div className="px-2 flex-col justify-center py-4 space-y-4 ">
          <motion.div
            className="flex items-end space-x-2 justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.8,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            viewport={{ once: true, amount: 0.2 }}
          >
            <p className="text-2xl">우리의 기대</p>
            <p>feat 소원총단</p>
          </motion.div>
          <motion.div
            className="bg-blue-300 p-4 rounded-md"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.6,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            viewport={{ once: true, amount: 0.2 }}
          >
            <div className="text-xl">4월</div>
            <div className="pl-1">
              <li>공동체로의 접붙임</li>
              <li>중간고사 이후 LTC 교육 진행</li>
              <li>전도의 능동적인 참여</li>
            </div>
          </motion.div>
          <motion.div
            className="bg-blue-300 p-4 rounded-md"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.6,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            viewport={{ once: true, amount: 0.2 }}
          >
            <div className="text-xl">5월</div>
            <div className="pl-1">
              <li>전도하는 순장의 삶을 통해 전도하는 순원 육성</li>
            </div>
          </motion.div>
          <motion.div
            className="bg-blue-300 p-4 rounded-md"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.6,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            viewport={{ once: true, amount: 0.2 }}
          >
            <div className="text-xl">6월</div>
            <div className="pl-1">
              <li>모든 순장, 순원이 함께 나아가는 여름 수련회</li>
              <li>새 친구 목표 : 80명 (2024년 : 36명)</li>
            </div>
          </motion.div>
          <motion.div
            className="bg-blue-300 p-4 rounded-md"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.6,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            viewport={{ once: true, amount: 0.2 }}
          >
            <div className="text-xl">여름수련회</div>
            <div className="pl-1">
              <li>6월23일 ~ 27일</li>
              <li>목표인원 : 800명 (2024년 : 654명)</li>
            </div>
          </motion.div>
        </div>
      </div>
      <FooterSection />
    </div>
  );
}
