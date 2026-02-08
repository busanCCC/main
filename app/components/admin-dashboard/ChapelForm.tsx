"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, ArrowLeft, Loader2 } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { ChapelPreview } from "./ChapelPreview";

/** datetime 미정 시 DB에 저장할 센티널 값 (앱에서 "일시 미정"으로 표시) */
const DATETIME_UNDECIDED_SENTINEL = "2099-12-31T00:00:00+09:00";

const chapelFormSchema = z
  .object({
    topic: z.string(),
    messenger: z.string(),
    place: z.string(),
    place_link: z.string().url("올바른 URL을 입력해주세요.").optional().or(z.literal("")),
    datetime: z.string(),
    thumbnail_url: z.string().url("올바른 URL을 입력해주세요.").optional().or(z.literal("")),
    active_from: z.string().min(1, "노출 시작일을 입력해주세요."),
    active_until: z.string().min(1, "노출 종료일을 입력해주세요."),
    topic_undecided: z.boolean().optional().default(false),
    messenger_undecided: z.boolean().optional().default(false),
    place_undecided: z.boolean().optional().default(false),
    datetime_undecided: z.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    if (!data.topic_undecided && !data.topic?.trim()) {
      ctx.addIssue({ code: "custom", message: "주제를 입력해주세요.", path: ["topic"] });
    }
    if (!data.messenger_undecided && !data.messenger?.trim()) {
      ctx.addIssue({ code: "custom", message: "메신저를 입력해주세요.", path: ["messenger"] });
    }
    if (!data.place_undecided && !data.place?.trim()) {
      ctx.addIssue({ code: "custom", message: "장소를 입력해주세요.", path: ["place"] });
    }
    if (!data.datetime_undecided && !data.datetime?.trim()) {
      ctx.addIssue({ code: "custom", message: "채플 일시를 입력해주세요.", path: ["datetime"] });
    }
  });

type ChapelFormValues = z.infer<typeof chapelFormSchema>;

interface ChapelFormProps {
  defaultValues?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onBack: () => void;
  isSubmitting?: boolean;
  mode: "create" | "edit";
}

function toFormDefaults(record?: Record<string, unknown>): ChapelFormValues {
  const get = (key: string): string => {
    const v = record?.[key];
    if (v == null) return "";
    return String(v);
  };

  const datetime = get("datetime");
  const isDatetimeUndecided =
    !datetime || datetime === DATETIME_UNDECIDED_SENTINEL || (typeof datetime === "string" && datetime.startsWith("2099-"));

  return {
    topic: get("topic"),
    messenger: get("messenger"),
    place: get("place"),
    place_link: get("place_link"),
    datetime: isDatetimeUndecided ? "" : datetime,
    thumbnail_url: get("thumbnail_url"),
    active_from: get("active_from"),
    active_until: get("active_until"),
    topic_undecided: get("topic") === "미정",
    messenger_undecided: get("messenger") === "미정",
    place_undecided: get("place") === "미정",
    datetime_undecided: isDatetimeUndecided,
  };
}

export function ChapelForm({
  defaultValues,
  onSubmit,
  onBack,
  isSubmitting = false,
  mode,
}: ChapelFormProps) {
  const formDefaults = toFormDefaults(defaultValues);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ChapelFormValues>({
    resolver: zodResolver(chapelFormSchema),
    defaultValues: formDefaults,
  });

  const watchedValues = watch();

  const topicUndecided = watchedValues.topic_undecided;
  const messengerUndecided = watchedValues.messenger_undecided;
  const placeUndecided = watchedValues.place_undecided;
  const datetimeUndecided = watchedValues.datetime_undecided;

  const prevTopic = useRef(topicUndecided);
  const prevMessenger = useRef(messengerUndecided);
  const prevPlace = useRef(placeUndecided);
  const prevDatetime = useRef(datetimeUndecided);

  // 미정 체크박스 해제 시(체크 → 해제) 입력창 비우기
  useEffect(() => {
    if (prevTopic.current === true && topicUndecided === false) {
      setValue("topic", "");
    }
    prevTopic.current = topicUndecided;
  }, [topicUndecided, setValue]);

  useEffect(() => {
    if (prevMessenger.current === true && messengerUndecided === false) {
      setValue("messenger", "");
    }
    prevMessenger.current = messengerUndecided;
  }, [messengerUndecided, setValue]);

  useEffect(() => {
    if (prevPlace.current === true && placeUndecided === false) {
      setValue("place", "");
    }
    prevPlace.current = placeUndecided;
  }, [placeUndecided, setValue]);

  useEffect(() => {
    if (prevDatetime.current === true && datetimeUndecided === false) {
      setValue("datetime", "");
    }
    prevDatetime.current = datetimeUndecided;
  }, [datetimeUndecided, setValue]);

  const processSubmit = (data: ChapelFormValues): Record<string, unknown> => {
    return {
      topic: data.topic_undecided ? "미정" : (data.topic?.trim() || "미정"),
      messenger: data.messenger_undecided ? "미정" : (data.messenger?.trim() || "미정"),
      place: data.place_undecided ? "미정" : (data.place?.trim() || "미정"),
      place_link: data.place_link?.trim() || null,
      datetime: data.datetime_undecided
        ? DATETIME_UNDECIDED_SENTINEL
        : (data.datetime?.trim()
            ? (data.datetime.length <= 16 ? `${data.datetime}:00+09:00` : data.datetime)
            : DATETIME_UNDECIDED_SENTINEL),
      thumbnail_url: data.thumbnail_url?.trim() || null,
      active_from: data.active_from?.trim() || "",
      active_until: data.active_until?.trim() || "",
    };
  };

  const previewValues = {
    topic: topicUndecided ? "미정" : watchedValues.topic,
    messenger: messengerUndecided ? "미정" : watchedValues.messenger,
    place: placeUndecided ? "미정" : watchedValues.place,
    place_link: watchedValues.place_link,
    datetime: datetimeUndecided ? undefined : watchedValues.datetime,
    active_from: watchedValues.active_from,
    active_until: watchedValues.active_until,
  };

  return (
    <div className="flex gap-8 flex-col lg:flex-row">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold">
              {mode === "create" ? "채플 생성" : "채플 수정"}
            </h2>
            <p className="text-sm text-muted-foreground">
              이번 주 채플 안내 (주제, 메신저, 장소, 일시)
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit((data) => onSubmit(processSubmit(data)))}
          className="space-y-6 max-w-2xl"
        >
          {/* 주제 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="topic">주제 *</Label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
                <input
                  {...register("topic_undecided")}
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                />
                미정
              </label>
            </div>
            <Input
              {...register("topic")}
              type="text"
              placeholder="예: 하나님의 사랑"
              disabled={topicUndecided}
              className={errors.topic ? "border-destructive" : ""}
            />
            {errors.topic && (
              <p className="text-sm text-destructive">{errors.topic.message}</p>
            )}
          </div>

          {/* 메신저 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="messenger">메신저 *</Label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
                <input
                  {...register("messenger_undecided")}
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                />
                미정
              </label>
            </div>
            <Input
              {...register("messenger")}
              type="text"
              placeholder="예: 김OO 간사님"
              disabled={messengerUndecided}
              className={errors.messenger ? "border-destructive" : ""}
            />
            {errors.messenger && (
              <p className="text-sm text-destructive">{errors.messenger.message}</p>
            )}
          </div>

          {/* 장소 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="place">장소 *</Label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
                <input
                  {...register("place_undecided")}
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                />
                미정
              </label>
            </div>
            <Input
              {...register("place")}
              type="text"
              placeholder="예: 넘치는 교회"
              disabled={placeUndecided}
              className={errors.place ? "border-destructive" : ""}
            />
            {errors.place && (
              <p className="text-sm text-destructive">{errors.place.message}</p>
            )}
          </div>

          {/* 지도 링크 */}
          <div className="space-y-2">
            <Label htmlFor="place_link">지도 링크</Label>
            <Input
              {...register("place_link")}
              type="url"
              placeholder="https://maps.google.com/..."
              className={errors.place_link ? "border-destructive" : ""}
            />
            {errors.place_link && (
              <p className="text-sm text-destructive">{errors.place_link.message}</p>
            )}
          </div>

          {/* 채플 일시 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="datetime">채플 일시 *</Label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
                <input
                  {...register("datetime_undecided")}
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                />
                미정
              </label>
            </div>
            <Input
              {...register("datetime")}
              type="datetime-local"
              step={60}
              disabled={datetimeUndecided}
              className={errors.datetime ? "border-destructive" : ""}
            />
            {errors.datetime && (
              <p className="text-sm text-destructive">{errors.datetime.message}</p>
            )}
          </div>

          {/* 썸네일 URL */}
          <div className="space-y-2">
            <Label htmlFor="thumbnail_url">썸네일 URL</Label>
            <Input
              {...register("thumbnail_url")}
              type="url"
              placeholder="https://"
              className={errors.thumbnail_url ? "border-destructive" : ""}
            />
            {errors.thumbnail_url && (
              <p className="text-sm text-destructive">{errors.thumbnail_url.message}</p>
            )}
          </div>

          {/* 노출 시작일 */}
          <div className="space-y-2">
            <Label htmlFor="active_from">노출 시작일 *</Label>
            <Input
              {...register("active_from")}
              type="date"
              className={errors.active_from ? "border-destructive" : ""}
            />
            {errors.active_from && (
              <p className="text-sm text-destructive">{errors.active_from.message}</p>
            )}
          </div>

          {/* 노출 종료일 */}
          <div className="space-y-2">
            <Label htmlFor="active_until">노출 종료일 *</Label>
            <Input
              {...register("active_until")}
              type="date"
              className={errors.active_until ? "border-destructive" : ""}
            />
            {errors.active_until && (
              <p className="text-sm text-destructive">{errors.active_until.message}</p>
            )}
          </div>

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

      {/* 미리보기 */}
      <div className="lg:w-[360px] shrink-0">
        <div className="sticky top-8">
          <ChapelPreview values={previewValues} />
        </div>
      </div>
    </div>
  );
}
