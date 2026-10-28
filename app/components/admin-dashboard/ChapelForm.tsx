"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, ArrowLeft, Loader2, Search } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { ChapelPreview } from "./ChapelPreview";
import { PlaceSearchDialog, type PlaceSearchResult } from "./PlaceSearchDialog";
import { KakaoMapPreview } from "./KakaoMapPreview";
import {
  buildDefaultChapelTopic,
  buildDefaultChapelTopicFromDatetime,
  buildDefaultActivePeriod,
  buildDefaultActivePeriodFromDatetime,
} from "./chapelDefaults";

/** datetime 미정 시 DB에 저장할 센티널 값 (앱에서 "일시 미정"으로 표시) */
const DATETIME_UNDECIDED_SENTINEL = "2099-12-31T00:00:00+09:00";

/** 출석 가능 반경 기본값 (m) — DB chapels.attendance_radius_m 컬럼 기본값과 동일 */
const DEFAULT_ATTENDANCE_RADIUS_M = 150;

const chapelFormSchema = z
  .object({
    topic: z.string(),
    messenger: z.string(),
    place: z.string(),
    place_link: z.string().url("올바른 URL을 입력해주세요.").optional().or(z.literal("")),
    datetime: z.string(),
    retreat_datetime: z.string().optional().default(""),
    retreat_enabled: z.boolean().optional().default(false),
    thumbnail_url: z.string().url("올바른 URL을 입력해주세요.").optional().or(z.literal("")),
    latitude: z.string().optional().default(""),
    longitude: z.string().optional().default(""),
    attendance_radius_m: z.string().optional().default(""),
    // 리트릿을 채플과 다른 곳에서 할 때만 쓴다. 미체크면 리트릿 장소 컬럼은 모두 NULL(= 채플 장소)
    retreat_venue_separate: z.boolean().optional().default(false),
    retreat_place: z.string().optional().default(""),
    retreat_place_link: z.string().url("올바른 URL을 입력해주세요.").optional().or(z.literal("")),
    retreat_latitude: z.string().optional().default(""),
    retreat_longitude: z.string().optional().default(""),
    retreat_attendance_radius_m: z.string().optional().default(""),
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

    // 리트릿은 진행하는 날에만 시간을 넣는다 (미체크 = DB NULL = 진행 안 함)
    if (data.retreat_enabled) {
      const retreat = data.retreat_datetime?.trim() ?? "";
      if (!retreat) {
        ctx.addIssue({
          code: "custom",
          message: "리트릿 시작 시간을 입력해주세요.",
          path: ["retreat_datetime"],
        });
      } else if (!data.datetime_undecided && data.datetime?.trim()) {
        // 리트릿은 항상 채플 이후에 진행된다
        const chapelAt = new Date(data.datetime);
        const retreatAt = new Date(retreat);
        if (
          !Number.isNaN(chapelAt.getTime()) &&
          !Number.isNaN(retreatAt.getTime()) &&
          retreatAt <= chapelAt
        ) {
          ctx.addIssue({
            code: "custom",
            message: "리트릿은 채플 일시 이후여야 합니다.",
            path: ["retreat_datetime"],
          });
        }
      }
    }

    validateVenue(ctx, data, {
      latitude: "latitude",
      longitude: "longitude",
      radius: "attendance_radius_m",
    });

    if (data.retreat_enabled && data.retreat_venue_separate) {
      if (!data.retreat_place?.trim()) {
        ctx.addIssue({ code: "custom", message: "리트릿 장소를 입력해주세요.", path: ["retreat_place"] });
      }
      // 좌표가 비면 앱이 채플 좌표로 판정하므로, 다른 장소라면 좌표는 필수다
      if (!data.retreat_latitude?.trim() && !data.retreat_longitude?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "리트릿 출석 위치 좌표를 입력해주세요.",
          path: ["retreat_latitude"],
        });
      }
      validateVenue(ctx, data, {
        latitude: "retreat_latitude",
        longitude: "retreat_longitude",
        radius: "retreat_attendance_radius_m",
      });
    }
  });

type ChapelFormValues = z.infer<typeof chapelFormSchema>;

type VenueFieldKey =
  | "latitude"
  | "longitude"
  | "attendance_radius_m"
  | "retreat_latitude"
  | "retreat_longitude"
  | "retreat_attendance_radius_m";

/** 출석 위치(좌표·반경) 입력값 검증. 채플과 리트릿 장소가 같은 규칙을 쓴다 */
function validateVenue(
  ctx: z.RefinementCtx,
  data: Partial<Record<VenueFieldKey, string>>,
  keys: { latitude: VenueFieldKey; longitude: VenueFieldKey; radius: VenueFieldKey }
) {
  const lat = data[keys.latitude]?.trim() ?? "";
  const lng = data[keys.longitude]?.trim() ?? "";

  if (lat && (!Number.isFinite(Number(lat)) || Math.abs(Number(lat)) > 90)) {
    ctx.addIssue({ code: "custom", message: "위도는 -90 ~ 90 사이의 숫자여야 합니다.", path: [keys.latitude] });
  }
  if (lng && (!Number.isFinite(Number(lng)) || Math.abs(Number(lng)) > 180)) {
    ctx.addIssue({ code: "custom", message: "경도는 -180 ~ 180 사이의 숫자여야 합니다.", path: [keys.longitude] });
  }
  // 출석 거리 계산에 둘 다 필요하므로 한쪽만 채워진 상태를 막는다
  if (lat && !lng) {
    ctx.addIssue({ code: "custom", message: "경도도 함께 입력해주세요.", path: [keys.longitude] });
  }
  if (lng && !lat) {
    ctx.addIssue({ code: "custom", message: "위도도 함께 입력해주세요.", path: [keys.latitude] });
  }

  const radius = data[keys.radius]?.trim() ?? "";
  if (radius && (!Number.isInteger(Number(radius)) || Number(radius) <= 0)) {
    ctx.addIssue({
      code: "custom",
      message: "출석 가능 반경은 1 이상의 정수(m)여야 합니다.",
      path: [keys.radius],
    });
  }
}

/** 좌표 입력 문자열을 지도 미리보기용 숫자로 */
function parseCoordinate(value: string | undefined): number | null {
  return value?.trim() ? Number(value) : null;
}

interface ChapelFormProps {
  defaultValues?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onBack: () => void;
  isSubmitting?: boolean;
  mode: "create" | "edit";
}

/**
 * DB timestamptz("2026-08-12T19:00:00+00:00")를 datetime-local 입력값("2026-08-12T19:00")으로.
 * 브라우저는 오프셋이 붙은 값을 datetime-local에 넣으면 무시하므로 반드시 변환해야 한다.
 */
function toDatetimeLocalValue(value: string): string {
  if (!value.trim()) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toFormDefaults(
  record: Record<string, unknown> | undefined,
  mode: "create" | "edit"
): ChapelFormValues {
  const get = (key: string): string => {
    const v = record?.[key];
    if (v == null) return "";
    return String(v);
  };

  const datetime = get("datetime");
  const retreatDatetime = get("retreat_datetime");
  const isDatetimeUndecided =
    !datetime || datetime === DATETIME_UNDECIDED_SENTINEL || (typeof datetime === "string" && datetime.startsWith("2099-"));

  // 생성 시 주제는 "N월 M주차 지구채플"로 미리 채운다.
  // 채플 일시가 아직 없으면 오늘 날짜를 기준으로 잡고, 일시를 고르면 그에 맞춰 갱신된다.
  const autoTopic =
    mode === "create"
      ? buildDefaultChapelTopicFromDatetime(isDatetimeUndecided ? null : datetime) ??
        buildDefaultChapelTopic(new Date())
      : "";

  // 노출 기간도 같은 기준으로 미리 채운다 (해당 주 월요일 ~ 금요일)
  const autoPeriod =
    mode === "create"
      ? buildDefaultActivePeriodFromDatetime(isDatetimeUndecided ? null : datetime) ??
        buildDefaultActivePeriod(new Date())
      : null;

  return {
    topic: get("topic") || autoTopic,
    messenger: get("messenger"),
    place: get("place"),
    place_link: get("place_link"),
    datetime: isDatetimeUndecided ? "" : toDatetimeLocalValue(datetime),
    retreat_datetime: toDatetimeLocalValue(retreatDatetime),
    // retreat_datetime이 NULL이면 리트릿 진행 안 함
    retreat_enabled: Boolean(retreatDatetime),
    thumbnail_url: get("thumbnail_url"),
    latitude: get("latitude"),
    longitude: get("longitude"),
    // 신규 생성 시 출석 가능 반경 기본값 자동 입력
    attendance_radius_m: record?.attendance_radius_m == null
      ? String(DEFAULT_ATTENDANCE_RADIUS_M)
      : get("attendance_radius_m"),
    // 리트릿 좌표나 장소명이 따로 저장돼 있으면 "다른 장소"로 본다
    retreat_venue_separate:
      record?.retreat_latitude != null || record?.retreat_place != null,
    retreat_place: get("retreat_place"),
    retreat_place_link: get("retreat_place_link"),
    retreat_latitude: get("retreat_latitude"),
    retreat_longitude: get("retreat_longitude"),
    retreat_attendance_radius_m: get("retreat_attendance_radius_m"),
    active_from: get("active_from") || autoPeriod?.activeFrom || "",
    active_until: get("active_until") || autoPeriod?.activeUntil || "",
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
  const formDefaults = toFormDefaults(defaultValues, mode);

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

  // 직접 수정한 뒤에는 일시가 바뀌어도 자동 갱신하지 않는다
  const [topicEditedManually, setTopicEditedManually] = useState(mode === "edit");
  const [activePeriodEditedManually, setActivePeriodEditedManually] = useState(
    mode === "edit"
  );
  const [showPlaceSearch, setShowPlaceSearch] = useState(false);
  const [showRetreatPlaceSearch, setShowRetreatPlaceSearch] = useState(false);

  const topicUndecided = watchedValues.topic_undecided;
  const messengerUndecided = watchedValues.messenger_undecided;
  const placeUndecided = watchedValues.place_undecided;
  const datetimeUndecided = watchedValues.datetime_undecided;
  const retreatEnabled = watchedValues.retreat_enabled;
  const retreatVenueSeparate = retreatEnabled && watchedValues.retreat_venue_separate;

  const prevTopic = useRef(topicUndecided);
  const prevMessenger = useRef(messengerUndecided);
  const prevPlace = useRef(placeUndecided);
  const prevDatetime = useRef(datetimeUndecided);
  const prevRetreat = useRef(retreatEnabled);

  const datetimeValue = watchedValues.datetime;

  // 채플 일시가 바뀌면 주제("N월 M주차 지구채플")를 다시 계산한다.
  // 관리자가 주제를 직접 수정했거나 "미정"이면 건드리지 않는다.
  useEffect(() => {
    if (topicEditedManually || topicUndecided) return;
    const autoTopic = buildDefaultChapelTopicFromDatetime(datetimeValue);
    if (autoTopic) {
      setValue("topic", autoTopic);
    }
  }, [datetimeValue, topicEditedManually, topicUndecided, setValue]);

  // 채플 일시가 바뀌면 노출 기간을 그 주 월요일 ~ 금요일로 다시 계산한다
  useEffect(() => {
    if (activePeriodEditedManually) return;
    const period = buildDefaultActivePeriodFromDatetime(datetimeValue);
    if (period) {
      setValue("active_from", period.activeFrom, { shouldValidate: true });
      setValue("active_until", period.activeUntil, { shouldValidate: true });
    }
  }, [datetimeValue, activePeriodEditedManually, setValue]);

  // 미정 체크박스 해제 시(체크 → 해제) 입력창 비우기
  // 주제는 자동 생성값이 있으면 그걸로 되돌린다
  useEffect(() => {
    if (prevTopic.current === true && topicUndecided === false) {
      const autoTopic = topicEditedManually
        ? null
        : buildDefaultChapelTopicFromDatetime(datetimeValue) ??
          buildDefaultChapelTopic(new Date());
      setValue("topic", autoTopic ?? "");
    }
    prevTopic.current = topicUndecided;
  }, [topicUndecided, topicEditedManually, datetimeValue, setValue]);

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

  // 리트릿 체크 해제 시 입력값을 비워 NULL로 저장되게 한다
  useEffect(() => {
    if (prevRetreat.current === true && retreatEnabled === false) {
      setValue("retreat_datetime", "");
    }
    prevRetreat.current = retreatEnabled;
  }, [retreatEnabled, setValue]);

  const processSubmit = (data: ChapelFormValues): Record<string, unknown> => {
    // 리트릿 미진행이거나 채플과 같은 장소면 리트릿 장소 컬럼은 모두 NULL
    const separateVenue = data.retreat_enabled && data.retreat_venue_separate;
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
      // 리트릿 미진행 시 NULL
      retreat_datetime:
        data.retreat_enabled && data.retreat_datetime?.trim()
          ? (data.retreat_datetime.length <= 16
              ? `${data.retreat_datetime}:00+09:00`
              : data.retreat_datetime)
          : null,
      thumbnail_url: data.thumbnail_url?.trim() || null,
      latitude: data.latitude?.trim() ? Number(data.latitude) : null,
      longitude: data.longitude?.trim() ? Number(data.longitude) : null,
      attendance_radius_m: data.attendance_radius_m?.trim()
        ? Number(data.attendance_radius_m)
        : DEFAULT_ATTENDANCE_RADIUS_M,
      retreat_place: separateVenue ? data.retreat_place?.trim() || null : null,
      retreat_place_link: separateVenue ? data.retreat_place_link?.trim() || null : null,
      retreat_latitude:
        separateVenue && data.retreat_latitude?.trim() ? Number(data.retreat_latitude) : null,
      retreat_longitude:
        separateVenue && data.retreat_longitude?.trim() ? Number(data.retreat_longitude) : null,
      // 비우면 NULL → 채플 반경을 그대로 쓴다
      retreat_attendance_radius_m:
        separateVenue && data.retreat_attendance_radius_m?.trim()
          ? Number(data.retreat_attendance_radius_m)
          : null,
      active_from: data.active_from?.trim() || "",
      active_until: data.active_until?.trim() || "",
    };
  };

  /** 검색 결과 선택 시 장소/좌표/지도 링크를 한 번에 채운다 */
  const handlePlaceSelect = (result: PlaceSearchResult) => {
    setValue("place", result.placeName, { shouldValidate: true });
    setValue("latitude", String(result.latitude), { shouldValidate: true });
    setValue("longitude", String(result.longitude), { shouldValidate: true });
    if (result.placeLink && !watchedValues.place_link?.trim()) {
      setValue("place_link", result.placeLink, { shouldValidate: true });
    }
    setShowPlaceSearch(false);
  };

  /** 지도에서 마커를 옮겼을 때 좌표 입력창에 반영 (소수점 6자리 ≈ 0.1m) */
  const handleMapCoordinateChange = (nextLat: number, nextLng: number) => {
    setValue("latitude", nextLat.toFixed(6), { shouldValidate: true });
    setValue("longitude", nextLng.toFixed(6), { shouldValidate: true });
  };

  /** 리트릿 장소 검색 결과 선택 시 리트릿 장소/좌표/지도 링크를 채운다 */
  const handleRetreatPlaceSelect = (result: PlaceSearchResult) => {
    setValue("retreat_place", result.placeName, { shouldValidate: true });
    setValue("retreat_latitude", String(result.latitude), { shouldValidate: true });
    setValue("retreat_longitude", String(result.longitude), { shouldValidate: true });
    if (result.placeLink && !watchedValues.retreat_place_link?.trim()) {
      setValue("retreat_place_link", result.placeLink, { shouldValidate: true });
    }
    setShowRetreatPlaceSearch(false);
  };

  const handleRetreatMapCoordinateChange = (nextLat: number, nextLng: number) => {
    setValue("retreat_latitude", nextLat.toFixed(6), { shouldValidate: true });
    setValue("retreat_longitude", nextLng.toFixed(6), { shouldValidate: true });
  };

  const parsedLatitude = parseCoordinate(watchedValues.latitude);
  const parsedLongitude = parseCoordinate(watchedValues.longitude);
  const parsedRadius = Number(watchedValues.attendance_radius_m);
  const previewRadius =
    Number.isFinite(parsedRadius) && parsedRadius > 0
      ? parsedRadius
      : DEFAULT_ATTENDANCE_RADIUS_M;
  // 리트릿 반경을 비우면 채플 반경을 따른다
  const parsedRetreatRadius = Number(watchedValues.retreat_attendance_radius_m);
  const retreatPreviewRadius =
    watchedValues.retreat_attendance_radius_m?.trim() &&
    Number.isFinite(parsedRetreatRadius) &&
    parsedRetreatRadius > 0
      ? parsedRetreatRadius
      : previewRadius;

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
              {...register("topic", {
                onChange: () => setTopicEditedManually(true),
              })}
              type="text"
              placeholder="예: 하나님의 사랑"
              disabled={topicUndecided}
              className={errors.topic ? "border-destructive" : ""}
            />
            {!topicUndecided && !topicEditedManually && (
              <p className="text-xs text-muted-foreground">
                채플 일시에 맞춰 자동 입력됩니다. 직접 수정하면 자동 입력이 멈춥니다.
              </p>
            )}
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
            <div className="flex gap-2">
              <Input
                {...register("place")}
                type="text"
                placeholder="예: 넘치는 교회"
                disabled={placeUndecided}
                className={errors.place ? "border-destructive" : ""}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPlaceSearch((prev) => !prev)}
                disabled={placeUndecided}
                className="shrink-0"
              >
                <Search className="h-4 w-4 mr-2" />
                주소 검색
              </Button>
            </div>
            {showPlaceSearch && !placeUndecided && (
              <PlaceSearchDialog
                initialQuery={watchedValues.place ?? ""}
                onSelect={handlePlaceSelect}
              />
            )}
            {errors.place && (
              <p className="text-sm text-destructive">{errors.place.message}</p>
            )}
          </div>

          {/* 좌표 (출석 체크 기준 위치) */}
          <div className="space-y-2">
            <Label>좌표</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Input
                  {...register("latitude")}
                  type="text"
                  inputMode="decimal"
                  placeholder="위도 (예: 37.481234)"
                  className={errors.latitude ? "border-destructive" : ""}
                />
                {errors.latitude && (
                  <p className="text-sm text-destructive">{errors.latitude.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Input
                  {...register("longitude")}
                  type="text"
                  inputMode="decimal"
                  placeholder="경도 (예: 126.952345)"
                  className={errors.longitude ? "border-destructive" : ""}
                />
                {errors.longitude && (
                  <p className="text-sm text-destructive">{errors.longitude.message}</p>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              주소 검색으로 자동 입력되며, 직접 수정할 수도 있습니다.
            </p>
            <KakaoMapPreview
              latitude={parsedLatitude}
              longitude={parsedLongitude}
              radiusM={previewRadius}
              onCoordinateChange={handleMapCoordinateChange}
            />
          </div>

          {/* 출석 가능 반경 */}
          <div className="space-y-2">
            <Label htmlFor="attendance_radius_m">출석 가능 반경 (m)</Label>
            <Input
              {...register("attendance_radius_m")}
              type="number"
              min={1}
              // step은 1이어야 한다. min={1}과 함께면 브라우저가 min 기준으로 유효값을
              // 계산하므로(1, 11, 21 …) step={10}일 때 150 같은 값이 거부된다.
              step={1}
              placeholder={String(DEFAULT_ATTENDANCE_RADIUS_M)}
              className={errors.attendance_radius_m ? "border-destructive" : ""}
            />
            {errors.attendance_radius_m ? (
              <p className="text-sm text-destructive">
                {errors.attendance_radius_m.message}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                비워두면 {DEFAULT_ATTENDANCE_RADIUS_M}m로 저장됩니다.
              </p>
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

          {/* 리트릿 시작 시간 (진행하는 날만) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="retreat_datetime">리트릿 시작 시간</Label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
                <input
                  {...register("retreat_enabled")}
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                />
                리트릿 진행
              </label>
            </div>
            <Input
              {...register("retreat_datetime")}
              type="datetime-local"
              step={60}
              min={datetimeUndecided ? undefined : watchedValues.datetime || undefined}
              disabled={!retreatEnabled}
              className={errors.retreat_datetime ? "border-destructive" : ""}
            />
            {errors.retreat_datetime ? (
              <p className="text-sm text-destructive">{errors.retreat_datetime.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {retreatEnabled
                  ? "채플이 끝난 뒤 시작하는 시간을 입력하세요."
                  : "리트릿을 진행하는 날만 체크하세요. 체크하지 않으면 미진행으로 저장됩니다."}
              </p>
            )}

            {retreatEnabled && (
              <label className="flex items-center gap-2 cursor-pointer text-sm pt-1">
                <input
                  {...register("retreat_venue_separate")}
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                />
                채플과 다른 장소에서 진행
              </label>
            )}
          </div>

          {/* 리트릿 장소 (채플과 다를 때만) */}
          {retreatVenueSeparate && (
            <div className="space-y-6 rounded-lg border p-4">
              <div className="space-y-2">
                <Label htmlFor="retreat_place">리트릿 장소 *</Label>
                <div className="flex gap-2">
                  <Input
                    {...register("retreat_place")}
                    type="text"
                    placeholder="예: 넘치는 교회 소예배실"
                    className={errors.retreat_place ? "border-destructive" : ""}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowRetreatPlaceSearch((prev) => !prev)}
                    className="shrink-0"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    주소 검색
                  </Button>
                </div>
                {showRetreatPlaceSearch && (
                  <PlaceSearchDialog
                    initialQuery={watchedValues.retreat_place ?? ""}
                    onSelect={handleRetreatPlaceSelect}
                  />
                )}
                {errors.retreat_place && (
                  <p className="text-sm text-destructive">{errors.retreat_place.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>리트릿 좌표 *</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Input
                      {...register("retreat_latitude")}
                      type="text"
                      inputMode="decimal"
                      placeholder="위도 (예: 37.481234)"
                      className={errors.retreat_latitude ? "border-destructive" : ""}
                    />
                    {errors.retreat_latitude && (
                      <p className="text-sm text-destructive">{errors.retreat_latitude.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Input
                      {...register("retreat_longitude")}
                      type="text"
                      inputMode="decimal"
                      placeholder="경도 (예: 126.952345)"
                      className={errors.retreat_longitude ? "border-destructive" : ""}
                    />
                    {errors.retreat_longitude && (
                      <p className="text-sm text-destructive">{errors.retreat_longitude.message}</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  리트릿 출석은 이 좌표 기준으로 판정됩니다.
                </p>
                <KakaoMapPreview
                  latitude={parseCoordinate(watchedValues.retreat_latitude)}
                  longitude={parseCoordinate(watchedValues.retreat_longitude)}
                  radiusM={retreatPreviewRadius}
                  onCoordinateChange={handleRetreatMapCoordinateChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="retreat_attendance_radius_m">리트릿 출석 가능 반경 (m)</Label>
                <Input
                  {...register("retreat_attendance_radius_m")}
                  type="number"
                  min={1}
                  step={1}
                  placeholder={String(previewRadius)}
                  className={errors.retreat_attendance_radius_m ? "border-destructive" : ""}
                />
                {errors.retreat_attendance_radius_m ? (
                  <p className="text-sm text-destructive">
                    {errors.retreat_attendance_radius_m.message}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    비워두면 채플 반경({previewRadius}m)을 그대로 씁니다.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="retreat_place_link">리트릿 지도 링크</Label>
                <Input
                  {...register("retreat_place_link")}
                  type="url"
                  placeholder="https://maps.google.com/..."
                  className={errors.retreat_place_link ? "border-destructive" : ""}
                />
                {errors.retreat_place_link && (
                  <p className="text-sm text-destructive">{errors.retreat_place_link.message}</p>
                )}
              </div>
            </div>
          )}

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
              {...register("active_from", {
                onChange: () => setActivePeriodEditedManually(true),
              })}
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
              {...register("active_until", {
                onChange: () => setActivePeriodEditedManually(true),
              })}
              type="date"
              className={errors.active_until ? "border-destructive" : ""}
            />
            {!activePeriodEditedManually && (
              <p className="text-xs text-muted-foreground">
                노출 기간은 채플 일시가 속한 주의 월요일 ~ 금요일로 자동 입력됩니다.
                직접 수정하면 자동 입력이 멈춥니다.
              </p>
            )}
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
