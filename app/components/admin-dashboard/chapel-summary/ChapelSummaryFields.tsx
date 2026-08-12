"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";

const TEXTAREA_CLASS =
  "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

interface TextareaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  hint?: string;
  monospace?: boolean;
}

export function TextareaField({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
  hint,
  monospace = false,
}: TextareaFieldProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={`${TEXTAREA_CLASS} ${monospace ? "font-mono text-xs" : ""}`}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

interface StringListFieldProps {
  label: string;
  hint?: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  addLabel: string;
  multiline?: boolean;
}

/** 핵심 포인트·적용 질문처럼 "문장 여러 줄"을 다루는 입력 */
export function StringListField({
  label,
  hint,
  values,
  onChange,
  placeholder,
  addLabel,
  multiline = false,
}: StringListFieldProps) {
  const updateAt = (index: number, next: string) => {
    onChange(values.map((value, i) => (i === index ? next : value)));
  };

  const removeAt = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange([...values, ""])}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          {addLabel}
        </Button>
      </div>

      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

      {values.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">항목이 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {values.map((value, index) => (
            // 순서가 곧 정체성인 목록이라 index 를 key 로 쓴다
            <div key={index} className="flex gap-2 items-start">
              <span className="mt-2.5 text-xs text-muted-foreground w-4 shrink-0">
                {index + 1}
              </span>
              {multiline ? (
                <textarea
                  value={value}
                  onChange={(event) => updateAt(index, event.target.value)}
                  rows={2}
                  placeholder={placeholder}
                  className={TEXTAREA_CLASS}
                />
              ) : (
                <Input
                  value={value}
                  onChange={(event) => updateAt(index, event.target.value)}
                  placeholder={placeholder}
                />
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => removeAt(index)}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export interface ActionPointValue {
  title: string;
  detail: string;
}

interface ActionPointListFieldProps {
  values: ActionPointValue[];
  onChange: (values: ActionPointValue[]) => void;
}

export function ActionPointListField({
  values,
  onChange,
}: ActionPointListFieldProps) {
  const updateAt = (index: number, patch: Partial<ActionPointValue>) => {
    onChange(
      values.map((value, i) => (i === index ? { ...value, ...patch } : value))
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>액션 포인트</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange([...values, { title: "", detail: "" }])}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          추가
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        이번 한 주 안에 실제로 해볼 수 있을 만큼 구체적으로 적어주세요.
      </p>

      {values.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">항목이 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {values.map((value, index) => (
            <div
              key={index}
              className="rounded-lg border border-input p-3 space-y-2"
            >
              <div className="flex gap-2 items-center">
                <Input
                  value={value.title}
                  onChange={(event) =>
                    updateAt(index, { title: event.target.value })
                  }
                  placeholder="실천할 일 (예: 매일 아침 10분 기도)"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => onChange(values.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
              <textarea
                value={value.detail}
                onChange={(event) =>
                  updateAt(index, { detail: event.target.value })
                }
                rows={2}
                placeholder="언제 어떻게 할지 구체적으로"
                className={TEXTAREA_CLASS}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export interface ChapterValue {
  start_seconds: number;
  title: string;
  summary: string;
}

interface ChapterListFieldProps {
  values: ChapterValue[];
  onChange: (values: ChapterValue[]) => void;
  formatTimestamp: (seconds: number) => string;
}

export function ChapterListField({
  values,
  onChange,
  formatTimestamp,
}: ChapterListFieldProps) {
  const updateAt = (index: number, patch: Partial<ChapterValue>) => {
    onChange(
      values.map((value, i) => (i === index ? { ...value, ...patch } : value))
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>목차</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            onChange([...values, { start_seconds: 0, title: "", summary: "" }])
          }
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          추가
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        시작 시각(초)을 누르면 앱에서 영상이 그 지점으로 이동합니다.
      </p>

      {values.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">항목이 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {values.map((value, index) => (
            <div
              key={index}
              className="rounded-lg border border-input p-3 space-y-2"
            >
              <div className="flex gap-2 items-center">
                <div className="shrink-0 w-28">
                  <Input
                    type="number"
                    min={0}
                    value={value.start_seconds}
                    onChange={(event) =>
                      updateAt(index, {
                        start_seconds: Number(event.target.value) || 0,
                      })
                    }
                  />
                </div>
                <span className="shrink-0 text-xs text-muted-foreground w-14 tabular-nums">
                  {formatTimestamp(value.start_seconds)}
                </span>
                <Input
                  value={value.title}
                  onChange={(event) =>
                    updateAt(index, { title: event.target.value })
                  }
                  placeholder="이 대목의 제목"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => onChange(values.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
              <textarea
                value={value.summary}
                onChange={(event) =>
                  updateAt(index, { summary: event.target.value })
                }
                rows={2}
                placeholder="이 대목에서 다룬 내용"
                className={TEXTAREA_CLASS}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
