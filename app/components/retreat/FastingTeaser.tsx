"use client";

import {
  animate,
  motion,
  useMotionValue,
  useScroll,
  useTransform,
} from "framer-motion";
import { Noto_Serif_KR } from "next/font/google";
import { useEffect, useState, type ReactNode } from "react";

const titleFont = Noto_Serif_KR({
  weight: "300",
  subsets: ["latin"],
  display: "swap",
});

const EASE_IN_OUT: [number, number, number, number] = [0.42, 0, 0.58, 1];
const LAND_MS = 1600;
const LAND_DELAY = 0.08;
const NAV_H = 52;
const ACCENT = "#e8c983";

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
  {
    n: 1,
    t: "내가 내 파수하는 곳에 서며 성루에 서리라 그가 내게 무엇이라 말씀하실는지 기다리고 바라보며 나의 질문에 대하여 어떻게 대답하실는지 보리라 하였더니",
  },
  {
    n: 2,
    t: "여호와께서 내게 대답하여 이르시되 너는 이 묵시를 기록하여 판에 명백히 새기되 달려가면서도 읽을 수 있게 하라",
  },
  {
    n: 3,
    t: "이 묵시는 정한 때가 있나니 그 종말이 속히 이르겠고 결코 거짓되지 아니하리라 비록 더딜지라도 기다리라 지체되지 않고 반드시 응하리라",
  },
  {
    n: 4,
    t: "보라 그의 마음은 교만하며 그 속에서 정직하지 못하나 의인은 그의 믿음으로 말미암아 살리라",
  },
] as const;

const KEY_VERSES = new Set<number>([3, 4]);

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
  { name: "가등록", price: "2만원", note: "먼저 자리를 확보합니다" },
  { name: "완등록", price: "6만원", note: "가등록 2만원 포함 · 잔액 4만원", highlight: true },
  { name: "현장등록", price: "7만원", note: "당일 현장에서 등록 시" },
] as const;

const APPLY_STEPS = [
  { title: "CCC 커뮤니티 앱 실행", desc: "앱을 열고 홈 화면으로 이동합니다." },
  { title: "금식수련회 선택", desc: "홈의 수련회 카드에서 금식수련회를 누릅니다." },
  { title: "신청하기", desc: "하단의 신청하기에서 가등록 또는 완등록을 진행합니다." },
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
  const skyWipe = useMotionValue(0);
  const skyMask = useTransform(skyWipe, (t) => {
    const p = t * 128;
    return `linear-gradient(to bottom, #000 ${Math.max(0, p - 26)}%, transparent ${p}%)`;
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
    const control = animate(skyWipe, 1, {
      delay: LAND_DELAY + LAND_MS / 1000 + 0.55,
      duration: 2.1,
      ease: EASE_IN_OUT,
    });
    return () => control.stop();
  }, [ready, skyWipe]);

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
        style={{ height: heroH }}
      >
        <motion.div
          className="absolute inset-0 z-0"
          style={{
            WebkitMaskImage: skyMask,
            maskImage: skyMask,
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
          }}
        >
          <img
            src="/retreat/2025fasting-sky.jpg"
            alt=""
            className="h-full w-full object-cover object-center"
          />
        </motion.div>

        <motion.div
          className="absolute inset-0 z-10"
          style={{ mixBlendMode: "screen" }}
          initial={{ opacity: 0 }}
          animate={ready ? { opacity: 1 } : { opacity: 0 }}
          transition={{
            duration: 1.5,
            ease: EASE_IN_OUT,
            delay: LAND_DELAY + LAND_MS / 1000,
          }}
        >
          <img
            src="/retreat/2025fasting-cloud.png"
            alt=""
            className="h-full w-full translate-y-[3%] object-cover object-center"
          />
        </motion.div>

        <motion.div
          className="absolute inset-0 z-20"
          initial={{ y: "42%", opacity: 0 }}
          animate={ready ? { y: "0%", opacity: 1 } : { y: "42%", opacity: 0 }}
          transition={{
            duration: LAND_MS / 1000,
            ease: EASE_IN_OUT,
            delay: LAND_DELAY,
          }}
        >
          <img
            src="/retreat/2025fasting-land.png?v=3"
            alt=""
            className="h-full w-full object-cover object-center"
          />
        </motion.div>

        <motion.h1
          className={`${titleFont.className} absolute inset-x-0 top-[11%] z-30 origin-top px-5 text-center text-[2.15rem] leading-[1.45] tracking-[0.08em] sm:text-5xl md:text-6xl`}
          style={{ color: "#f3efe6", scale: titleScale }}
          initial={{ opacity: 0, y: 10 }}
          animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{
            duration: 1.6,
            ease: EASE_IN_OUT,
            delay: LAND_DELAY + LAND_MS / 1000 + 0.2,
          }}
        >
          더딘 시대,
          <br />
          믿음으로 꿈꾸라
        </motion.h1>

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
              2025 부산지구 CCC
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
              { k: "일시", v: "12.29 – 12.31", s: "월 – 수 · 2박 3일" },
              { k: "장소", v: "감림산기도원", s: "경남 양산시" },
              { k: "회비", v: "6만원", s: "완등록 기준" },
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
                더딘 시대, 믿음으로 꿈꾸라
              </p>
              <p className="mt-2 text-center text-[13px] text-white/45">
                하박국 2장 1–4절
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
                        className={`${titleFont.className} w-4 shrink-0 text-[13px] leading-7`}
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
                    2025년 12월 29일(월) – 31일(수)
                    <span className="mt-0.5 block text-[13px] text-white/45">
                      2박 3일 · 첫날 오전 10시 등록
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
              <ul className="grid gap-2.5 sm:grid-cols-3">
                {FEES.map((fee) => {
                  const highlight = "highlight" in fee && fee.highlight;
                  return (
                    <li
                      key={fee.name}
                      className="flex items-center justify-between rounded-2xl border px-4 py-4 sm:flex-col sm:items-start sm:gap-3"
                      style={{
                        borderColor: highlight ? `${ACCENT}66` : "rgba(255,255,255,0.1)",
                        backgroundColor: highlight ? `${ACCENT}14` : "rgba(255,255,255,0.03)",
                      }}
                    >
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
