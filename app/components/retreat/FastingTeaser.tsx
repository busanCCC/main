"use client";

import {
  animate,
  motion,
  useMotionValue,
  useScroll,
  useTransform,
} from "framer-motion";
import { Anton, Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import { useEffect, useState, type ReactNode } from "react";

const titleFont = Noto_Serif_KR({
  weight: "300",
  subsets: ["latin"],
  display: "swap",
});

const posterFont = Anton({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const posterSubFont = Noto_Sans_KR({
  weight: "900",
  subsets: ["latin"],
  display: "swap",
});

const EASE_IN_OUT: [number, number, number, number] = [0.42, 0, 0.58, 1];
const HIKER_DELAY = 0.2;
const HIKER_S = 1.2;
// 인물이 흑백 배경 위에 다 들어선 뒤 찢김이 시작된다
const TEAR_DELAY = HIKER_DELAY + HIKER_S + 0.15;
const CRACK_S = 0.55;
const PULL_S = 1.6;
const NAV_H = 52;
const ACCENT = "#e8c983";
const POSTER_INK = "#2a237a";
const POSTER_SUB = "#6c62c4";

// 16:9 무대 좌표(px). 포스터 원본의 흰 찢김선을 추적한 값이며, 마지막 구간은 바위 턱을 따라 내려간다.
const STAGE_W = 1600;
const STAGE_H = 900;
const TEAR_LINE: [number, number][] = [
  [0.232, -0.02],
  [0.247, 0.056],
  [0.259, 0.111],
  [0.27, 0.167],
  [0.286, 0.222],
  [0.299, 0.278],
  [0.316, 0.333],
  [0.327, 0.389],
  [0.348, 0.444],
  [0.357, 0.5],
  [0.367, 0.556],
  [0.39, 0.611],
  [0.398, 0.667],
  [0.405, 0.722],
  [0.416, 0.78],
  [0.43, 0.818],
  [0.47, 0.83],
  [0.53, 0.835],
  [0.6, 0.85],
  [0.632, 0.9],
  [0.652, 1.02],
];

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

// 찢김선을 잘게 나눠 법선 방향으로 흔들어 종이 섬유 같은 가장자리를 만든다. offset > 0 이면 찢겨 나가는 쪽으로 밀린다.
function tornEdge(seed: number, offset: number, amp: number) {
  const rand = seeded(seed);
  const pts: [number, number][] = [];
  for (let i = 0; i < TEAR_LINE.length - 1; i++) {
    const x0 = TEAR_LINE[i][0] * STAGE_W;
    const y0 = TEAR_LINE[i][1] * STAGE_H;
    const x1 = TEAR_LINE[i + 1][0] * STAGE_W;
    const y1 = TEAR_LINE[i + 1][1] * STAGE_H;
    const len = Math.hypot(x1 - x0, y1 - y0);
    const nx = (y1 - y0) / len;
    const ny = -(x1 - x0) / len;
    const steps = Math.max(1, Math.round(len / 6));
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const d = offset + (rand() - 0.5) * 2 * amp;
      pts.push([x0 + (x1 - x0) * t + nx * d, y0 + (y1 - y0) * t + ny * d]);
    }
  }
  const [lx, ly] = TEAR_LINE[TEAR_LINE.length - 1];
  pts.push([lx * STAGE_W + offset, ly * STAGE_H]);
  return pts.map(
    ([x, y]) => `${((x / STAGE_W) * 100).toFixed(3)}% ${((y / STAGE_H) * 100).toFixed(3)}%`,
  );
}

const CUT_EDGE = tornEdge(7, 0, 2.2);
const FIBER_EDGE = tornEdge(13, 15, 5);
const KEEP_CLIP = `polygon(-1% -2%, ${CUT_EDGE.join(", ")}, -1% 102%)`;
const FIBER_CLIP = `polygon(-1% -2%, ${FIBER_EDGE.join(", ")}, -1% 102%)`;
const TORN_CLIP = `polygon(${CUT_EDGE.join(", ")}, 101% 102%, 101% -2%)`;

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.08 },
  transition: { duration: 0.85, ease: EASE_IN_OUT },
};

const SECTIONS = [
  { id: "theme", label: "주제" },
  { id: "info", label: "안내" },
  { id: "fee", label: "회비" },
  { id: "schedule", label: "일정" },
  { id: "apply", label: "신청" },
] as const;

const SCRIPTURE = [
  { n: 18, t: "너희는 이전 일을 기억하지 말며 옛날 일을 생각하지 말라" },
  {
    n: 19,
    t: "보라 내가 새 일을 행하리니 이제 나타낼 것이라 너희가 그것을 알지 못하겠느냐 반드시 내가 광야에 길을 사막에 강을 내리니",
  },
  {
    n: 20,
    t: "장차 들짐승 곧 승냥이와 타조도 나를 존경할 것은 내가 광야에 물을, 사막에 강들을 내어 내 백성, 내가 택한 자에게 마시게 할 것임이라",
  },
  { n: 21, t: "이 백성은 내가 나를 위하여 지었나니 나의 찬송을 부르게 하려 함이니라" },
] as const;

const KEY_VERSES = new Set<number>([19]);

const KINDS = {
  worship: { label: "예배 · 집회", rgb: "232,201,131" },
  lecture: { label: "특강", rgb: "143,184,232" },
  prayer: { label: "기도", rgb: "185,163,232" },
  meal: { label: "섭식", rgb: "127,209,185" },
  life: { label: "생활", rgb: "160,170,190" },
} as const;

type Kind = keyof typeof KINDS;

const HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 1] as const;

type TableCell = { title: string; sub?: string; span: number; kind: Kind };

const COL_DAYS = [
  {
    label: "월(12/29)",
    day: "월",
    date: "12.29",
    cells: new Map<number, TableCell>([
      [10, { title: "등록", span: 1, kind: "life" }],
      [11, { title: "개회예배", span: 1, kind: "worship" }],
      [12, { title: "짐 정리", span: 1, kind: "life" }],
      [13, { title: "전체특강 1", sub: "김성철 선교사", span: 2, kind: "lecture" }],
      [15, { title: "휴식 및 광고", span: 1, kind: "life" }],
      [16, { title: "기도합주회", span: 2, kind: "prayer" }],
      [18, { title: "휴식 및 기도빙고", span: 1, kind: "prayer" }],
      [19, { title: "저녁집회", sub: "박성민 목사", span: 2, kind: "worship" }],
      [21, { title: "세면 및 정비", span: 2, kind: "life" }],
      [23, { title: "철야 기도회", sub: "박찬수 간사", span: 2, kind: "prayer" }],
      [1, { title: "취침 개인기도", span: 1, kind: "life" }],
    ]),
  },
  {
    label: "화(12/30)",
    day: "화",
    date: "12.30",
    cells: new Map<number, TableCell>([
      [9, { title: "QT 및 세면", span: 1, kind: "prayer" }],
      [10, { title: "전체특강 2", sub: "한정희 사모", span: 2, kind: "lecture" }],
      [12, { title: "휴식 및 광고", span: 1, kind: "life" }],
      [13, { title: "자유기도회", sub: "개인기도 · 선기도 · 세계기도", span: 2, kind: "prayer" }],
      [15, { title: "선택특강", span: 2, kind: "lecture" }],
      [17, { title: "1차 섭식", span: 2, kind: "meal" }],
      [19, { title: "저녁집회", sub: "정선원 간사", span: 2, kind: "worship" }],
      [21, { title: "셀러브레이션", span: 1, kind: "worship" }],
      [22, { title: "지구 및 캠퍼스모임", span: 1, kind: "life" }],
    ]),
  },
  {
    label: "수(12/31)",
    day: "수",
    date: "12.31",
    cells: new Map<number, TableCell>([
      [6, { title: "새벽예배", sub: "최승재 간사", span: 1, kind: "worship" }],
      [7, { title: "2차 섭식", span: 2, kind: "meal" }],
      [9, { title: "청소 및 짐정리", span: 1, kind: "life" }],
      [10, { title: "폐회예배", sub: "윤희영 간사", span: 1, kind: "worship" }],
    ]),
  },
] as const;

const FEES = [
  {
    name: "가등록",
    price: "6만원",
    note: "신청 시 가등록금을 먼저 납부합니다",
    highlight: true,
    parts: [
      { label: "가등록금", price: "2만원", sub: "신청 시 납부", strong: true },
      { label: "완등록금", price: "4만원", sub: "나머지 금액" },
    ],
  },
  { name: "현장등록", price: "7만원", note: "당일 현장에서 등록 시" },
] as const;

const APPLY_STEPS = [
  {
    title: "가등록",
    desc: "신청하기에서 가등록을 신청한 뒤, 각 캠퍼스 재정담당자에게 가등록금 2만원을 납부하면 가등록이 완료됩니다.",
  },
  {
    title: "특강 신청",
    desc: "특강 신청 기간에 선착순으로 특강 신청을 진행합니다.",
  },
  {
    title: "완등록",
    desc: "각 캠퍼스 재정담당자에게 완등록금 4만원을 납부하면 완등록이 완료됩니다.",
  },
] as const;

const MAP_URL = `https://map.naver.com/p/search/${encodeURIComponent("감림산기도원")}`;

function hourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function endLabel(start: number, span: number) {
  const index = HOURS.indexOf(start as (typeof HOURS)[number]);
  const next = HOURS[index + span];
  return hourLabel(next ?? (start + span) % 24);
}

function cellEntries(cells: Map<number, TableCell>) {
  const entries: [number, TableCell][] = [];
  cells.forEach((cell, start) => entries.push([start, cell]));
  return entries;
}

function isCovered(cells: Map<number, TableCell>, hour: number) {
  const index = HOURS.indexOf(hour as (typeof HOURS)[number]);
  return cellEntries(cells).some(([start, cell]) => {
    const startIndex = HOURS.indexOf(start as (typeof HOURS)[number]);
    return index > startIndex && index < startIndex + cell.span;
  });
}

function kindColor(kind: Kind, alpha = 1) {
  return `rgba(${KINDS[kind].rgb},${alpha})`;
}

function SectionCard({
  id,
  index,
  eyebrow,
  title,
  scrollMargin,
  children,
}: {
  id: string;
  index: number;
  eyebrow: string;
  title: string;
  scrollMargin: number;
  children: ReactNode;
}) {
  return (
    <motion.article
      id={id}
      className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:p-8"
      style={{ scrollMarginTop: scrollMargin }}
      {...fadeUp}
    >
      <header className="mb-6 flex items-baseline gap-3 border-b border-white/10 pb-4">
        <span className={`${titleFont.className} text-sm`} style={{ color: ACCENT }}>
          {String(index).padStart(2, "0")}
        </span>
        <h2 className={`${titleFont.className} text-[22px] text-[#f3efe6]`}>{title}</h2>
        <span className="ml-auto text-[11px] uppercase tracking-[0.2em] text-white/30">
          {eyebrow}
        </span>
      </header>
      {children}
    </motion.article>
  );
}

function KindLegend() {
  return (
    <ul className="mb-5 flex flex-wrap gap-x-4 gap-y-2">
      {(Object.keys(KINDS) as Kind[]).map((kind) => (
        <li key={kind} className="flex items-center gap-1.5 text-[12px] text-white/55">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: kindColor(kind) }}
          />
          {KINDS[kind].label}
        </li>
      ))}
    </ul>
  );
}

function DayList({ dayIndex }: { dayIndex: number }) {
  const col = COL_DAYS[dayIndex];
  return (
    <ol className="space-y-2">
      {cellEntries(col.cells).map(([start, cell]) => (
        <li
          key={start}
          className="flex items-stretch gap-3 rounded-xl border border-white/[0.06] p-3"
          style={{ backgroundColor: kindColor(cell.kind, 0.06) }}
        >
          <span
            className="w-1 shrink-0 rounded-full"
            style={{ backgroundColor: kindColor(cell.kind) }}
          />
          <div className="w-[74px] shrink-0 pt-0.5 text-[13px] tabular-nums leading-5 text-white/60">
            {hourLabel(start)}
            <span className="block text-[11px] text-white/30">
              ~ {endLabel(start, cell.span)}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-medium leading-6 text-white/90">{cell.title}</p>
            {cell.sub ? (
              <p className="mt-0.5 text-[13px] leading-5 text-white/50">{cell.sub}</p>
            ) : null}
          </div>
          <span
            className="self-start rounded-full px-2 py-0.5 text-[11px]"
            style={{ color: kindColor(cell.kind), backgroundColor: kindColor(cell.kind, 0.12) }}
          >
            {KINDS[cell.kind].label.split(" ")[0]}
          </span>
        </li>
      ))}
    </ol>
  );
}

function TimeGrid({ compact = false }: { compact?: boolean }) {
  return (
    <table
      className={`w-full table-fixed border-separate text-center ${
        compact ? "border-spacing-[3px] text-[10.5px]" : "border-spacing-1 text-[13px]"
      }`}
    >
      <thead>
        <tr>
          <th className={compact ? "w-9" : "w-16"} />
          {COL_DAYS.map((col) => (
            <th
              key={col.label}
              className={`${titleFont.className} rounded-lg bg-white/[0.06] font-normal text-white/80 ${
                compact ? "py-1.5 text-[11px]" : "py-2.5 tracking-[0.06em]"
              }`}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {HOURS.map((hour) => (
          <tr key={hour} className={compact ? "h-7" : "h-10"}>
            <th
              className={`text-right align-top font-normal tabular-nums text-white/35 ${
                compact ? "pr-1 text-[9.5px]" : "pr-2 text-[12px]"
              }`}
            >
              {compact ? String(hour).padStart(2, "0") : hourLabel(hour)}
            </th>
            {COL_DAYS.map((col) => {
              if (isCovered(col.cells, hour)) return null;
              const cell = col.cells.get(hour);
              if (!cell) return <td key={col.label} />;
              return (
                <td
                  key={col.label}
                  rowSpan={cell.span}
                  className={`border-l-2 align-middle ${
                    compact ? "rounded-md px-1 py-1" : "rounded-lg px-2 py-1.5"
                  }`}
                  style={{
                    borderColor: kindColor(cell.kind),
                    backgroundColor: kindColor(cell.kind, 0.1),
                  }}
                >
                  <p className="break-keep leading-snug text-white/90">{cell.title}</p>
                  {cell.sub ? (
                    <p
                      className={`mt-0.5 break-keep leading-snug text-white/50 ${
                        compact ? "text-[9px]" : "text-[11px]"
                      }`}
                    >
                      {cell.sub}
                    </p>
                  ) : null}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function FastingTeaser() {
  const [ready, setReady] = useState(false);
  const [vw, setVw] = useState(390);
  const [vh, setVh] = useState(844);
  const [active, setActive] = useState<string>(SECTIONS[0].id);
  const [dayIndex, setDayIndex] = useState(0);
  const [showAll, setShowAll] = useState(true);
  const { scrollY } = useScroll();
  const crack = useMotionValue(0);
  const crackMask = useTransform(crack, (t) => {
    const p = t * 110;
    return `linear-gradient(to bottom, #000 ${Math.max(0, p - 10)}%, transparent ${p}%)`;
  });

  const smallH = (vw * 9) / 16;
  const shrinkDist = Math.max(vh - smallH, 1);
  const scrollMargin = NAV_H + 16;
  const heroDim = useTransform(scrollY, (y) =>
    Math.min(0.6, Math.max(0, (y - shrinkDist) / smallH) * 0.6),
  );

  const heroH = useTransform(scrollY, (y) => {
    const t = easeInOut(Math.min(1, Math.max(0, y / shrinkDist)));
    return vh + (smallH - vh) * t;
  });
  const titleScale = useTransform(scrollY, (y) => {
    const t = easeInOut(Math.min(1, Math.max(0, y / shrinkDist)));
    return 1 - 0.42 * t;
  });
  const eventOpacity = useTransform(scrollY, (y) =>
    Math.max(0, 1 - y / (shrinkDist * 0.5)),
  );

  useEffect(() => {
    const update = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const prev = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    const toTop = () => window.scrollTo(0, 0);
    toTop();
    const raf = requestAnimationFrame(toTop);
    window.addEventListener("load", toTop);
    window.addEventListener("pageshow", toTop);
    setReady(true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("load", toTop);
      window.removeEventListener("pageshow", toTop);
      window.history.scrollRestoration = prev;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const control = animate(crack, 1, {
      delay: TEAR_DELAY,
      duration: CRACK_S,
      ease: "easeIn",
    });
    return () => control.stop();
  }, [ready, crack]);

  useEffect(() => {
    const update = () => {
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) {
        setActive(SECTIONS[SECTIONS.length - 1].id);
        return;
      }
      let current: string = SECTIONS[0].id;
      for (const { id } of SECTIONS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= scrollMargin + 8) current = id;
      }
      setActive(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [scrollMargin]);

  const goTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="w-full [overflow-anchor:none]" style={{ backgroundColor: "#050d1c" }}>
      <motion.section
        className="fixed inset-x-0 top-0 z-10 w-full overflow-hidden"
        style={{ height: heroH, containerType: "size" }}
      >
        {/* 16:9 무대를 cover 로 깔고, 세로 화면에서는 찢김선이 보이도록 왼쪽 42% 지점을 기준으로 자른다 */}
        <div
          className="absolute"
          style={{
            width: "max(100cqw, 177.78cqh)",
            height: "max(100cqh, 56.25cqw)",
            left: "calc((100cqw - max(100cqw, 177.78cqh)) * 0.42)",
            top: "calc((100cqh - max(100cqh, 56.25cqw)) * 0.5)",
          }}
        >
          <motion.img
            src="/retreat/2026fasting-dawn.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            initial={{ scale: 1.08 }}
            animate={ready ? { scale: 1 } : { scale: 1.08 }}
            transition={{ delay: TEAR_DELAY + CRACK_S, duration: 2.6, ease: EASE_IN_OUT }}
          />

          <motion.div
            className="absolute inset-0"
            style={{
              transformOrigin: "100% 100%",
              filter: "drop-shadow(-14px 6px 22px rgba(0,0,0,0.5))",
            }}
            initial={{ x: "0%", y: "0%", rotate: 0, opacity: 1 }}
            animate={
              ready
                ? {
                    x: ["0%", "0.5%", "72%"],
                    y: ["0%", "-0.4%", "-8%"],
                    rotate: [0, 0.8, 17],
                    opacity: [1, 1, 0],
                  }
                : { x: "0%", y: "0%", rotate: 0, opacity: 1 }
            }
            transition={{
              delay: TEAR_DELAY,
              duration: CRACK_S + PULL_S,
              times: [0, CRACK_S / (CRACK_S + PULL_S), 1],
              ease: ["easeOut", [0.55, 0, 0.8, 0.4]],
              opacity: {
                delay: TEAR_DELAY + CRACK_S + PULL_S * 0.7,
                duration: PULL_S * 0.3,
              },
            }}
          >
            <img
              src="/retreat/2026fasting-storm.jpg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              style={{ clipPath: TORN_CLIP }}
            />
          </motion.div>

          <div
            className="absolute inset-0"
            style={{ filter: "drop-shadow(5px 2px 8px rgba(0,0,0,0.3))" }}
          >
            <motion.div
              className="absolute inset-0 bg-[#f4f1ea]"
              style={{
                clipPath: FIBER_CLIP,
                WebkitMaskImage: crackMask,
                maskImage: crackMask,
              }}
            />
            <img
              src="/retreat/2026fasting-storm.jpg"
              alt="폭풍 구름 아래 절벽이 종이처럼 찢겨 나가고, 그 뒤로 해가 뜨는 산골짜기와 굽이치는 강이 드러나는 장면"
              className="absolute inset-0 h-full w-full object-cover"
              style={{ clipPath: KEEP_CLIP }}
            />
          </div>

          {/* 원본 1672×941 캔버스에서 잘라낸 인물 영역의 위치(%) — 찢긴 조각이 사라진 뒤 컬러로 바뀐다 */}
          <motion.img
            src="/retreat/2026fasting-hiker.png"
            alt=""
            className="absolute"
            style={{ left: "39.713%", top: "49.734%", width: "7.895%", height: "35.069%" }}
            initial={{ opacity: 0, x: "-22%", y: "8%", filter: "grayscale(1)" }}
            animate={
              ready
                ? { opacity: 1, x: "0%", y: "0%", filter: "grayscale(0)" }
                : { opacity: 0, x: "-22%", y: "8%", filter: "grayscale(1)" }
            }
            transition={{
              delay: HIKER_DELAY,
              duration: HIKER_S,
              ease: EASE_IN_OUT,
              filter: { delay: TEAR_DELAY + CRACK_S + PULL_S, duration: 0.9, ease: EASE_IN_OUT },
            }}
          />
        </div>

        <motion.div
          className="absolute inset-x-0 top-[8%] z-30 origin-top px-5 text-center sm:left-auto sm:right-[5%] sm:origin-top-right sm:px-0 sm:text-right"
          style={{ scale: titleScale }}
          initial={{ opacity: 0, y: 14 }}
          animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
          transition={{ duration: 1.2, ease: EASE_IN_OUT, delay: TEAR_DELAY + CRACK_S + 1 }}
        >
          <h1
            className={`${posterFont.className} text-[3.6rem] uppercase leading-[0.9] sm:text-[clamp(4rem,9vw,10.5rem)]`}
            style={{ color: POSTER_INK }}
          >
            No way?
            <br />
            God’s way!
          </h1>
          <p
            className={`${posterSubFont.className} mt-3 text-[1.2rem] leading-snug sm:text-[clamp(1.25rem,2.7vw,3.2rem)]`}
            style={{ color: POSTER_SUB }}
          >
            길이 없는 곳에
            <br />
            길을 만드시는 하나님
          </p>
          <p
            className={`${posterSubFont.className} mt-1 text-[12px] sm:text-[clamp(0.8rem,1.1vw,1.3rem)]`}
            style={{ color: POSTER_SUB }}
          >
            사 43:18–21
          </p>
        </motion.div>

        <motion.div
          className="absolute inset-x-0 bottom-[7%] z-30 px-5 text-center text-white [text-shadow:0_2px_14px_rgba(0,0,0,0.55)]"
          style={{ opacity: eventOpacity }}
        >
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            transition={{ duration: 1.2, ease: EASE_IN_OUT, delay: TEAR_DELAY + CRACK_S + 1.4 }}
          >
            <p className={`${posterSubFont.className} text-[1.6rem] sm:text-[clamp(1.8rem,3.6vw,4rem)]`}>
              2026 부산CCC 금식수련회
            </p>
            <p className="mt-1 text-[14px] font-medium sm:text-[clamp(0.95rem,1.7vw,1.9rem)]">
              12월 28–30일 / 감림산기도원
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-40 bg-[#050d1c]"
          style={{ opacity: heroDim }}
        />
      </motion.section>

      <div aria-hidden style={{ height: shrinkDist }} />

      <section
        className="relative z-20 rounded-t-3xl bg-[#050d1c] pb-24 shadow-[0_-24px_48px_rgba(0,0,0,0.55)]"
        style={{ marginTop: smallH }}
      >
        <nav
          className="sticky top-0 z-30 rounded-t-3xl border-b border-white/10 bg-[#050d1c]/90 backdrop-blur"
          style={{ height: NAV_H }}
          aria-label="섹션 바로가기"
        >
          <ul className="mx-auto flex h-full max-w-3xl items-center gap-1 overflow-x-auto px-4 sm:justify-center sm:px-8">
            {SECTIONS.map(({ id, label }) => {
              const on = active === id;
              return (
                <li key={id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => goTo(id)}
                    className={`rounded-full px-4 py-1.5 text-[14px] transition-colors duration-300 ${
                      on ? "bg-[#f3efe6] text-[#050d1c]" : "text-white/55 hover:text-white/85"
                    }`}
                  >
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mx-auto w-full max-w-3xl px-4 pt-10 sm:px-8">
          <motion.div className="mb-10 text-center" {...fadeUp}>
            <p className="text-[12px] tracking-[0.3em] text-white/40">
              2026 부산지구 CCC
            </p>
            <p className={`${titleFont.className} mt-2 text-[26px] text-[#f3efe6] sm:text-3xl`}>
              금식수련회
            </p>
          </motion.div>

          <motion.dl
            className="mb-10 grid grid-cols-2 gap-2.5 sm:grid-cols-4"
            {...fadeUp}
          >
            {[
              { k: "일시", v: "12.28 – 12.30", s: "월 – 수 · 2박 3일" },
              { k: "장소", v: "감림산기도원", s: "경남 양산시" },
              { k: "회비", v: "6만원", s: "가등록 기준" },
              { k: "신청", v: "CCC 커뮤니티 앱", s: "앱에서만 신청" },
            ].map((item) => (
              <div
                key={item.k}
                className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3.5"
              >
                <dt className="text-[12px] text-white/45">{item.k}</dt>
                <dd className="mt-1 text-[16px] font-medium text-white/90">{item.v}</dd>
                <dd className="mt-0.5 text-[12px] text-white/40">{item.s}</dd>
              </div>
            ))}
          </motion.dl>

          <div className="space-y-5">
            <SectionCard id="theme" index={1} eyebrow="Theme" title="주제" scrollMargin={scrollMargin}>
              <p
                className={`${titleFont.className} text-center text-2xl leading-relaxed text-[#f3efe6] sm:text-[28px]`}
              >
                No Way? God’s Way!
              </p>
              <p className="mt-2 text-center text-[16px] text-white/70">
                길이 없는 곳에 길을 만드시는 하나님
              </p>
              <p className="mt-2 text-center text-[13px] text-white/45">
                이사야 43장 18–21절
              </p>
              <ol className="mt-7 space-y-3">
                {SCRIPTURE.map((verse) => {
                  const key = KEY_VERSES.has(verse.n);
                  return (
                    <li
                      key={verse.n}
                      className={`flex gap-3 rounded-xl px-3 py-2.5 text-[15px] leading-7 ${
                        key ? "bg-white/[0.05] text-white/90" : "text-white/55"
                      }`}
                    >
                      <span
                        className={`${titleFont.className} w-5 shrink-0 text-[13px] leading-7`}
                        style={{ color: key ? ACCENT : "rgba(255,255,255,0.3)" }}
                      >
                        {verse.n}
                      </span>
                      <span>{verse.t}</span>
                    </li>
                  );
                })}
              </ol>
            </SectionCard>

            <SectionCard id="info" index={2} eyebrow="Info" title="안내" scrollMargin={scrollMargin}>
              <dl className="space-y-5 text-[15px]">
                <div className="flex gap-4">
                  <dt className="w-14 shrink-0 text-[13px] leading-6 text-white/45">일시</dt>
                  <dd className="text-white/90">
                    2026년 12월 28일(월) – 30일(수)
                    <span className="mt-0.5 block text-[13px] text-white/45">
                      2박 3일
                    </span>
                  </dd>
                </div>
                <div className="flex gap-4">
                  <dt className="w-14 shrink-0 text-[13px] leading-6 text-white/45">장소</dt>
                  <dd className="min-w-0 flex-1 text-white/90">
                    감림산기도원
                    <span className="mt-0.5 block text-[13px] text-white/45">
                      경상남도 양산시 하북면 감림산길 55
                    </span>
                    <a
                      href={MAP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-1.5 text-[13px] text-white/75 transition-colors hover:border-white/30 hover:text-white"
                    >
                      지도에서 보기
                      <span aria-hidden>→</span>
                    </a>
                  </dd>
                </div>
              </dl>
            </SectionCard>

            <SectionCard id="fee" index={3} eyebrow="Fee" title="회비" scrollMargin={scrollMargin}>
              <ul className="grid gap-2.5 sm:grid-cols-2">
                {FEES.map((fee) => {
                  const highlight = "highlight" in fee && fee.highlight;
                  return (
                    <li
                      key={fee.name}
                      className="rounded-2xl border px-4 py-4"
                      style={{
                        borderColor: highlight ? `${ACCENT}66` : "rgba(255,255,255,0.1)",
                        backgroundColor: highlight ? `${ACCENT}14` : "rgba(255,255,255,0.03)",
                      }}
                    >
                      <div className="flex items-center justify-between sm:flex-col sm:items-start sm:gap-3">
                        <div>
                          <p className="text-[15px] font-medium text-white/90">{fee.name}</p>
                          <p className="mt-0.5 text-[12px] text-white/45">{fee.note}</p>
                        </div>
                        <p
                          className={`${titleFont.className} text-2xl`}
                          style={{ color: highlight ? ACCENT : "#f3efe6" }}
                        >
                          {fee.price}
                        </p>
                      </div>
                      {"parts" in fee ? (
                        <dl className="mt-4 grid grid-cols-2 gap-2">
                          {fee.parts.map((part) => {
                            const strong = "strong" in part && part.strong;
                            return (
                              <div
                                key={part.label}
                                className="rounded-xl border px-3 py-2.5"
                                style={{
                                  borderColor: strong ? ACCENT : "rgba(255,255,255,0.08)",
                                  backgroundColor: strong ? `${ACCENT}26` : "rgba(255,255,255,0.03)",
                                }}
                              >
                                <dt
                                  className="text-[12px] font-medium"
                                  style={{ color: strong ? ACCENT : "rgba(255,255,255,0.5)" }}
                                >
                                  {part.label}
                                </dt>
                                <dd
                                  className={`${titleFont.className} mt-0.5 ${strong ? "text-[22px]" : "text-[18px]"}`}
                                  style={{ color: strong ? ACCENT : "rgba(255,255,255,0.75)" }}
                                >
                                  {part.price}
                                </dd>
                                <dd className="text-[11px] text-white/40">{part.sub}</dd>
                              </div>
                            );
                          })}
                        </dl>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 flex gap-2 rounded-xl bg-white/[0.04] px-4 py-3 text-[13px] leading-6 text-white/60">
                <span aria-hidden style={{ color: ACCENT }}>
                  !
                </span>
                가등록 없이 당일 현장에서 등록하면 추가 비용이 발생합니다.
              </p>
            </SectionCard>

            <SectionCard id="schedule" index={4} eyebrow="Time Table" title="일정" scrollMargin={scrollMargin}>
              <div className="relative">
                {/* 2026 일정표 확정 전까지 지난 일정표를 흑백·비활성으로만 보여준다 */}
                <fieldset
                  disabled
                  aria-hidden
                  className="pointer-events-none min-w-0 select-none opacity-40 blur-[1.5px] grayscale"
                >
                  <KindLegend />

                  <div className="sm:hidden">
                    <div className="mb-3 flex justify-end">
                      <button
                        type="button"
                        aria-pressed={showAll}
                        onClick={() => setShowAll((v) => !v)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-1.5 text-[13px] text-white/75 transition-colors active:bg-white/10"
                      >
                        <span aria-hidden>{showAll ? "☰" : "▦"}</span>
                        {showAll ? "일자별로 보기" : "한꺼번에 보기"}
                      </button>
                    </div>

                    {showAll ? (
                      <TimeGrid compact />
                    ) : (
                      <>
                        <div
                          role="tablist"
                          aria-label="날짜 선택"
                          className="mb-4 grid grid-cols-3 gap-1 rounded-2xl bg-white/[0.05] p-1"
                        >
                          {COL_DAYS.map((col, i) => {
                            const on = dayIndex === i;
                            return (
                              <button
                                key={col.label}
                                type="button"
                                role="tab"
                                aria-selected={on}
                                onClick={() => setDayIndex(i)}
                                className={`rounded-xl py-2 text-center transition-colors duration-300 ${
                                  on ? "bg-[#f3efe6] text-[#050d1c]" : "text-white/55"
                                }`}
                              >
                                <span className="block text-[11px] opacity-70">{i + 1}일차</span>
                                <span className="text-[14px] font-medium">
                                  {col.date} ({col.day})
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        <DayList dayIndex={dayIndex} />
                      </>
                    )}
                  </div>

                  <div className="hidden sm:block">
                    <TimeGrid />
                  </div>
                </fieldset>
                <div className="absolute inset-0 flex items-start justify-center pt-24">
                  <p className="rounded-full border border-white/20 bg-[#050d1c]/85 px-5 py-2.5 text-[15px] text-white/85 backdrop-blur">
                    일정표는 추후 공개됩니다
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard id="apply" index={5} eyebrow="Apply" title="신청 방법" scrollMargin={scrollMargin}>
              <ol className="relative space-y-6 pl-11">
                <span
                  aria-hidden
                  className="absolute bottom-3 left-[15px] top-3 w-px bg-white/15"
                />
                {APPLY_STEPS.map((step, i) => (
                  <li key={step.title} className="relative">
                    <span
                      className="absolute -left-11 top-0 flex h-8 w-8 items-center justify-center rounded-full border text-[13px] font-medium"
                      style={{
                        borderColor: `${ACCENT}80`,
                        color: ACCENT,
                        backgroundColor: "#0b1426",
                      }}
                    >
                      {i + 1}
                    </span>
                    <p className="text-[16px] font-medium leading-8 text-white/90">{step.title}</p>
                    <p className="mt-0.5 text-[14px] leading-6 text-white/55">{step.desc}</p>
                  </li>
                ))}
              </ol>
              <p className="mt-7 rounded-xl border border-white/10 px-4 py-3 text-center text-[13px] leading-6 text-white/55">
                신청은 <span className="text-white/85">CCC 커뮤니티 앱</span>에서만 진행됩니다.
              </p>
            </SectionCard>
          </div>
        </div>
      </section>
    </main>
  );
}
