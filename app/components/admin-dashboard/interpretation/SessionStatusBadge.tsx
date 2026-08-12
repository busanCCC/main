import type { SessionStatus } from "@/lib/interpretation/types";

const STATUS_LABEL: Record<SessionStatus, string> = {
  waiting: "예정",
  live: "진행 중",
  closed: "종료",
};

const STATUS_CLASS: Record<SessionStatus, string> = {
  waiting: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  live: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  closed: "bg-muted text-muted-foreground",
};

interface SessionStatusBadgeProps {
  status: SessionStatus;
}

export function SessionStatusBadge({ status }: SessionStatusBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
