"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  HeartHandshake,
  Loader2,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

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
  createRecord,
  deleteRecord,
  fetchTableData,
  updateRecord,
} from "@/app/(pages)/admin-dashboard/actions";

// ─── 상수 ────────────────────────────────────────────────────────────────────

const TABLE = "chapel_prayer_topics";
const CHAPEL_TABLE = "chapels";

/** 채플 일시 미정 센티널 연도 (ChapelForm의 DATETIME_UNDECIDED_SENTINEL과 동일 규칙) */
const UNDECIDED_YEAR_PREFIX = "2099";

/** 채플/기도제목 모두 한 학기 규모라 한 번에 받아 클라이언트에서 그룹핑한다 */
const MAX_ROWS = 200;

const SELECT_CLASS =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const TEXTAREA_CLASS =
  "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none";

const CAMPUS_DATALIST_ID = "retreat-prayer-campus-options";

// ─── 타입 (DDL 반영) ──────────────────────────────────────────────────────────

type Scope = "district" | "campus";

interface PrayerTopic {
  id: number;
  chapel_id: number;
  scope: Scope;
  campus: string | null;
  title: string;
  body: string | null;
  sort_order: number;
  intercession_count: number;
  created_at: string;
  updated_at: string;
}

interface ChapelOption {
  id: number;
  topic: string;
  datetime: string;
  retreat_datetime: string | null;
}

// ─── 유틸 ────────────────────────────────────────────────────────────────────

function formatChapelLabel(chapel: ChapelOption): string {
  const date = new Date(chapel.datetime);
  const isUndecided =
    !chapel.datetime ||
    chapel.datetime.startsWith(UNDECIDED_YEAR_PREFIX) ||
    Number.isNaN(date.getTime());

  const datePart = isUndecided
    ? "일시 미정"
    : date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
      });

  const retreatAt = chapel.retreat_datetime ? new Date(chapel.retreat_datetime) : null;
  const retreatPart =
    retreatAt && !Number.isNaN(retreatAt.getTime())
      ? ` · 리트릿 ${retreatAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`
      : "";

  return `${datePart} · ${chapel.topic}${retreatPart}`;
}

/** sort_order 기본값이 모두 0일 수 있어 id로 2차 정렬해 순서를 확정한다 */
function sortTopics(list: PrayerTopic[]): PrayerTopic[] {
  return [...list].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
}

/** 같은 그룹(지구 / 캠퍼스별) 안에서 다음 순서값 */
function nextSortOrder(topics: PrayerTopic[], scope: Scope, campus: string | null): number {
  const group = topics.filter(
    (t) => t.scope === scope && (scope === "district" || (t.campus ?? "") === (campus ?? ""))
  );
  if (group.length === 0) return 0;
  return Math.max(...group.map((t) => t.sort_order)) + 1;
}

// ─── 기도제목 카드 ────────────────────────────────────────────────────────────

function TopicCard({
  topic,
  index,
  total,
  isBusy,
  onEdit,
  onDelete,
  onMove,
}: {
  topic: PrayerTopic;
  index: number;
  total: number;
  isBusy: boolean;
  onEdit: (topic: PrayerTopic) => void;
  onDelete: (topic: PrayerTopic) => void;
  onMove: (topic: PrayerTopic, direction: "up" | "down") => void;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <span className="mt-0.5 h-6 w-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[11px] font-bold shrink-0">
            {index + 1}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="위로"
              disabled={isBusy || index === 0}
              onClick={() => onMove(topic, "up")}
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="아래로"
              disabled={isBusy || index === total - 1}
              onClick={() => onMove(topic, "down")}
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
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
        {topic.body && (
          <CardDescription className="text-xs leading-relaxed whitespace-pre-wrap">
            {topic.body}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">
          <Users className="h-3 w-3" />
          중보 {topic.intercession_count}회
        </span>
      </CardContent>
    </Card>
  );
}

// ─── 기도제목 입력 폼 ─────────────────────────────────────────────────────────

function TopicForm({
  chapelId,
  topics,
  editTarget,
  campusOptions,
  onSuccess,
  onCancelEdit,
}: {
  chapelId: number | null;
  topics: PrayerTopic[];
  editTarget: PrayerTopic | null;
  campusOptions: string[];
  onSuccess: () => void;
  onCancelEdit: () => void;
}) {
  const isEdit = editTarget !== null;
  const [scope, setScope] = useState<Scope>("district");
  const [campus, setCampus] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 편집 대상이 바뀌면 폼 채우기
  useEffect(() => {
    if (editTarget) {
      setScope(editTarget.scope);
      setCampus(editTarget.campus ?? "");
      setTitle(editTarget.title);
      setBody(editTarget.body ?? "");
    } else {
      setScope("district");
      setCampus("");
      setTitle("");
      setBody("");
    }
  }, [editTarget]);

  const reset = () => {
    setScope("district");
    setCampus("");
    setTitle("");
    setBody("");
    onCancelEdit();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (chapelId == null) {
      toast.error("먼저 채플을 선택해주세요.");
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedCampus = campus.trim();
    if (!trimmedTitle) return;
    // DB check 제약과 동일: 캠퍼스 범위는 캠퍼스명이 반드시 있어야 한다
    if (scope === "campus" && !trimmedCampus) {
      toast.error("캠퍼스명을 입력해주세요.");
      return;
    }

    setSubmitting(true);

    const payload = {
      chapel_id: chapelId,
      scope,
      campus: scope === "campus" ? trimmedCampus : null,
      title: trimmedTitle,
      body: body.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const result = isEdit
      ? await updateRecord(TABLE, editTarget.id, payload)
      : await createRecord(TABLE, {
          ...payload,
          sort_order: nextSortOrder(topics, scope, scope === "campus" ? trimmedCampus : null),
        });

    setSubmitting(false);

    if (result.ok) {
      toast.success(isEdit ? "기도제목이 수정되었습니다." : "기도제목이 등록되었습니다.");
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
            {isEdit ? `수정 중: ${editTarget.title}` : "새 기도제목 추가"}
          </CardTitle>
          <CardDescription className="text-xs">
            지구 전체 기도제목과 캠퍼스별 기도제목을 나눠서 등록합니다.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {/* 범위 + 캠퍼스 */}
          <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">
                범위 <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                {(["district", "campus"] as Scope[]).map((key) => (
                  <Button
                    key={key}
                    type="button"
                    variant={scope === key ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setScope(key)}
                  >
                    {key === "district" ? "지구 전체" : "캠퍼스"}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="campus" className="text-xs">
                캠퍼스 {scope === "campus" && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="campus"
                list={CAMPUS_DATALIST_ID}
                placeholder={scope === "campus" ? "예: 부산대" : "지구 전체 기도제목은 캠퍼스를 입력하지 않습니다."}
                value={scope === "campus" ? campus : ""}
                onChange={(e) => setCampus(e.target.value)}
                disabled={scope !== "campus"}
              />
              <datalist id={CAMPUS_DATALIST_ID}>
                {campusOptions.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
          </div>

          {/* 제목 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title" className="text-xs">
              제목 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="예: 리트릿에 함께할 새친구들을 위해"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* 본문 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="body" className="text-xs">
              내용
            </Label>
            <textarea
              id="body"
              rows={3}
              placeholder="기도제목에 대한 자세한 내용을 입력하세요"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className={TEXTAREA_CLASS}
            />
          </div>
        </CardContent>

        <CardFooter className="pt-0 justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={reset} disabled={submitting}>
            {isEdit ? "취소" : "초기화"}
          </Button>
          <Button
            type="submit"
            size="sm"
            className="gap-1.5"
            disabled={submitting || chapelId == null}
          >
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

// ─── 기도제목 목록 섹션 ───────────────────────────────────────────────────────

function TopicGroup({
  title,
  icon: Icon,
  topics,
  isBusy,
  onEdit,
  onDelete,
  onMove,
}: {
  title: string;
  icon: React.ElementType;
  topics: PrayerTopic[];
  isBusy: boolean;
  onEdit: (topic: PrayerTopic) => void;
  onDelete: (topic: PrayerTopic) => void;
  onMove: (topic: PrayerTopic, direction: "up" | "down") => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold">
        <Icon className="h-4 w-4 text-primary" />
        {title}
        <span className="text-xs font-normal text-muted-foreground">({topics.length})</span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {topics.map((topic, index) => (
          <TopicCard
            key={topic.id}
            topic={topic}
            index={index}
            total={topics.length}
            isBusy={isBusy}
            onEdit={onEdit}
            onDelete={onDelete}
            onMove={onMove}
          />
        ))}
      </div>
    </div>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────────

export default function RetreatPrayerPage() {
  const [chapels, setChapels] = useState<ChapelOption[]>([]);
  const [chapelId, setChapelId] = useState<number | null>(null);
  const [topics, setTopics] = useState<PrayerTopic[]>([]);
  const [campusOptions, setCampusOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReordering, setIsReordering] = useState(false);
  const [editTarget, setEditTarget] = useState<PrayerTopic | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PrayerTopic | null>(null);

  const loadChapels = useCallback(async () => {
    const result = await fetchTableData(CHAPEL_TABLE, {
      orderBy: "datetime",
      ascending: false,
      pageSize: MAX_ROWS,
    });
    if (!result.ok) {
      toast.error("채플 목록을 불러오지 못했습니다: " + result.reason);
      setIsLoading(false);
      return;
    }
    const rows = result.data.rows as unknown as ChapelOption[];
    setChapels(rows);
    // 리트릿이 있는 가장 최근 채플을 기본 선택 (없으면 최신 채플)
    setChapelId((prev) => prev ?? (rows.find((c) => c.retreat_datetime) ?? rows[0])?.id ?? null);
    if (rows.length === 0) setIsLoading(false);
  }, []);

  const loadCampusOptions = useCallback(async () => {
    const result = await fetchTableData(TABLE, {
      orderBy: "id",
      ascending: false,
      pageSize: MAX_ROWS,
      filterColumn: "scope",
      filterValue: "campus",
    });
    if (!result.ok) return;
    const names = (result.data.rows as unknown as PrayerTopic[])
      .map((row) => (row.campus ?? "").trim())
      .filter(Boolean);
    setCampusOptions(Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, "ko")));
  }, []);

  const loadTopics = useCallback(async () => {
    if (chapelId == null) {
      setTopics([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const result = await fetchTableData(TABLE, {
      orderBy: "sort_order",
      ascending: true,
      pageSize: MAX_ROWS,
      filterColumn: "chapel_id",
      filterValue: String(chapelId),
    });
    if (result.ok) {
      setTopics(result.data.rows as unknown as PrayerTopic[]);
    } else {
      toast.error("기도제목을 불러오지 못했습니다: " + result.reason);
    }
    setIsLoading(false);
  }, [chapelId]);

  useEffect(() => {
    loadChapels();
    loadCampusOptions();
  }, [loadChapels, loadCampusOptions]);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  const selectedChapel = chapels.find((c) => c.id === chapelId) ?? null;

  const districtTopics = useMemo(
    () => sortTopics(topics.filter((t) => t.scope === "district")),
    [topics]
  );

  const campusGroups = useMemo(() => {
    const map = new Map<string, PrayerTopic[]>();
    topics
      .filter((t) => t.scope === "campus")
      .forEach((t) => {
        const key = (t.campus ?? "").trim();
        map.set(key, [...(map.get(key) ?? []), t]);
      });
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0], "ko"))
      .map(([campus, list]) => ({ campus, list: sortTopics(list) }));
  }, [topics]);

  const handleMove = async (topic: PrayerTopic, direction: "up" | "down") => {
    const group =
      topic.scope === "district"
        ? districtTopics
        : campusGroups.find((g) => g.campus === (topic.campus ?? "").trim())?.list ?? [];

    const index = group.findIndex((t) => t.id === topic.id);
    const target = index + (direction === "up" ? -1 : 1);
    if (index < 0 || target < 0 || target >= group.length) return;

    const reordered = [...group];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

    // sort_order 기본값이 모두 0인 경우가 있어 자리 교환 대신 그룹 전체를 0..n-1로 다시 매긴다
    const changed = reordered
      .map((item, order) => ({ item, order }))
      .filter(({ item, order }) => item.sort_order !== order);

    setIsReordering(true);
    const results = await Promise.all(
      changed.map(({ item, order }) =>
        updateRecord(TABLE, item.id, {
          sort_order: order,
          updated_at: new Date().toISOString(),
        })
      )
    );
    setIsReordering(false);

    const failed = results.find(
      (r): r is { ok: false; reason: string } => !r.ok
    );
    if (failed) toast.error("순서를 바꾸지 못했습니다: " + failed.reason);
    await loadTopics();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteRecord(TABLE, deleteTarget.id);
    if (result.ok) {
      toast.success("기도제목이 삭제되었습니다.");
      setTopics((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      if (editTarget?.id === deleteTarget.id) setEditTarget(null);
    } else {
      toast.error("삭제 실패: " + result.reason);
    }
    setDeleteTarget(null);
  };

  const handleSuccess = () => {
    loadTopics();
    loadCampusOptions();
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <HeartHandshake className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">리트릿 기도제목</h1>
          </div>
          <p className="text-muted-foreground">
            채플별 리트릿에서 함께 기도할 제목을 지구 전체 / 캠퍼스별로 작성합니다.
          </p>
        </div>
        <Button variant="outline" onClick={loadTopics} disabled={isLoading || chapelId == null}>
          <RotateCcw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          새로고침
        </Button>
      </div>

      {/* 채플 선택 */}
      <div className="mb-6 rounded-xl border bg-card p-5 flex flex-col gap-2">
        <Label htmlFor="chapel" className="text-xs">
          채플 선택
        </Label>
        <select
          id="chapel"
          className={SELECT_CLASS}
          value={chapelId ?? ""}
          onChange={(e) => {
            setEditTarget(null);
            setChapelId(e.target.value ? Number(e.target.value) : null);
          }}
        >
          {chapels.length === 0 && <option value="">등록된 채플이 없습니다.</option>}
          {chapels.map((chapel) => (
            <option key={chapel.id} value={chapel.id}>
              {formatChapelLabel(chapel)}
            </option>
          ))}
        </select>
        {selectedChapel && !selectedChapel.retreat_datetime && (
          <p className="text-xs text-destructive">
            이 채플은 리트릿 시작 시간이 비어 있습니다. 채플 관리에서 리트릿 일정을 먼저 설정해주세요.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {/* 입력 / 수정 폼 */}
        <TopicForm
          chapelId={chapelId}
          topics={topics}
          editTarget={editTarget}
          campusOptions={campusOptions}
          onSuccess={handleSuccess}
          onCancelEdit={() => setEditTarget(null)}
        />

        {/* 목록 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">불러오는 중...</span>
          </div>
        ) : topics.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
            <MoreHorizontal className="h-8 w-8 opacity-30" />
            <p className="text-sm">등록된 기도제목이 없습니다.</p>
          </div>
        ) : (
          <>
            {districtTopics.length > 0 && (
              <TopicGroup
                title="지구 전체"
                icon={HeartHandshake}
                topics={districtTopics}
                isBusy={isReordering}
                onEdit={(t) => {
                  setEditTarget(t);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onDelete={setDeleteTarget}
                onMove={handleMove}
              />
            )}
            {campusGroups.map(({ campus, list }) => (
              <TopicGroup
                key={campus}
                title={campus || "캠퍼스 미지정"}
                icon={MapPin}
                topics={list}
                isBusy={isReordering}
                onEdit={(t) => {
                  setEditTarget(t);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onDelete={setDeleteTarget}
                onMove={handleMove}
              />
            ))}
          </>
        )}
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
        title="기도제목을 삭제하시겠습니까?"
        description={`"${deleteTarget?.title}" 항목이 영구적으로 삭제됩니다.`}
      />
    </div>
  );
}
