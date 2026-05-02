"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Tent,
  Trophy,
  HeartHandshake,
  Megaphone,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/app/components/ui/card";
import { DeleteConfirmDialog } from "@/app/components/admin-dashboard/DeleteConfirmDialog";
import {
  fetchTableData,
  createRecord,
  updateRecord,
  deleteRecord,
} from "@/app/(pages)/admin-dashboard/actions";
import { toast } from "sonner";

// ─── 상수 ────────────────────────────────────────────────────────────────────

const TABLE = "summer_conference_prayer_topics";

// ─── 탭 정의 ──────────────────────────────────────────────────────────────────

type TabKey = "contest" | "prayer" | "notice";

const TABS: { key: TabKey; label: string; icon: React.ElementType; description: string }[] = [
  { key: "contest", label: "공모전", icon: Trophy, description: "여름수련회 공모전 항목을 관리합니다." },
  { key: "prayer", label: "기도제목", icon: HeartHandshake, description: "날짜별 기도제목을 입력하고 앱에 표시될 내용을 관리합니다." },
  { key: "notice", label: "공지사항", icon: Megaphone, description: "여름수련회 관련 공지사항을 관리합니다." },
];

// ─── 기도제목 타입 (DDL 반영) ─────────────────────────────────────────────────

interface PrayerTopic {
  id: number;
  prayer_date: string;
  title: string;
  description: string | null;
  verse: string | null;
  verse_ref: string | null;
  items: string[];
  created_at: string;
}

// ─── 폼 초기값 ────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  prayer_date: "",
  title: "",
  description: "",
  verse: "",
  verse_ref: "",
};

// ─── 기도제목 카드 ────────────────────────────────────────────────────────────

function PrayerCard({
  topic,
  onEdit,
  onDelete,
}: {
  topic: PrayerTopic;
  onEdit: (topic: PrayerTopic) => void;
  onDelete: (topic: PrayerTopic) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const dateLabel = new Date(topic.prayer_date + "T00:00:00").toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary shrink-0">
            <CalendarDays className="h-3 w-3" />
            {dateLabel}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(topic)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onDelete(topic)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <CardTitle className="text-base mt-1">{topic.title}</CardTitle>
        {topic.description && (
          <CardDescription className="text-xs leading-relaxed">{topic.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="pt-0 flex flex-col gap-3">
        {(topic.verse || topic.verse_ref) && (
          <div className="rounded-md bg-muted/60 px-3 py-2.5 border-l-2 border-primary/40">
            {topic.verse && (
              <p className="text-xs text-foreground/80 leading-relaxed italic">
                &ldquo;{topic.verse}&rdquo;
              </p>
            )}
            {topic.verse_ref && (
              <p className="text-xs text-muted-foreground mt-1 font-medium">— {topic.verse_ref}</p>
            )}
          </div>
        )}

        {topic.items.length > 0 && (
          <div>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              <BookOpen className="h-3.5 w-3.5" />
              기도제목 {topic.items.length}개
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {expanded && (
              <ul className="flex flex-col gap-1.5 pl-1">
                {topic.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                    <span className="mt-0.5 h-4 w-4 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                      {i + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── 기도제목 입력 폼 ─────────────────────────────────────────────────────────

function PrayerForm({
  editTarget,
  onSuccess,
  onCancelEdit,
}: {
  editTarget: PrayerTopic | null;
  onSuccess: () => void;
  onCancelEdit: () => void;
}) {
  const isEdit = editTarget !== null;
  const [form, setForm] = useState(EMPTY_FORM);
  const [items, setItems] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);

  // 편집 대상이 바뀌면 폼 채우기
  useEffect(() => {
    if (editTarget) {
      setForm({
        prayer_date: editTarget.prayer_date,
        title: editTarget.title,
        description: editTarget.description ?? "",
        verse: editTarget.verse ?? "",
        verse_ref: editTarget.verse_ref ?? "",
      });
      setItems(editTarget.items.length > 0 ? editTarget.items : [""]);
    } else {
      setForm(EMPTY_FORM);
      setItems([""]);
    }
  }, [editTarget]);

  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const addItem = () => setItems((v) => [...v, ""]);
  const removeItem = (i: number) => setItems((v) => v.filter((_, idx) => idx !== i));
  const updateItem = (i: number, val: string) =>
    setItems((v) => v.map((it, idx) => (idx === i ? val : it)));

  const reset = () => {
    setForm(EMPTY_FORM);
    setItems([""]);
    onCancelEdit();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.prayer_date || !form.title) return;

    setSubmitting(true);

    const payload = {
      prayer_date: form.prayer_date,
      title: form.title,
      description: form.description || null,
      verse: form.verse || null,
      verse_ref: form.verse_ref || null,
      items: items.filter((it) => it.trim() !== ""),
    };

    const result = isEdit
      ? await updateRecord(TABLE, editTarget!.id, payload)
      : await createRecord(TABLE, payload);

    setSubmitting(false);

    if (result.ok) {
      toast.success(isEdit ? "기도제목이 수정되었습니다." : "기도제목이 등록되었습니다.");
      reset();
      onSuccess();
    } else {
      // prayer_date unique 제약 위반 메시지 친화적으로 변환
      const reason = result.reason.includes("prayer_date")
        ? "해당 날짜에 이미 기도제목이 등록되어 있습니다."
        : result.reason;
      toast.error(reason);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className={isEdit ? "border-primary/50 ring-1 ring-primary/20" : ""}>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold">
            {isEdit ? `수정 중: ${editTarget!.title}` : "새 기도제목 추가"}
          </CardTitle>
          <CardDescription className="text-xs">
            날짜는 고유값입니다. 하루 1개의 기도제목을 등록할 수 있습니다.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {/* 날짜 + 제목 */}
          <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prayer_date" className="text-xs">
                날짜 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="prayer_date"
                type="date"
                required
                value={form.prayer_date}
                onChange={set("prayer_date")}
                disabled={isEdit} // 날짜는 unique key라 수정 불가
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title" className="text-xs">
                제목 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="예: 하나님 나라를 위하여"
                required
                value={form.title}
                onChange={set("title")}
              />
            </div>
          </div>

          {/* 설명 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description" className="text-xs">설명</Label>
            <textarea
              id="description"
              rows={2}
              placeholder="기도제목에 대한 간단한 설명을 입력하세요"
              value={form.description}
              onChange={set("description")}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>

          {/* 성경 말씀 */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="verse" className="text-xs">성경 구절 본문</Label>
              <textarea
                id="verse"
                rows={2}
                placeholder="예: 그런즉 너희는 먼저 그의 나라와 그의 의를 구하라..."
                value={form.verse}
                onChange={set("verse")}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="verse_ref" className="text-xs">말씀 출처</Label>
              <Input
                id="verse_ref"
                placeholder="예: 마태복음 6:33"
                value={form.verse_ref}
                onChange={set("verse_ref")}
              />
            </div>
          </div>

          {/* 기도제목 items (text[]) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">기도제목 목록</Label>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                항목 추가
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[11px] font-bold text-muted-foreground shrink-0">
                    {i + 1}
                  </span>
                  <Input
                    placeholder={`기도제목 ${i + 1}`}
                    value={item}
                    onChange={(e) => updateItem(i, e.target.value)}
                    className="flex-1"
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-0 justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={reset} disabled={submitting}>
            {isEdit ? "취소" : "초기화"}
          </Button>
          <Button type="submit" size="sm" className="gap-1.5" disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isEdit ? (
              <Pencil className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {isEdit ? "수정 완료" : "등록"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

// ─── 기도제목 탭 ──────────────────────────────────────────────────────────────

function PrayerTab() {
  const [topics, setTopics] = useState<PrayerTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editTarget, setEditTarget] = useState<PrayerTopic | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PrayerTopic | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const result = await fetchTableData(TABLE, {
      orderBy: "prayer_date",
      ascending: true,
      pageSize: 200,
    });
    if (result.ok) {
      setTopics(result.data.rows as unknown as PrayerTopic[]);
    } else {
      toast.error("데이터를 불러오지 못했습니다: " + result.reason);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteRecord(TABLE, deleteTarget.id);
    if (result.ok) {
      toast.success("기도제목이 삭제되었습니다.");
      setTopics((prev) => prev.filter((t) => t.id !== deleteTarget.id));
    } else {
      toast.error("삭제 실패: " + result.reason);
    }
    setDeleteTarget(null);
  };

  const filtered = topics.filter(
    (t) =>
      t.title.includes(search) ||
      t.prayer_date.includes(search) ||
      (t.description ?? "").includes(search) ||
      t.items.some((it) => it.includes(search))
  );

  return (
    <div className="flex flex-col gap-6">
      {/* 입력 / 수정 폼 */}
      <PrayerForm
        editTarget={editTarget}
        onSuccess={load}
        onCancelEdit={() => setEditTarget(null)}
      />

      {/* 목록 헤더 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">
            등록된 기도제목 ({isLoading ? "…" : topics.length})
          </h2>
          <button
            onClick={load}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="새로고침"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-8 h-8 text-sm"
            placeholder="제목, 날짜, 내용 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* 카드 목록 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">불러오는 중...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <MoreHorizontal className="h-8 w-8 opacity-30" />
          <p className="text-sm">{search ? "검색 결과가 없습니다." : "등록된 기도제목이 없습니다."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((topic) => (
            <PrayerCard
              key={topic.id}
              topic={topic}
              onEdit={(t) => {
                setEditTarget(t);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={handleDelete}
        title="기도제목을 삭제하시겠습니까?"
        description={`"${deleteTarget?.title}" (${deleteTarget?.prayer_date}) 항목이 영구적으로 삭제됩니다.`}
      />
    </div>
  );
}

// ─── 공지사항 타입 ────────────────────────────────────────────────────────────

interface Notice {
  id: string;
  title: string;
  content: string;
  published_at: string;
  is_pinned: boolean;
  created_at: string;
}

const NOTICE_TABLE = "conference_notices";

const EMPTY_NOTICE_FORM = {
  title: "",
  content: "",
  published_at: new Date().toISOString().slice(0, 16),
  is_pinned: false,
};

// ─── 공지사항 입력 폼 ─────────────────────────────────────────────────────────

function NoticeForm({
  editTarget,
  onSuccess,
  onCancelEdit,
}: {
  editTarget: Notice | null;
  onSuccess: () => void;
  onCancelEdit: () => void;
}) {
  const isEdit = editTarget !== null;
  const [form, setForm] = useState(EMPTY_NOTICE_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editTarget) {
      setForm({
        title: editTarget.title,
        content: editTarget.content,
        published_at: editTarget.published_at.slice(0, 16),
        is_pinned: editTarget.is_pinned,
      });
    } else {
      setForm(EMPTY_NOTICE_FORM);
    }
  }, [editTarget]);

  const reset = () => {
    setForm(EMPTY_NOTICE_FORM);
    onCancelEdit();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) return;

    setSubmitting(true);

    const payload = {
      title: form.title,
      content: form.content,
      published_at: new Date(form.published_at).toISOString(),
      is_pinned: form.is_pinned,
    };

    const result = isEdit
      ? await updateRecord(NOTICE_TABLE, editTarget!.id, payload)
      : await createRecord(NOTICE_TABLE, payload);

    setSubmitting(false);

    if (result.ok) {
      toast.success(isEdit ? "공지사항이 수정되었습니다." : "공지사항이 등록되었습니다.");
      reset();
      onSuccess();
    } else {
      toast.error(result.reason);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className={isEdit ? "border-primary/50 ring-1 ring-primary/20" : ""}>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold">
            {isEdit ? `수정 중: ${editTarget!.title}` : "새 공지사항 추가"}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {/* 제목 + 고정 여부 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notice_title" className="text-xs">
              제목 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="notice_title"
              placeholder="공지사항 제목을 입력하세요"
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>

          {/* 내용 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notice_content" className="text-xs">
              내용 <span className="text-destructive">*</span>
            </Label>
            <textarea
              id="notice_content"
              rows={5}
              required
              placeholder="공지사항 내용을 입력하세요"
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>

          {/* 발행일 + 상단 고정 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notice_published_at" className="text-xs">발행일시</Label>
              <Input
                id="notice_published_at"
                type="datetime-local"
                value={form.published_at}
                onChange={(e) => setForm((f) => ({ ...f, published_at: e.target.value }))}
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.is_pinned}
                  onChange={(e) => setForm((f) => ({ ...f, is_pinned: e.target.checked }))}
                  className="h-4 w-4 rounded border border-input"
                />
                <span className="text-sm">상단 고정</span>
              </label>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-0 justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={reset} disabled={submitting}>
            {isEdit ? "취소" : "초기화"}
          </Button>
          <Button type="submit" size="sm" className="gap-1.5" disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isEdit ? (
              <Pencil className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {isEdit ? "수정 완료" : "등록"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

// ─── 공지사항 탭 ──────────────────────────────────────────────────────────────

function NoticeTab() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editTarget, setEditTarget] = useState<Notice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Notice | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const result = await fetchTableData(NOTICE_TABLE, {
      orderBy: "published_at",
      ascending: false,
      pageSize: 200,
    });
    if (result.ok) {
      setNotices(result.data.rows as unknown as Notice[]);
    } else {
      toast.error("데이터를 불러오지 못했습니다: " + result.reason);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteRecord(NOTICE_TABLE, deleteTarget.id);
    if (result.ok) {
      toast.success("공지사항이 삭제되었습니다.");
      setNotices((prev) => prev.filter((n) => n.id !== deleteTarget.id));
    } else {
      toast.error("삭제 실패: " + result.reason);
    }
    setDeleteTarget(null);
  };

  const filtered = notices.filter(
    (n) => n.title.includes(search) || n.content.includes(search)
  );

  // 고정 공지 먼저, 그 다음 발행일 내림차순
  const sorted = [...filtered].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
  });

  return (
    <div className="flex flex-col gap-6">
      {/* 입력 / 수정 폼 */}
      <NoticeForm
        editTarget={editTarget}
        onSuccess={load}
        onCancelEdit={() => setEditTarget(null)}
      />

      {/* 목록 헤더 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">
            등록된 공지사항 ({isLoading ? "…" : notices.length})
          </h2>
          <button
            onClick={load}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="새로고침"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-8 h-8 text-sm"
            placeholder="제목, 내용 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* 공지사항 목록 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">불러오는 중...</span>
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <MoreHorizontal className="h-8 w-8 opacity-30" />
          <p className="text-sm">{search ? "검색 결과가 없습니다." : "등록된 공지사항이 없습니다."}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((notice) => {
            const dateLabel = new Date(notice.published_at).toLocaleString("ko-KR", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={notice.id}
                className={`rounded-lg border px-4 py-3 hover:bg-accent/40 transition-colors ${notice.is_pinned ? "border-amber-300 bg-amber-50/50 dark:bg-amber-950/20" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {notice.is_pinned && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 shrink-0">
                          고정
                        </span>
                      )}
                      <span className="text-sm font-medium">{notice.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {notice.content}
                    </p>
                    <span className="text-xs text-muted-foreground/60">{dateLabel}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditTarget(notice);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(notice)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={handleDelete}
        title="공지사항을 삭제하시겠습니까?"
        description={`"${deleteTarget?.title}" 항목이 영구적으로 삭제됩니다.`}
      />
    </div>
  );
}

// ─── 공모전 타입 ──────────────────────────────────────────────────────────────

interface ContestEntry {
  id: string;
  title: string | null;
  campus: string;
  creator_name: string | null;
  image_url: string;
  year: number | null;
  likes_count: number;
  created_at: string;
}

const CONTEST_TABLE = "contest_entries";
const CONTEST_BUCKET = "contest-entries";

const EMPTY_CONTEST_FORM = {
  title: "",
  campus: "",
  creator_name: "",
};

// ─── 이미지 업로드 유틸 ───────────────────────────────────────────────────────

async function uploadContestImage(file: File): Promise<{ ok: true; url: string; path: string } | { ok: false; reason: string }> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("bucket", CONTEST_BUCKET);
  try {
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const result = await res.json();
    if (!result.ok) return { ok: false, reason: result.reason ?? "업로드 실패" };
    return { ok: true, url: result.data.url, path: result.data.path };
  } catch {
    return { ok: false, reason: "이미지 업로드 중 네트워크 오류가 발생했습니다." };
  }
}

async function deleteContestImage(path: string): Promise<void> {
  await fetch(`/api/admin/upload?bucket=${CONTEST_BUCKET}&path=${encodeURIComponent(path)}`, {
    method: "DELETE",
  });
}

// ─── 공모전 입력 폼 ───────────────────────────────────────────────────────────

function ContestForm({
  editTarget,
  onSuccess,
  onCancelEdit,
}: {
  editTarget: ContestEntry | null;
  onSuccess: () => void;
  onCancelEdit: () => void;
}) {
  const isEdit = editTarget !== null;
  const [form, setForm] = useState(EMPTY_CONTEST_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editTarget) {
      setForm({
        title: editTarget.title ?? "",
        campus: editTarget.campus,
        creator_name: editTarget.creator_name ?? "",
      });
      setImagePreview(editTarget.image_url);
      setImageFile(null);
    } else {
      setForm(EMPTY_CONTEST_FORM);
      setImagePreview(null);
      setImageFile(null);
    }
  }, [editTarget]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setForm(EMPTY_CONTEST_FORM);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onCancelEdit();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.campus) return;
    if (!isEdit && !imageFile) {
      toast.error("이미지를 선택해 주세요.");
      return;
    }

    setSubmitting(true);

    let imageUrl = isEdit ? editTarget!.image_url : "";
    let oldImagePath: string | null = null;

    // 새 이미지가 있으면 업로드
    if (imageFile) {
      const uploadResult = await uploadContestImage(imageFile);
      if (!uploadResult.ok) {
        toast.error("이미지 업로드 실패: " + uploadResult.reason);
        setSubmitting(false);
        return;
      }
      imageUrl = uploadResult.url;

      // 수정 시 기존 이미지 경로 추출 (나중에 삭제)
      if (isEdit && editTarget!.image_url) {
        const urlObj = new URL(editTarget!.image_url);
        const pathParts = urlObj.pathname.split(`/${CONTEST_BUCKET}/`);
        if (pathParts.length > 1) oldImagePath = pathParts[1];
      }
    }

    const payload: Record<string, unknown> = {
      campus: form.campus,
      creator_name: form.creator_name || null,
      image_url: imageUrl,
      title: form.title || null,
      year: null,
    };

    const result = isEdit
      ? await updateRecord(CONTEST_TABLE, editTarget!.id, payload)
      : await createRecord(CONTEST_TABLE, payload);

    if (result.ok) {
      // 수정 성공 후 기존 이미지 삭제 (실패해도 무시)
      if (oldImagePath) deleteContestImage(oldImagePath);
      toast.success(isEdit ? "공모전 출품작이 수정되었습니다." : "공모전 출품작이 등록되었습니다.");
      reset();
      onSuccess();
    } else {
      toast.error(result.reason);
    }

    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className={isEdit ? "border-primary/50 ring-1 ring-primary/20" : ""}>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold">
            {isEdit ? `수정 중: ${editTarget!.creator_name}` : "새 출품작 등록"}
          </CardTitle>
          <CardDescription className="text-xs">
            공모전 출품작 이미지를 업로드하고 작성자 정보를 입력합니다.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {/* 이미지 업로드 */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">
              출품 이미지 {!isEdit && <span className="text-destructive">*</span>}
            </Label>
            <div
              className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-input hover:border-primary/50 transition-colors cursor-pointer overflow-hidden"
              style={{ minHeight: 160 }}
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="미리보기"
                    className="w-full object-cover"
                    style={{ maxHeight: 240 }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white text-xs font-medium">클릭하여 이미지 변경</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                  <Trophy className="h-8 w-8 opacity-30" />
                  <p className="text-sm">클릭하여 이미지 선택</p>
                  <p className="text-xs opacity-60">JPG, PNG, WebP 권장</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {imageFile && (
              <p className="text-xs text-muted-foreground">선택됨: {imageFile.name}</p>
            )}
          </div>

          {/* 제목 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contest_title" className="text-xs">작품 제목</Label>
            <Input
              id="contest_title"
              placeholder="작품 제목 (선택)"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>

          {/* 캠퍼스 + 작성자 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contest_campus" className="text-xs">
                캠퍼스 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contest_campus"
                placeholder="예: 서울"
                required
                value={form.campus}
                onChange={(e) => setForm((f) => ({ ...f, campus: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contest_creator" className="text-xs">작성자</Label>
              <Input
                id="contest_creator"
                placeholder="예: 홍길동"
                value={form.creator_name}
                onChange={(e) => setForm((f) => ({ ...f, creator_name: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-0 justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={reset} disabled={submitting}>
            {isEdit ? "취소" : "초기화"}
          </Button>
          <Button type="submit" size="sm" className="gap-1.5" disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isEdit ? (
              <Pencil className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {isEdit ? "수정 완료" : "등록"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

// ─── 공모전 탭 ────────────────────────────────────────────────────────────────

function ContestTab() {
  const [entries, setEntries] = useState<ContestEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editTarget, setEditTarget] = useState<ContestEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContestEntry | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const result = await fetchTableData(CONTEST_TABLE, {
      orderBy: "created_at",
      ascending: false,
      pageSize: 200,
    });
    if (result.ok) {
      setEntries(result.data.rows as unknown as ContestEntry[]);
    } else {
      toast.error("데이터를 불러오지 못했습니다: " + result.reason);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteRecord(CONTEST_TABLE, deleteTarget.id);
    if (result.ok) {
      // 스토리지 이미지도 삭제 시도
      if (deleteTarget.image_url) {
        try {
          const urlObj = new URL(deleteTarget.image_url);
          const pathParts = urlObj.pathname.split(`/${CONTEST_BUCKET}/`);
          if (pathParts.length > 1) deleteContestImage(pathParts[1]);
        } catch { /* ignore */ }
      }
      toast.success("출품작이 삭제되었습니다.");
      setEntries((prev) => prev.filter((e) => e.id !== deleteTarget.id));
    } else {
      toast.error("삭제 실패: " + result.reason);
    }
    setDeleteTarget(null);
  };

  const filtered = entries.filter((e) => {
    const q = search.toLowerCase();
    return (
      (e.title ?? "").toLowerCase().includes(q) ||
      e.campus.toLowerCase().includes(q) ||
      (e.creator_name ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-6">
      {/* 입력 / 수정 폼 */}
      <ContestForm
        editTarget={editTarget}
        onSuccess={load}
        onCancelEdit={() => setEditTarget(null)}
      />

      {/* 목록 헤더 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">
            등록된 출품작 ({isLoading ? "…" : entries.length})
          </h2>
          <button
            onClick={load}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="새로고침"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-8 h-8 text-sm"
            placeholder="제목, 캠퍼스, 작성자 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* 그리드 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">불러오는 중...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <MoreHorizontal className="h-8 w-8 opacity-30" />
          <p className="text-sm">{search ? "검색 결과가 없습니다." : "등록된 출품작이 없습니다."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((entry) => (
            <Card key={entry.id} className="overflow-hidden group">
              {/* 썸네일 */}
              <div className="relative aspect-square overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={entry.image_url}
                  alt={entry.title ?? entry.creator_name ?? ""}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                {/* 액션 오버레이 */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditTarget(entry);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8"
                    onClick={() => setDeleteTarget(entry)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* 정보 */}
              <CardContent className="p-3 flex flex-col gap-1">
                {entry.title && (
                  <p className="text-sm font-medium leading-tight line-clamp-1">{entry.title}</p>
                )}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary shrink-0">
                      {entry.campus}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">{entry.creator_name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <HeartHandshake className="h-3 w-3" />
                    {entry.likes_count}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={handleDelete}
        title="출품작을 삭제하시겠습니까?"
        description={`"${deleteTarget?.creator_name}"의 출품작이 영구적으로 삭제됩니다. 업로드된 이미지도 함께 삭제됩니다.`}
      />
    </div>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────────

export default function SummerRetreatPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("prayer");
  const currentTab = TABS.find((t) => t.key === activeTab)!;

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Tent className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">여름수련회</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">앱에 표시될 여름수련회 콘텐츠를 관리합니다.</p>
        </div>
      </div>

      {/* 탭 바 */}
      <div className="flex gap-1 border-b mb-6">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* 탭 설명 */}
      <p className="text-sm text-muted-foreground mb-5">{currentTab.description}</p>

      {/* 탭 패널 */}
      {activeTab === "prayer" && <PrayerTab />}
      {activeTab === "contest" && <ContestTab />}
      {activeTab === "notice" && <NoticeTab />}
    </div>
  );
}
