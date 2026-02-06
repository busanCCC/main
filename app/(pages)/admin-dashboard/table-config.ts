import { z } from "zod";

// --- 매직 넘버 상수화 (Readability) ---
export const ITEMS_PER_PAGE = 20;
export const SEARCH_DEBOUNCE_MS = 300;
export const SIDEBAR_COLLAPSED_WIDTH = 60;
export const SIDEBAR_EXPANDED_WIDTH = 240;
export const TOAST_DURATION_MS = 3000;

// --- 일관된 반환 타입 (Predictability) ---
export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; reason: string };

// --- 필드 설정 타입 ---
export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "date"
  | "url"
  | "enum"
  | "json"
  | "number_array";

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  enumValues?: string[];
  hidden?: boolean;
  readOnly?: boolean;
  placeholder?: string;
}

export interface TableMeta {
  label: string;
  icon: string;
  description: string;
  tableName: string;
  primaryKey: string;
  listColumns: string[];
  searchColumn: string;
  defaultSort: { column: string; ascending: boolean };
  fields: FieldConfig[];
  zodSchema: z.ZodObject<Record<string, z.ZodTypeAny>>;
}

// --- Zod 스키마 정의 (form-level validation, Cohesion) ---

const dailyCurationsSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요."),
  content: z.string().min(1, "내용을 입력해주세요."),
  type: z.enum(["word", "news", "story"], {
    required_error: "유형을 선택해주세요.",
  }),
  date: z.string().optional().default(""),
  link_url: z
    .string()
    .url("올바른 URL을 입력해주세요.")
    .optional()
    .or(z.literal("")),
  reference: z.string().optional().default(""),
  thumbnail_url: z
    .string()
    .url("올바른 URL을 입력해주세요.")
    .optional()
    .or(z.literal("")),
});

const noticesSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요."),
  content: z.string().min(1, "내용을 입력해주세요."),
  category: z.string().min(1, "카테고리를 입력해주세요."),
  images: z.string().optional().default(""),
  is_pinned: z.boolean().optional().default(false),
  published_at: z.string().optional().default(""),
  created_by: z.string().optional().default(""),
});

const recommendedPraisesSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요."),
  description: z.string().optional().default(""),
  external_url: z.string().url("올바른 URL을 입력해주세요."),
  platform: z
    .enum(["youtube", "spotify", "apple_music", "other"])
    .optional()
    .nullable(),
  thumbnail_url: z
    .string()
    .url("올바른 URL을 입력해주세요.")
    .optional()
    .or(z.literal("")),
  is_playlist: z.boolean().optional().default(false),
  order_index: z.coerce.number().optional().nullable(),
});

const weeklyFlowsSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요."),
  description: z.string().min(1, "설명을 입력해주세요."),
  sub_description: z.string().optional().default(""),
  active_from: z.string().optional().default(""),
  active_until: z.string().optional().default(""),
  related_events: z.string().optional().default(""),
  related_notices: z.string().optional().default(""),
  related_praises: z.string().optional().default(""),
});

// --- 테이블 설정 (도메인별 응집) ---

export const tableConfig: Record<string, TableMeta> = {
  daily_curations: {
    label: "일일 큐레이션",
    icon: "BookOpen",
    description: "매일 제공되는 큐레이션 콘텐츠 관리",
    tableName: "daily_curations",
    primaryKey: "id",
    listColumns: ["id", "title", "type", "date", "created_at"],
    searchColumn: "title",
    defaultSort: { column: "created_at", ascending: false },
    fields: [
      { name: "id", label: "ID", type: "number", hidden: true },
      {
        name: "title",
        label: "제목",
        type: "text",
        required: true,
        placeholder: "큐레이션 제목을 입력하세요",
      },
      {
        name: "content",
        label: "내용",
        type: "textarea",
        required: true,
        placeholder: "큐레이션 내용을 입력하세요",
      },
      {
        name: "type",
        label: "유형",
        type: "enum",
        required: true,
        enumValues: ["word", "news", "story"],
      },
      { name: "date", label: "날짜", type: "date" },
      {
        name: "link_url",
        label: "링크 URL",
        type: "url",
        placeholder: "https://",
      },
      {
        name: "reference",
        label: "출처",
        type: "text",
        placeholder: "출처를 입력하세요",
      },
      {
        name: "thumbnail_url",
        label: "썸네일 URL",
        type: "url",
        placeholder: "https://",
      },
      { name: "created_at", label: "생성일", type: "date", readOnly: true },
    ],
    zodSchema: dailyCurationsSchema,
  },
  notices: {
    label: "공지사항",
    icon: "Megaphone",
    description: "앱 내 공지사항 관리",
    tableName: "notices",
    primaryKey: "id",
    listColumns: ["id", "title", "category", "is_pinned", "published_at"],
    searchColumn: "title",
    defaultSort: { column: "created_at", ascending: false },
    fields: [
      { name: "id", label: "ID", type: "number", hidden: true },
      {
        name: "title",
        label: "제목",
        type: "text",
        required: true,
        placeholder: "공지사항 제목을 입력하세요",
      },
      {
        name: "content",
        label: "내용",
        type: "textarea",
        required: true,
        placeholder: "공지사항 내용을 입력하세요",
      },
      {
        name: "category",
        label: "카테고리",
        type: "text",
        required: true,
        placeholder: "카테고리를 입력하세요",
      },
      {
        name: "images",
        label: "이미지",
        type: "json",
        placeholder: 'JSON 형식으로 입력 (예: ["url1", "url2"])',
      },
      { name: "is_pinned", label: "고정 여부", type: "boolean" },
      { name: "published_at", label: "게시일", type: "date" },
      {
        name: "created_by",
        label: "작성자 ID",
        type: "text",
        placeholder: "작성자 UUID",
      },
      { name: "created_at", label: "생성일", type: "date", readOnly: true },
      { name: "updated_at", label: "수정일", type: "date", readOnly: true },
    ],
    zodSchema: noticesSchema,
  },
  recommended_praises: {
    label: "추천 찬양",
    icon: "Music",
    description: "추천 찬양 및 플레이리스트 관리",
    tableName: "recommended_praises",
    primaryKey: "id",
    listColumns: ["id", "title", "platform", "is_playlist", "order_index"],
    searchColumn: "title",
    defaultSort: { column: "order_index", ascending: true },
    fields: [
      { name: "id", label: "ID", type: "number", hidden: true },
      {
        name: "title",
        label: "제목",
        type: "text",
        required: true,
        placeholder: "찬양 제목을 입력하세요",
      },
      {
        name: "description",
        label: "설명",
        type: "textarea",
        placeholder: "찬양에 대한 설명을 입력하세요",
      },
      {
        name: "external_url",
        label: "외부 URL",
        type: "url",
        required: true,
        placeholder: "https://youtube.com/...",
      },
      {
        name: "platform",
        label: "플랫폼",
        type: "enum",
        enumValues: ["youtube", "spotify", "apple_music", "other"],
      },
      {
        name: "thumbnail_url",
        label: "썸네일 URL",
        type: "url",
        placeholder: "https://",
      },
      { name: "is_playlist", label: "플레이리스트 여부", type: "boolean" },
      {
        name: "order_index",
        label: "정렬 순서",
        type: "number",
        placeholder: "0",
      },
      { name: "created_at", label: "생성일", type: "date", readOnly: true },
    ],
    zodSchema: recommendedPraisesSchema,
  },
  weekly_flows: {
    label: "주간 흐름",
    icon: "CalendarDays",
    description: "주간 프로그램 흐름 관리",
    tableName: "weekly_flows",
    primaryKey: "id",
    listColumns: ["id", "title", "active_from", "active_until", "created_at"],
    searchColumn: "title",
    defaultSort: { column: "created_at", ascending: false },
    fields: [
      { name: "id", label: "ID", type: "number", hidden: true },
      {
        name: "title",
        label: "제목",
        type: "text",
        required: true,
        placeholder: "주간 흐름 제목을 입력하세요",
      },
      {
        name: "description",
        label: "설명",
        type: "textarea",
        required: true,
        placeholder: "주간 흐름 설명을 입력하세요",
      },
      {
        name: "sub_description",
        label: "부가 설명",
        type: "textarea",
        placeholder: "추가 설명을 입력하세요",
      },
      { name: "active_from", label: "게시 시작일", type: "date" },
      { name: "active_until", label: "게시 종료일", type: "date" },
      {
        name: "related_events",
        label: "관련 이벤트 ID",
        type: "number_array",
        placeholder: "쉼표로 구분 (예: 1, 2, 3)",
      },
      {
        name: "related_notices",
        label: "관련 공지 ID",
        type: "number_array",
        placeholder: "쉼표로 구분 (예: 1, 2, 3)",
      },
      {
        name: "related_praises",
        label: "관련 찬양 ID",
        type: "number_array",
        placeholder: "쉼표로 구분 (예: 1, 2, 3)",
      },
      { name: "created_at", label: "생성일", type: "date", readOnly: true },
      { name: "updated_at", label: "수정일", type: "date", readOnly: true },
    ],
    zodSchema: weeklyFlowsSchema,
  },
};

// --- 유틸리티 ---

export function getTableMeta(tableName: string): TableMeta | null {
  return tableConfig[tableName] ?? null;
}

export function getValidTableNames(): string[] {
  return Object.keys(tableConfig);
}
