import type { Metadata } from "next";
import TstTeaser from "@/app/components/retreat/TstTeaser";

export const metadata: Metadata = {
  title: "TST | 부산지구 CCC",
  description: "2027년, TST 수련회가 공개됩니다.",
};

export default function TstRetreatPage() {
  return <TstTeaser />;
}
