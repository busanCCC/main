"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, ArrowLeft, Loader2, Music } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import {
  YouTubePraiseSearch,
  type YouTubeVideo,
} from "./YouTubePraiseSearch";
import { SelectedPraisesList } from "./SelectedPraisesList";
import { PublishPeriodSection } from "./PublishPeriodSection";
import {
  createRecord as createRecordAction,
  updateRecord as updateRecordAction,
  fetchRecord as fetchRecordAction,
} from "@/app/(pages)/admin-dashboard/actions";
import { TOAST_DURATION_MS } from "@/app/(pages)/admin-dashboard/table-config";

// --- 주간 흐름 전용 Zod 스키마 (Predictability: 날짜 크로스 필드 검증 포함) ---
const weeklyFlowFormSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요."),
  description: z.string().min(1, "설명을 입력해주세요."),
  sub_description: z.string().optional().default(""),
  active_from: z.string().min(1, "게시 시작일을 선택해주세요."),
  active_until: z.string().min(1, "게시 종료일을 선택해주세요."),
  related_events: z.string().optional().default(""),
  related_notices: z.string().optional().default(""),
}).refine(
  (data) => !data.active_from || !data.active_until || data.active_from < data.active_until,
  { message: "종료일은 시작일 이후여야 합니다.", path: ["active_until"] }
);

type WeeklyFlowFormValues = z.infer<typeof weeklyFlowFormSchema>;

// --- 기존 추천 찬양 로드용 인터페이스 ---
interface ExistingPraise {
  id: number;
  title: string;
  description: string | null;
  external_url: string;
  thumbnail_url: string | null;
  platform: string | null;
}

// --- Props ---
interface WeeklyFlowFormProps {
  defaultValues?: Record<string, unknown>;
  onSubmitSuccess: () => void;
  onBack: () => void;
  mode: "create" | "edit";
  recordId?: string;
}

// --- 기존 recommended_praises를 YouTubeVideo 형태로 변환 ---
function existingPraiseToVideo(praise: ExistingPraise): YouTubeVideo & { dbId: number } {
  const videoIdMatch = praise.external_url.match(
    /(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  const videoId = videoIdMatch ? videoIdMatch[1] : `db-${praise.id}`;

  return {
    videoId,
    title: praise.title,
    channelTitle: "",
    thumbnail: praise.thumbnail_url || "",
    url: praise.external_url,
    dbId: praise.id,
  };
}

export function WeeklyFlowForm({
  defaultValues,
  onSubmitSuccess,
  onBack,
  mode,
  recordId,
}: WeeklyFlowFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPraises, setSelectedPraises] = useState<
    (YouTubeVideo & { dbId?: number })[]
  >([]);
  const [isLoadingPraises, setIsLoadingPraises] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WeeklyFlowFormValues>({
    resolver: zodResolver(weeklyFlowFormSchema),
    defaultValues: {
      title: String(defaultValues?.title ?? ""),
      description: String(defaultValues?.description ?? ""),
      sub_description: String(defaultValues?.sub_description ?? ""),
      active_from: String(defaultValues?.active_from ?? ""),
      active_until: String(defaultValues?.active_until ?? ""),
      related_events: Array.isArray(defaultValues?.related_events)
        ? (defaultValues.related_events as number[]).join(", ")
        : "",
      related_notices: Array.isArray(defaultValues?.related_notices)
        ? (defaultValues.related_notices as number[]).join(", ")
        : "",
    },
  });

  // 게시 기간 필드 watch (PublishPeriodSection 연동)
  const activeFrom = watch("active_from");
  const activeUntil = watch("active_until");

  // 수정 모드일 때 기존 related_praises의 실제 데이터 로드
  useEffect(() => {
    if (mode !== "edit" || !defaultValues?.related_praises) return;

    const praiseIds = defaultValues.related_praises as number[] | null;
    if (!praiseIds || praiseIds.length === 0) return;

    async function loadExistingPraises() {
      setIsLoadingPraises(true);
      const loaded: ExistingPraise[] = [];

      for (const pid of praiseIds!) {
        const result = await fetchRecordAction("recommended_praises", pid);
        if (result.ok) {
          loaded.push(result.data as unknown as ExistingPraise);
        }
      }

      const mapped = loaded.map(existingPraiseToVideo);
      setSelectedPraises(mapped);
      setIsLoadingPraises(false);
    }

    loadExistingPraises();
  }, [mode, defaultValues?.related_praises]);

  // 찬양 선택 핸들러
  const handleSelectPraise = useCallback((video: YouTubeVideo) => {
    setSelectedPraises((prev) => {
      if (prev.some((p) => p.videoId === video.videoId)) return prev;
      return [...prev, video];
    });
  }, []);

  // 찬양 제거 핸들러
  const handleRemovePraise = useCallback((videoId: string) => {
    setSelectedPraises((prev) => prev.filter((p) => p.videoId !== videoId));
  }, []);

  // 숫자 배열 문자열 파싱
  const parseNumberArray = (str: string): number[] | null => {
    const trimmed = str.trim();
    if (trimmed === "") return null;
    return trimmed
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
  };

  // 폼 제출 핸들러
  const onFormSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);

    try {
      // 1단계: 새로 선택된 찬양(DB에 아직 없는 것)을 recommended_praises에 INSERT
      const newPraises = selectedPraises.filter((p) => !p.dbId);
      const existingPraiseIds = selectedPraises
        .filter((p) => p.dbId)
        .map((p) => p.dbId!);

      const newPraiseIds: number[] = [];

      for (const praise of newPraises) {
        const result = await createRecordAction("recommended_praises", {
          title: praise.title.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"'),
          description: praise.channelTitle || null,
          external_url: praise.url,
          thumbnail_url: praise.thumbnail || null,
          platform: "youtube",
          is_playlist: false,
        });

        if (result.ok && result.data.id) {
          newPraiseIds.push(result.data.id as number);
        } else {
          toast.error(`찬양 저장 실패: ${!result.ok ? result.reason : "알 수 없는 오류"}`, {
            duration: TOAST_DURATION_MS,
          });
          setIsSubmitting(false);
          return;
        }
      }

      // 2단계: 모든 찬양 ID 합치기
      const allPraiseIds = [...existingPraiseIds, ...newPraiseIds];

      // 3단계: weekly_flows 레코드 생성/수정
      const weeklyFlowData: Record<string, unknown> = {
        title: data.title.trim(),
        description: data.description.trim(),
        sub_description: data.sub_description?.trim() || null,
        active_from: data.active_from || null,
        active_until: data.active_until || null,
        related_events: parseNumberArray(data.related_events ?? ""),
        related_notices: parseNumberArray(data.related_notices ?? ""),
        related_praises: allPraiseIds.length > 0 ? allPraiseIds : null,
      };

      let result;
      if (mode === "create") {
        result = await createRecordAction("weekly_flows", weeklyFlowData);
      } else {
        result = await updateRecordAction(
          "weekly_flows",
          Number(recordId),
          weeklyFlowData
        );
      }

      if (result.ok) {
        toast.success(
          mode === "create"
            ? "주간 흐름이 생성되었습니다."
            : "주간 흐름이 수정되었습니다.",
          { duration: TOAST_DURATION_MS }
        );
        onSubmitSuccess();
      } else {
        toast.error(`저장 실패: ${result.reason}`, { duration: TOAST_DURATION_MS });
      }
    } catch (err) {
      console.error("[WeeklyFlowForm] 제출 오류:", err);
      toast.error("예기치 못한 오류가 발생했습니다.", { duration: TOAST_DURATION_MS });
    }

    setIsSubmitting(false);
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold">
            {mode === "create" ? "주간 흐름 생성" : "주간 흐름 수정"}
          </h2>
          <p className="text-sm text-muted-foreground">
            주간 프로그램 흐름 및 추천 찬양을 관리합니다.
          </p>
        </div>
      </div>

      <form onSubmit={onFormSubmit} className="space-y-6 max-w-2xl">
        {/* 제목 */}
        <div className="space-y-2">
          <Label htmlFor="title">
            제목<span className="text-destructive ml-1">*</span>
          </Label>
          <Input
            {...register("title")}
            placeholder="주간 흐름 제목을 입력하세요"
            className={errors.title ? "border-destructive" : ""}
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>

        {/* 설명 */}
        <div className="space-y-2">
          <Label htmlFor="description">
            설명<span className="text-destructive ml-1">*</span>
          </Label>
          <textarea
            {...register("description")}
            placeholder="주간 흐름 설명을 입력하세요"
            rows={4}
            className={`flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              errors.description ? "border-destructive" : ""
            }`}
          />
          {errors.description && (
            <p className="text-sm text-destructive">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* 부가 설명 */}
        <div className="space-y-2">
          <Label htmlFor="sub_description">부가 설명</Label>
          <textarea
            {...register("sub_description")}
            placeholder="추가 설명을 입력하세요"
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        {/* 게시 기간 (PublishPeriodSection) */}
        <PublishPeriodSection
          activeFrom={activeFrom}
          activeUntil={activeUntil}
          onChangeFrom={(v) => setValue("active_from", v, { shouldValidate: true })}
          onChangeUntil={(v) => setValue("active_until", v, { shouldValidate: true })}
          errorFrom={errors.active_from?.message}
          errorUntil={errors.active_until?.message}
        />

        {/* 관련 이벤트 ID */}
        <div className="space-y-2">
          <Label htmlFor="related_events">관련 이벤트 ID</Label>
          <Input
            {...register("related_events")}
            type="text"
            placeholder="쉼표로 구분 (예: 1, 2, 3)"
          />
        </div>

        {/* 관련 공지 ID */}
        <div className="space-y-2">
          <Label htmlFor="related_notices">관련 공지 ID</Label>
          <Input
            {...register("related_notices")}
            type="text"
            placeholder="쉼표로 구분 (예: 1, 2, 3)"
          />
        </div>

        {/* 추천 찬양 섹션 (YouTube 검색 연동) */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            <div>
              <h3 className="text-base font-semibold">추천 찬양</h3>
              <p className="text-sm text-muted-foreground">
                YouTube에서 찬양을 검색하여 추가하세요. 선택된 찬양은 자동으로
                저장됩니다.
              </p>
            </div>
          </div>

          {/* 선택된 찬양 목록 */}
          {isLoadingPraises ? (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              기존 찬양 로딩 중...
            </div>
          ) : (
            <SelectedPraisesList
              praises={selectedPraises}
              onRemove={handleRemovePraise}
            />
          )}

          {/* YouTube 검색 */}
          <YouTubePraiseSearch
            onSelect={handleSelectPraise}
            selectedVideoIds={selectedPraises.map((p) => p.videoId)}
          />
        </div>

        {/* 제출 버튼 */}
        <div className="flex items-center gap-3 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {mode === "create" ? "생성" : "저장"}
          </Button>
          <Button type="button" variant="outline" onClick={onBack}>
            취소
          </Button>
        </div>
      </form>
    </div>
  );
}
