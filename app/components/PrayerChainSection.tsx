"use client";
import { useCallback, useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/app/components/ui/carousel";
import PrayerChainCard from "@/app/components/PrayerChainCard";
import { Skeleton } from "@/app/components/ui/skeleton";
import type { PrayerTopicBoard, PrayerTopicGroup } from "@/lib/prayer-topics/types";

const API_PATH = "/api/prayer-topics";

/** 비로그인 방문자도 누를 수 있는 CTA 라, 하루 1회 제한은 브라우저에 남긴다 */
const PRAYED_STORAGE_PREFIX = "chapelPrayerGroupPrayed_";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function formatChapelDate(datetime: string | null): { date: string; day: string } {
  if (!datetime) return { date: "일시 미정", day: "-" };

  const parsed = new Date(datetime);
  if (Number.isNaN(parsed.getTime())) return { date: "일시 미정", day: "-" };

  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const dd = String(parsed.getDate()).padStart(2, "0");
  return { date: `${yyyy}.${mm}.${dd}`, day: WEEKDAYS[parsed.getDay()] };
}

function storageKey(chapelId: number, groupKey: string): string {
  return `${PRAYED_STORAGE_PREFIX}${chapelId}_${groupKey}`;
}

/**
 * 카드 하나의 "함께 기도중" 인원.
 *
 * 버튼 한 번에 카드의 기도제목이 모두 +1 되므로, 합계는 제목 수만큼 부풀려진다.
 * 가장 큰 값이 곧 그 카드를 누른 횟수라 최댓값을 쓴다.
 */
function prayingCountOf(group: PrayerTopicGroup): number {
  return group.topics.reduce((max, topic) => Math.max(max, topic.intercessionCount), 0);
}

function prayedTodayKeys(board: PrayerTopicBoard): string[] {
  if (typeof window === "undefined" || !board.chapel) return [];

  const today = new Date().toDateString();
  return board.groups
    .filter((group) => {
      const prayedAt = localStorage.getItem(
        storageKey((board.chapel as { id: number }).id, group.key)
      );
      return !!prayedAt && new Date(prayedAt).toDateString() === today;
    })
    .map((group) => group.key);
}

export default function PrayerChainSection() {
  const [board, setBoard] = useState<PrayerTopicBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prayedKeys, setPrayedKeys] = useState<string[]>([]);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchBoard() {
      try {
        const response = await fetch(API_PATH, { cache: "no-store" });
        const payload = await response.json();
        if (cancelled) return;

        if (!response.ok || !payload.ok) {
          setError(payload.reason ?? "기도제목을 불러오지 못했습니다.");
          return;
        }

        setBoard(payload.data as PrayerTopicBoard);
        setPrayedKeys(prayedTodayKeys(payload.data as PrayerTopicBoard));
      } catch {
        if (!cancelled) setError("기도제목을 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchBoard();
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePray = useCallback(
    async (group: PrayerTopicGroup) => {
      const chapelId = board?.chapel?.id;
      if (chapelId === undefined) return;
      if (pendingKey !== null || prayedKeys.includes(group.key)) return;

      setPendingKey(group.key);
      try {
        const response = await fetch(API_PATH, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topicIds: group.topics.map((topic) => topic.id) }),
        });
        const payload = await response.json();

        if (!response.ok || !payload.ok) {
          setMessage(payload.reason ?? "기도를 기록하지 못했습니다.");
          return;
        }

        const counts = payload.data.counts as Record<string, number>;
        setBoard((prev) =>
          prev === null
            ? prev
            : {
                ...prev,
                groups: prev.groups.map((item) => ({
                  ...item,
                  topics: item.topics.map((topic) =>
                    counts[topic.id] === undefined
                      ? topic
                      : { ...topic, intercessionCount: counts[topic.id] }
                  ),
                })),
              }
        );
        setPrayedKeys((prev) => [...prev, group.key]);
        setMessage("기도로 동역해주셔서 감사합니다");
        localStorage.setItem(storageKey(chapelId, group.key), new Date().toISOString());
      } catch {
        setMessage("기도를 기록하지 못했습니다.");
      } finally {
        setPendingKey(null);
      }
    },
    [board, pendingKey, prayedKeys]
  );

  const resetCards = () => setResetKey((key) => key + 1);

  const { date, day } = formatChapelDate(board?.chapel?.datetime ?? null);
  const groups = board?.groups ?? [];

  return (
    <section className="w-full h-full bg-white/80 rounded-2xl shadow-md p-6 flex flex-col gap-2 mt-10">
      <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-500 to-blue-400 bg-clip-text text-transparent">
        부산지구 기도제목
      </h1>
      <p className="text-xs font-light text-gray-600 pb-2">
        {board?.chapel?.topic
          ? `${board.chapel.topic} · 기도제목을 확인하고 함께 기도해요`
          : "각 캠퍼스의 기도제목을 확인하고 함께 기도해요"}
      </p>

      {loading ? (
        <div className="w-full flex gap-4 overflow-hidden">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="min-w-[280px] h-[400px] rounded-3xl" />
          ))}
        </div>
      ) : error ? (
        <p className="py-10 text-center text-sm text-gray-500">{error}</p>
      ) : groups.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-500">
          아직 등록된 기도제목이 없습니다.
        </p>
      ) : (
        <div className="relative w-full flex items-center justify-center">
          <Carousel
            className="pl-1 flex-col justify-center w-full items-center"
            opts={{ align: "center" }}
          >
            <CarouselPrevious onClick={resetCards} />
            <CarouselContent className="flex-row items-center overflow-visible">
              {groups.map((group) => (
                <CarouselItem
                  key={group.key}
                  className="max-w-fit transition group flex justify-center items-center mx-auto"
                >
                  <div className="mx-2">
                    <PrayerChainCard
                      date={date}
                      day={day}
                      campus={group.label}
                      topics={group.topics}
                      prayingCount={prayingCountOf(group)}
                      onPray={() => handlePray(group)}
                      disabled={
                        prayedKeys.includes(group.key) || pendingKey === group.key
                      }
                      resetKey={resetKey}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselNext onClick={resetCards} />
          </Carousel>
        </div>
      )}

      {message && (
        <div className="text-center text-blue-500 text-sm mt-2">{message}</div>
      )}
    </section>
  );
}
