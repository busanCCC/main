"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { SOURCE_LANGUAGES, TARGET_LANGUAGES } from "@/lib/interpretation/constants";
import { createInterpretationSession } from "@/lib/interpretation/clientApi";
import { normalizeKeyterms, parseKeytermsInput } from "@/lib/interpretation/keyterms";
import type { CreateSessionInput, SessionVisibility } from "@/lib/interpretation/types";
import { KeytermsField } from "./KeytermsField";
import { KeytermsImport } from "./KeytermsImport";
import { toast } from "sonner";

export function SessionForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<
    CreateSessionInput & { description?: string; password?: string; keytermsText?: string }
  >({
    title: "",
    speaker: "",
    description: "",
    keytermsText: "",
    visibility: "public",
    sourceLanguage: "ko",
    targetLanguages: ["en"],
    password: "",
  });

  const toggleTargetLang = (lang: string) => {
    setForm((prev) => {
      const exists = prev.targetLanguages.includes(lang);
      const next = exists
        ? prev.targetLanguages.filter((l) => l !== lang)
        : [...prev.targetLanguages, lang];
      return { ...prev, targetLanguages: next.length ? next : prev.targetLanguages };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("세션 제목을 입력하세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { keytermsText, password, ...rest } = form;
      const created = await createInterpretationSession({
        ...rest,
        speaker: rest.speaker?.trim() || undefined,
        description: rest.description?.trim() || undefined,
        keyterms: normalizeKeyterms(parseKeytermsInput(keytermsText ?? "")),
        password: rest.visibility === "private" ? password?.trim() || undefined : undefined,
      });
      toast.success("세션이 생성되었습니다.");
      router.push(`/admin-dashboard/interpretation/${created.id}/live`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "세션 생성에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>통번역 세션 생성</CardTitle>
        <CardDescription>행사/예배 실시간 통번역 세션을 새로 만듭니다.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">세션 제목 *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="예: BHST 2026 Day1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="speaker">발표자</Label>
            <Input
              id="speaker"
              value={form.speaker ?? ""}
              onChange={(e) => setForm({ ...form, speaker: e.target.value })}
              placeholder="예: 홍길동"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Input
              id="description"
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="세션 설명 (선택)"
            />
          </div>

          <KeytermsImport
            currentText={form.keytermsText ?? ""}
            disabled={isSubmitting}
            onImport={(keytermsText) => {
              setForm((prev) => ({ ...prev, keytermsText }));
              toast.success("키워드를 불러왔습니다.");
            }}
          />

          <KeytermsField
            value={form.keytermsText ?? ""}
            onChange={(keytermsText) => setForm({ ...form, keytermsText })}
          />

          <div className="space-y-2">
            <Label htmlFor="visibility">공개 설정</Label>
            <select
              id="visibility"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.visibility}
              onChange={(e) => setForm({ ...form, visibility: e.target.value as SessionVisibility })}
            >
              <option value="public">공개</option>
              <option value="private">비공개</option>
            </select>
          </div>

          {form.visibility === "private" && (
            <div className="space-y-2">
              <Label htmlFor="password">접근 비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={form.password ?? ""}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="비우면 자동 생성됩니다"
              />
              <p className="text-xs text-muted-foreground">
                비공개 세션은 Supabase에서 password_hash가 필요합니다.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="sourceLanguage">원본 언어</Label>
            <select
              id="sourceLanguage"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.sourceLanguage}
              onChange={(e) => setForm({ ...form, sourceLanguage: e.target.value })}
            >
              {SOURCE_LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>{lang.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>번역 언어 (1개 이상)</Label>
            <div className="flex flex-wrap gap-2">
              {TARGET_LANGUAGES.map((lang) => {
                const selected = form.targetLanguages.includes(lang.value);
                return (
                  <button
                    key={lang.value}
                    type="button"
                    onClick={() => toggleTargetLang(lang.value)}
                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input hover:bg-accent"
                    }`}
                  >
                    {lang.label}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
        <CardFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            취소
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            세션 생성
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
