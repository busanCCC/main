"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { KeytermsField, formatKeytermsForInput } from "./KeytermsField";
import {
  normalizeKeyterms,
  parseKeytermsInput,
} from "@/lib/interpretation/keyterms";
import { updateInterpretationSessionKeyterms } from "@/lib/interpretation/clientApi";
import type { InterpretationSession } from "@/lib/interpretation/types";
import { toast } from "sonner";

interface KeytermsPanelProps {
  session: InterpretationSession;
  onUpdated: (session: InterpretationSession) => void;
}

export function KeytermsPanel({ session, onUpdated }: KeytermsPanelProps) {
  const [text, setText] = useState(formatKeytermsForInput(session.keyterms));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setText(formatKeytermsForInput(session.keyterms));
  }, [session.id, session.keyterms]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const keyterms = normalizeKeyterms(parseKeytermsInput(text));
      const updated = await updateInterpretationSessionKeyterms(session.id, keyterms);
      onUpdated(updated);
      setText(formatKeytermsForInput(updated.keyterms));
      toast.success(
        session.status === "live"
          ? "키워드가 저장되었습니다. STT 연결이 갱신됩니다."
          : "키워드가 저장되었습니다.",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "키워드 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const savedText = formatKeytermsForInput(session.keyterms);
  const isDirty = text.trim() !== savedText.trim();

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div>
        <h3 className="text-sm font-semibold">STT 인식 키워드</h3>
        <p className="text-xs text-muted-foreground mt-1">
          세션 중에도 수정할 수 있습니다. 저장 시 Deepgram STT가 새 키워드로 다시 연결됩니다.
        </p>
      </div>
      <KeytermsField value={text} onChange={setText} disabled={isSaving} />
      <Button
        type="button"
        size="sm"
        onClick={handleSave}
        disabled={isSaving || !isDirty}
        className="w-full"
      >
        {isSaving ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        키워드 저장
      </Button>
    </div>
  );
}
