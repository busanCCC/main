export const CCC_API_URL =
  process.env.CCC_API_URL ?? process.env.NEXT_PUBLIC_CCC_API_URL ?? "http://localhost:3001";

export const CCC_STREAM_URL =
  process.env.NEXT_PUBLIC_CCC_STREAM_URL ?? "ws://localhost:3002";

export const CCC_JWT_SECRET =
  process.env.CCC_JWT_SECRET ?? "dev-jwt-secret-for-local-testing-only";

export const CCC_ADMIN_USER_ID =
  process.env.CCC_ADMIN_USER_ID ?? "00000000-0000-0000-0000-000000000001";

export const SOURCE_LANGUAGES = [
  { value: "ko", label: "한국어" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
  { value: "zh", label: "中文" },
  { value: "ru", label: "Русский" },
  { value: "vi", label: "Tiếng Việt" },
] as const;

export const TARGET_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
  { value: "zh", label: "中文" },
  { value: "ko", label: "한국어" },
  { value: "ru", label: "Русский" },
  { value: "vi", label: "Tiếng Việt" },
] as const;

export const AUDIO_CHUNK_INTERVAL_MS = 200;
export const PCM_SAMPLE_RATE = 16000;
