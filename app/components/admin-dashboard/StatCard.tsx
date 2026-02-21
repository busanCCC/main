"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BookOpen,
  Megaphone,
  Music,
  CalendarDays,
  Church,
  Trophy,
} from "lucide-react";
import { Skeleton } from "@/app/components/ui/skeleton";

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen,
  Megaphone,
  Music,
  CalendarDays,
  Church,
  Trophy,
};

interface StatCardProps {
  tableName: string;
  label: string;
  description: string;
  icon: string;
  /** 부모에서 배치 조회한 카운트 (미제공 시 로딩 표시) */
  count?: number;
}

export function StatCard({ tableName, label, description, icon, count }: StatCardProps) {
  const router = useRouter();
  const Icon = ICON_MAP[icon] ?? BookOpen;
  const isLoading = count === undefined;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => router.push(`/admin-dashboard/${tableName}`)}
      className="cursor-pointer rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="rounded-lg bg-primary/10 p-2.5">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        {isLoading ? (
          <Skeleton className="h-8 w-12" />
        ) : (
          <span className="text-3xl font-bold">{count ?? 0}</span>
        )}
      </div>
      <h3 className="font-semibold text-sm">{label}</h3>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </motion.div>
  );
}
