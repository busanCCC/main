"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BookOpen,
  Megaphone,
  Music,
  CalendarDays,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import supabase from "@/utils/supabase/client";
import {
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_EXPANDED_WIDTH,
  tableConfig,
} from "@/app/(pages)/admin-dashboard/table-config";

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen,
  Megaphone,
  Music,
  CalendarDays,
};

const navItems = Object.entries(tableConfig).map(([key, meta]) => ({
  key,
  label: meta.label,
  icon: ICON_MAP[meta.icon] ?? BookOpen,
  href: `/admin-dashboard/${key}`,
}));

export function CollapsibleSidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const isActive = (href: string) => pathname.startsWith(href);
  const isDashboardHome = pathname === "/admin-dashboard";

  return (
    <motion.aside
      initial={false}
      animate={{ width: isExpanded ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="h-screen border-r bg-card flex flex-col overflow-hidden shrink-0"
    >
      {/* Header */}
      <div className="p-3 flex items-center justify-between border-b min-h-[56px]">
        {isExpanded && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm font-semibold truncate"
          >
            관리자 대시보드
          </motion.span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsExpanded(!isExpanded)}
          className="shrink-0"
        >
          {isExpanded ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 flex flex-col gap-1 overflow-y-auto">
        {/* Dashboard home */}
        <button
          onClick={() => router.push("/admin-dashboard")}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
            isDashboardHome
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          {isExpanded && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="truncate"
            >
              대시보드
            </motion.span>
          )}
        </button>

        {/* Table navigation */}
        {navItems.map(({ key, label, icon: Icon, href }) => (
          <button
            key={key}
            onClick={() => router.push(href)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              isActive(href)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="truncate"
              >
                {label}
              </motion.span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {isExpanded && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="truncate"
            >
              로그아웃
            </motion.span>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
