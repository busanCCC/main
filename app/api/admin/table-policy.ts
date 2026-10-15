import { z } from "zod";
import {
  tableConfig,
  type FieldConfig,
  type TableMeta,
} from "@/app/(pages)/admin-dashboard/table-config";

// --- 범용 관리자 API(/api/admin)의 서버 측 허용 범위 ---
// 여기에 없는 테이블·작업·컬럼은 요청 단계에서 거부한다.
// 클라이언트 폼 검증(table-config의 zodSchema)은 입력 문자열 기준이므로,
// 서버는 DB에 실제로 저장될 값(변환 후 payload)을 별도로 검증한다.

export type AdminOperation = "list" | "read" | "create" | "update" | "delete";

export interface TablePolicy {
  operations: readonly AdminOperation[];
  sortColumns: readonly string[];
  searchColumns: readonly string[];
  filterColumns: readonly string[];
  /** upsert 허용 시 사용 가능한 onConflict 값 (create + update 권한 필요) */
  upsertConflicts?: readonly string[];
  /** 생성 시 payload 스키마. 수정 시에는 partial() 로 사용 */
  writeSchema: z.AnyZodObject;
}

export const MAX_PAGE_SIZE = 2000;

// --- 공통 값 스키마 ---

/** 정수 PK 또는 UUID PK */
export const recordIdSchema = z.union([
  z.number().int().positive(),
  z
    .string()
    .regex(
      /^(\d+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i,
      "올바르지 않은 ID입니다."
    ),
]);

const isoDatetime = z.string().datetime({ offset: true });
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식이 올바르지 않습니다.");
const dateLike = z.union([dateOnly, isoDatetime]);
const nullableText = z.string().nullable();

// --- table-config 필드 설정 → 저장 값 스키마 ---
// RecordForm.processFormData 의 변환 결과(빈 값 → null)에 맞춘다.

function persistedValueSchema(field: FieldConfig): z.ZodTypeAny {
  switch (field.type) {
    case "number":
      return z.number().finite();
    case "boolean":
      return z.boolean();
    case "enum":
      return z.enum((field.enumValues ?? []) as [string, ...string[]]);
    case "date":
      return dateLike;
    case "datetime":
      return isoDatetime;
    case "url":
      return z.string().url("올바른 URL을 입력해주세요.");
    case "number_array":
      return z.array(z.number().int());
    case "json":
      return z.unknown();
    default:
      return field.required ? z.string().min(1) : z.string();
  }
}

function writeSchemaFromFields(fields: FieldConfig[]): z.AnyZodObject {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    if (field.hidden || field.readOnly) continue;
    const base = persistedValueSchema(field);
    // boolean 은 항상 값이 있으므로 null 을 허용하지 않는다
    shape[field.name] =
      field.required || field.type === "boolean"
        ? base
        : base.nullable().optional();
  }
  return z.object(shape).strict();
}

function policyFromMeta(
  meta: TableMeta,
  overrides: Partial<TablePolicy> = {}
): TablePolicy {
  return {
    operations: meta.hideCreateButton
      ? ["list", "read", "update", "delete"]
      : ["list", "read", "create", "update", "delete"],
    sortColumns: unique(["id", meta.defaultSort.column, ...meta.listColumns]),
    searchColumns: [meta.searchColumn],
    filterColumns: [],
    writeSchema: writeSchemaFromFields(meta.fields),
    ...overrides,
  };
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

// --- 전용 폼을 쓰는 테이블의 저장 값 스키마 ---

const chapelSummariesWriteSchema = z
  .object({
    youtube_video_id: z.string().min(1),
    youtube_url: z.string().url(),
    video_title: nullableText,
    thumbnail_url: nullableText,
    duration_seconds: z.number().int().nonnegative().nullable(),
    chapel_date: dateOnly.nullable(),
    title: z.string().min(1),
    topic: nullableText,
    messenger: nullableText,
    scripture_reference: nullableText,
    scripture_text: nullableText,
    summary: z.string().min(1),
    key_points: z.array(z.string()),
    chapters: z.array(
      z
        .object({ start_seconds: z.number(), title: z.string(), summary: z.string() })
        .passthrough()
    ),
    application_questions: z.array(z.string()),
    action_points: z.array(
      z.object({ title: z.string(), detail: z.string() }).passthrough()
    ),
    transcript: z.array(
      z
        .object({ start_seconds: z.number(), end_seconds: z.number(), text: z.string() })
        .passthrough()
    ),
    status: z.enum(["draft", "published"]),
  })
  .strict();

// 신청 생성은 사용자 측 기능이므로 관리자는 심사 관련 컬럼만 수정할 수 있다
const achievementApplicationsWriteSchema = z
  .object({
    status: z.enum(["pending", "approved", "rejected"]),
    reviewed_by: z.string().uuid().nullable(),
    reviewed_at: isoDatetime.nullable(),
    updated_at: isoDatetime,
    rejection_reason: nullableText,
  })
  .strict();

const chapelPrayerTopicsWriteSchema = z
  .object({
    chapel_id: z.number().int().positive(),
    scope: z.enum(["district", "campus"]),
    campus: nullableText,
    title: z.string().min(1),
    body: nullableText,
    sort_order: z.number().int(),
    updated_at: isoDatetime,
  })
  .strict();

const summerConferencePrayerTopicsWriteSchema = z
  .object({
    prayer_date: dateOnly,
    title: z.string().min(1),
    description: nullableText,
    verse: nullableText,
    verse_ref: nullableText,
    items: z.array(z.string()),
  })
  .strict();

const conferenceNoticesWriteSchema = z
  .object({
    title: z.string().min(1),
    content: z.string(),
    published_at: isoDatetime,
    is_pinned: z.boolean(),
  })
  .strict();

const contestEntriesWriteSchema = z
  .object({
    campus: z.string().min(1),
    creator_name: nullableText,
    image_url: z.string().url(),
    title: nullableText,
    year: z.number().int().nullable(),
  })
  .strict();

const sportsTournamentsWriteSchema = z
  .object({
    name: z.string().min(1),
    badge: z.string(),
    accent_color: z.string().regex(/^#[0-9a-f]{3,8}$/i),
    sort_order: z.number().int(),
    year: z.number().int(),
  })
  .strict();

const sportsMatchesWriteSchema = z
  .object({
    tournament_id: recordIdSchema,
    match_number: z.number().int(),
    next_match_id: z.number().int().nullable(),
    name: nullableText,
    tournament_round_text: nullableText,
    start_time: z.string(),
    state: z.enum(["NO_PARTY", "SCORE_DONE", "PLAYED"]),
  })
  .strict();

const sportsParticipantsWriteSchema = z
  .object({
    match_id: recordIdSchema,
    slot: z.number().int().min(1).max(2),
    name: z.string(),
    result_text: nullableText,
    is_winner: z.boolean(),
    status: z.enum(["PLAYED", "NO_SHOW", "WALK_OVER", "NO_PARTY"]).nullable(),
  })
  .strict();

const WRITE_OPERATIONS: AdminOperation[] = ["list", "create", "update", "delete"];

// --- 테이블별 정책 ---

const tablePolicies: Record<string, TablePolicy> = {
  daily_curations: policyFromMeta(tableConfig.daily_curations),
  daily_devotions: policyFromMeta(tableConfig.daily_devotions),
  notices: policyFromMeta(tableConfig.notices),
  recommended_praises: policyFromMeta(tableConfig.recommended_praises),
  weekly_flows: policyFromMeta(tableConfig.weekly_flows),
  chapels: policyFromMeta(tableConfig.chapels),
  chapel_summaries: policyFromMeta(tableConfig.chapel_summaries, {
    writeSchema: chapelSummariesWriteSchema,
  }),
  achievement_applications: policyFromMeta(tableConfig.achievement_applications, {
    writeSchema: achievementApplicationsWriteSchema,
  }),

  // 전용 관리 화면 (retreat-prayer, summer-retreat, SportsTournamentManager)
  chapel_prayer_topics: {
    operations: WRITE_OPERATIONS,
    sortColumns: ["id", "sort_order"],
    searchColumns: [],
    filterColumns: ["scope", "chapel_id"],
    writeSchema: chapelPrayerTopicsWriteSchema,
  },
  summer_conference_prayer_topics: {
    operations: WRITE_OPERATIONS,
    sortColumns: ["id", "prayer_date"],
    searchColumns: [],
    filterColumns: [],
    writeSchema: summerConferencePrayerTopicsWriteSchema,
  },
  conference_notices: {
    operations: WRITE_OPERATIONS,
    sortColumns: ["id", "published_at"],
    searchColumns: [],
    filterColumns: [],
    writeSchema: conferenceNoticesWriteSchema,
  },
  contest_entries: {
    operations: WRITE_OPERATIONS,
    sortColumns: ["id", "created_at"],
    searchColumns: [],
    filterColumns: [],
    writeSchema: contestEntriesWriteSchema,
  },
  sports_tournaments: {
    operations: WRITE_OPERATIONS,
    sortColumns: ["id", "sort_order"],
    searchColumns: [],
    filterColumns: [],
    writeSchema: sportsTournamentsWriteSchema,
  },
  sports_matches: {
    operations: WRITE_OPERATIONS,
    sortColumns: ["id", "match_number"],
    searchColumns: [],
    filterColumns: [],
    upsertConflicts: ["tournament_id,match_number"],
    writeSchema: sportsMatchesWriteSchema,
  },
  sports_participants: {
    operations: WRITE_OPERATIONS,
    sortColumns: ["id", "slot"],
    searchColumns: [],
    filterColumns: [],
    upsertConflicts: ["match_id,slot"],
    writeSchema: sportsParticipantsWriteSchema,
  },
};

export function getTablePolicy(table: unknown): TablePolicy | null {
  if (typeof table !== "string") return null;
  return Object.prototype.hasOwnProperty.call(tablePolicies, table)
    ? tablePolicies[table]
    : null;
}

export function canPerform(policy: TablePolicy, operation: AdminOperation): boolean {
  return policy.operations.includes(operation);
}

/** Zod 오류를 "필드: 메시지" 형태의 한 줄로 요약 */
export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join(", ");
}
