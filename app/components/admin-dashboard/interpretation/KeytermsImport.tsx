"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { fetchInterpretationSessions } from "@/lib/interpretation/clientApi";
import {
  formatKeytermsForInput,
  mergeKeytermsInput,
} from "@/lib/interpretation/keyterms";
import type { InterpretationSession } from "@/lib/interpretation/types";

interface KeytermsImportProps {
  currentText: string;
  onImport: (text: string) => void;
  disabled?: boolean;
}

export function KeytermsImport({ currentText, onImport, disabled }: KeytermsImportProps) {
  const [sessions, setSessions] = useState<InterpretationSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    let active = true;
    fetchInterpretationSessions()
      .then((data) => {
        if (active) setSessions(data);
      })
      .catch(() => {
        if (active) setSessions([]);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const sessionsWithKeyterms = useMemo(
    () =>
      sessions
        .filter((session) => (session.keyterms?.length ?? 0) > 0)
        .sort((a, b) => {
          const aTime = new Date(a.createdAt ?? a.startedAt ?? 0).getTime();
          const bTime = new Date(b.createdAt ?? b.startedAt ?? 0).getTime();
          return bTime - aTime;
        }),
    [sessions],
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        기존 키워드 목록 불러오는 중…
      </div>
    );
  }

  if (sessionsWithKeyterms.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        저장된 키워드가 있는 이전 세션이 없습니다.
      </p>
    );
  }

  const importFrom = (session: InterpretationSession, replace: boolean) => {
    if (!session.keyterms?.length) return;
    const imported = formatKeytermsForInput(session.keyterms);
    onImport(replace ? imported : mergeKeytermsInput(currentText, session.keyterms));
  };

  const handleImport = () => {
    const session = sessionsWithKeyterms.find((item) => item.id === selectedId);
    if (!session) return;
    const replace = !currentText.trim();
    importFrom(session, replace);
  };

  const handleImportLatest = () => {
    importFrom(sessionsWithKeyterms[0], !currentText.trim());
    setSelectedId(sessionsWithKeyterms[0].id);
  };

  return (
    <div className="rounded-md border border-dashed bg-muted/30 p-3 space-y-2">
      <p className="text-xs font-medium text-muted-foreground">기존 세션에서 키워드 불러오기</p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="flex h-9 min-w-[200px] flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          disabled={disabled}
        >
          <option value="">세션 선택…</option>
          {sessionsWithKeyterms.map((session) => (
            <option key={session.id} value={session.id}>
              {session.title} ({session.keyterms!.length}개)
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleImport}
          disabled={disabled || !selectedId}
        >
          {currentText.trim() ? "합치기" : "불러오기"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleImportLatest}
          disabled={disabled}
        >
          최근 세션
        </Button>
      </div>
      {currentText.trim() && (
        <p className="text-xs text-muted-foreground">
          입력란에 내용이 있으면 선택한 세션 키워드를 합칩니다. 덮어쓰려면 입력란을 비운 뒤
          불러오기를 누르세요.
        </p>
      )}
    </div>
  );
}
