"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Languages, Loader2, Plus, Radio, Trash2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { SessionStatusBadge } from "@/app/components/admin-dashboard/interpretation/SessionStatusBadge";
import { DeleteConfirmDialog } from "@/app/components/admin-dashboard/DeleteConfirmDialog";
import {
  deleteInterpretationSession,
  fetchInterpretationSessions,
  startInterpretationSession,
} from "@/lib/interpretation/clientApi";
import type { InterpretationSession, SessionStatus } from "@/lib/interpretation/types";
import { toast } from "sonner";

export default function InterpretationDashboardPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<InterpretationSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<InterpretationSession | null>(null);

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchInterpretationSessions();
      setSessions(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "세션 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteInterpretationSession(deleteTarget.id);
    toast.success("세션이 삭제되었습니다.");
    setDeleteTarget(null);
    await loadSessions();
  };

  const handleQuickStart = async (session: InterpretationSession) => {
    try {
      await startInterpretationSession(session.id);
      router.push(`/admin-dashboard/interpretation/${session.id}/live`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "세션 시작에 실패했습니다.");
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Languages className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">실시간 통번역</h1>
          </div>
          <p className="text-muted-foreground">세션 생성, 시작/종료, Live Console 운영</p>
        </div>
        <Button asChild>
          <Link href="/admin-dashboard/interpretation/new">
            <Plus className="mr-2 h-4 w-4" />
            세션 생성
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <Radio className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">아직 생성된 통번역 세션이 없습니다.</p>
          <Button asChild>
            <Link href="/admin-dashboard/interpretation/new">첫 세션 만들기</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">제목</th>
                <th className="px-4 py-3 font-medium">발표자</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium">번역 언어</th>
                <th className="px-4 py-3 font-medium text-right">작업</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{session.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{session.speaker ?? "-"}</td>
                  <td className="px-4 py-3">
                    <SessionStatusBadge status={session.status as SessionStatus} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {session.targetLanguages?.join(", ").toUpperCase()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {session.status === "waiting" && (
                        <Button size="sm" variant="outline" onClick={() => handleQuickStart(session)}>
                          시작
                        </Button>
                      )}
                      <Button size="sm" asChild>
                        <Link href={`/admin-dashboard/interpretation/${session.id}/live`}>
                          Live Console
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(session)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="세션 삭제"
        description={`"${deleteTarget?.title}" 세션을 삭제하시겠습니까?`}
      />
    </div>
  );
}
