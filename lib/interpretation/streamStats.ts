import { SOURCE_LANGUAGES, TARGET_LANGUAGES } from "./constants";

export type RoomParticipantStats = {
  total: number;
  byLang: Record<string, number>;
};

const STREAM_INTERNAL_URL =
  process.env.CCC_STREAM_INTERNAL_URL ?? "http://localhost:3002";
const INTERNAL_API_KEY =
  process.env.CCC_INTERNAL_API_KEY ?? "dev-internal-key-change-in-production";

function normalizeCounts(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object") return {};

  const counts: Record<string, number> = {};
  for (const [lang, value] of Object.entries(raw as Record<string, unknown>)) {
    const n = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(n) && n >= 0) {
      counts[lang] = Math.round(n);
    }
  }
  return counts;
}

function pickCounts(...candidates: unknown[]): Record<string, number> {
  for (const candidate of candidates) {
    const counts = normalizeCounts(candidate);
    if (Object.keys(counts).length > 0) return counts;
  }
  return {};
}

function statsFromPayload(payload: unknown): RoomParticipantStats | null {
  if (!payload || typeof payload !== "object") return null;
  const body = payload as Record<string, unknown>;

  const nested =
    body.data && typeof body.data === "object"
      ? (body.data as Record<string, unknown>)
      : body;

  const byLang = pickCounts(
    nested.byLang,
    nested.counts,
    nested.participantsByLang,
    nested.languages,
  );

  const explicitTotal =
    typeof nested.total === "number"
      ? nested.total
      : typeof nested.participantCount === "number"
        ? nested.participantCount
        : undefined;

  const total =
    explicitTotal ??
    Object.values(byLang).reduce((sum, count) => sum + count, 0);

  if (Object.keys(byLang).length === 0 && total === 0) {
    return null;
  }

  return { total, byLang };
}

/** monitor/admin WebSocket 메시지에서 참가자 수를 추출한다 */
export function parseStreamPresenceEvent(
  message: unknown,
): RoomParticipantStats | null {
  if (!message || typeof message !== "object") return null;
  const msg = message as Record<string, unknown>;

  if (
    msg.type === "presence" ||
    msg.type === "stats" ||
    msg.type === "room_stats" ||
    msg.type === "participants"
  ) {
    return statsFromPayload(msg);
  }

  return null;
}

export async function fetchRoomParticipantStats(
  roomId: string,
): Promise<RoomParticipantStats | null> {
  const paths = [
    `/internal/sessions/stats?roomId=${encodeURIComponent(roomId)}`,
    `/internal/rooms/${encodeURIComponent(roomId)}/stats`,
  ];

  for (const path of paths) {
    try {
      const res = await fetch(`${STREAM_INTERNAL_URL}${path}`, {
        method: "GET",
        headers: { "X-Internal-Key": INTERNAL_API_KEY },
        cache: "no-store",
      });

      if (!res.ok) continue;

      const json = await res.json();
      const stats = statsFromPayload(json);
      if (stats) return stats;
    } catch {
      // 다음 경로 시도
    }
  }

  return null;
}

export function getLanguageLabel(code: string): string {
  const all = [...TARGET_LANGUAGES, ...SOURCE_LANGUAGES];
  return all.find((item) => item.value === code)?.label ?? code.toUpperCase();
}

export function mergeParticipantCounts(
  targetLanguages: string[],
  ...sources: Array<Record<string, number> | undefined>
): RoomParticipantStats {
  const byLang: Record<string, number> = {};

  for (const lang of targetLanguages) {
    byLang[lang] = 0;
  }

  for (const source of sources) {
    if (!source) continue;
    for (const [lang, count] of Object.entries(source)) {
      byLang[lang] = Math.max(byLang[lang] ?? 0, count);
    }
  }

  const total = Object.values(byLang).reduce((sum, count) => sum + count, 0);
  return { total, byLang };
}
