import type { Metadata } from "next";
import FastingTeaser from "@/app/components/retreat/FastingTeaser";

export const metadata: Metadata = {
  title: "금식수련회 | 부산지구 CCC",
  description: "2026 부산지구 CCC 금식수련회 — No Way? God’s Way! 길이 없는 곳에 길을 만드시는 하나님",
};

export default function FastingRetreatPage() {
  return <FastingTeaser />;
}
