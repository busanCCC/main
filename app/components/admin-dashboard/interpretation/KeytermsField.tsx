"use client";

import { Label } from "@/app/components/ui/label";
import {
  MAX_KEYTERMS,
  formatKeytermsForInput,
  parseKeytermsInput,
} from "@/lib/interpretation/keyterms";

interface KeytermsFieldProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function KeytermsField({
  id = "keyterms",
  value,
  onChange,
  disabled,
}: KeytermsFieldProps) {
  const count = parseKeytermsInput(value).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>STT 인식 키워드 (Keyterm)</Label>
        <span className="text-xs text-muted-foreground">
          {count}/{MAX_KEYTERMS}
        </span>
      </div>
      <textarea
        id={id}
        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={"한 줄에 하나, 또는 쉼표로 구분\n예: 부산CCC\n예: 수련회"}
      />
      <p className="text-xs text-muted-foreground">
        Deepgram Nova-3 keyterm prompting — 고유명사·전문용어·행사명 등을 넣으면
        STT가 더 잘 인식합니다. 최대 {MAX_KEYTERMS}개.
      </p>
    </div>
  );
}

export { formatKeytermsForInput, parseKeytermsInput };
