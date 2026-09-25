import type { Metadata } from "next";
import FastingTeaser from "@/app/components/retreat/FastingTeaser";

export const metadata: Metadata = {
  title: "금식수련회 | 부산지구 CCC",
  description: "2025 부산지구 CCC 금식수련회 — 더딘 시대, 믿음으로 꿈꾸라",
};

export default function FastingRetreatPage() {
  return <FastingTeaser />;
}
