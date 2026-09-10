import { SOURCE_LANGUAGES, TARGET_LANGUAGES } from "./constants";

export type RoomParticipantStats = {
  total: number;
  byLang: Record<string, number>;
};

const STREAM_INTERNAL_URL =
  process.env.CCC_STREAM_INTERNAL_URL ?? "http://localhost:3002";
const INTERNAL_API_KEY =
  process.env.CCC_INTERNAL_API_KEY ?? "dev-internal-key-change-in-production";

/** 방 목록에서 이 방을 찾을 때 대조할 식별자 필드 */
const ROOM_ID_FIELDS = ["roomId", "room_id", "id", "room", "name"];
/** 접속자 한 명이 어떤 언어를 듣는지 담고 있을 만한 필드 */
const CLIENT_LANG_FIELDS = ["targetLang", "lang", "language", "targetLanguage"];

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

function pickCounts(...candidates: unknown[]): Record<string, number> | null {
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;
    const counts = normalizeCounts(candidate);
    if (Object.keys(counts).length > 0) return counts;
  }
  return null;
}

/**
 * 접속자 목록을 언어별로 센다.
 *
 * 스트림 서버가 집계된 숫자 대신 소켓 목록을 그대로 내려주는 경우가 있다.
 * 빈 배열은 "아무도 없다" 는 확정된 0 이므로 null 이 아니라 {} 를 돌려준다.
 */
function countsFromClientList(...candidates: unknown[]): Record<
  string,
  number
> | null {
  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;

    const counts: Record<string, number> = {};
    for (const entry of candidate) {
      if (!entry || typeof entry !== "object") continue;
      const rec = entry as Record<string, unknown>;
      const lang = CLIENT_LANG_FIELDS.map((field) => rec[field]).find(
        (value): value is string => typeof value === "string" && value !== "",
      );
      if (!lang) continue;
      counts[lang] = (counts[lang] ?? 0) + 1;
    }
    return counts;
  }
  return null;
}

function pickTotal(source: Record<string, unknown>): number | undefined {
  for (const field of [
    "total",
    // 스트림 서버의 /internal/rooms 는 이 이름으로 총원을 숫자 하나로만 준다
    "participants",
    "participantCount",
    "clientCount",
    "listenerCount",
    "count",
  ]) {
    const value = source[field];
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
      return Math.round(value);
    }
  }
  return undefined;
}

function unwrap(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  const body = payload as Record<string, unknown>;
  const data = body.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  return body;
}

function statsFrom(
  source: Record<string, unknown>,
): { stats: RoomParticipantStats; parsed: boolean } {
  const byLang =
    pickCounts(
      source.byLang,
      source.counts,
      source.participantsByLang,
      source.listenersByLang,
      source.languages,
    ) ??
    countsFromClientList(
      source.clients,
      source.participants,
      source.listeners,
      source.subscribers,
    );

  const explicitTotal = pickTotal(source);
  const summed = byLang
    ? Object.values(byLang).reduce((sum, count) => sum + count, 0)
    : 0;

  return {
    // 언어별 집계가 전체를 다 담지 못할 수 있다 (서버가 모르는 언어 등)
    stats: { total: Math.max(summed, explicitTotal ?? 0), byLang: byLang ?? {} },
    parsed: byLang !== null || explicitTotal !== undefined,
  };
}

/** monitor/admin WebSocket 메시지에서 참가자 수를 추출한다 */
export function parseStreamPresenceEvent(
  message: unknown,
): RoomParticipantStats | null {
  if (!message || typeof message !== "object") return null;
  const msg = message as Record<string, unknown>;

  if (
    msg.type !== "presence" &&
    msg.type !== "stats" &&
    msg.type !== "room_stats" &&
    msg.type !== "participants"
  ) {
    return null;
  }

  const body = unwrap(msg);
  if (!body) return null;

  // presence 이벤트라고 밝힌 이상 0 도 유효한 값이다. 여기서 null 을 돌려주면
  // 마지막으로 잡힌 숫자가 화면에 그대로 굳어 버린다.
  return statsFrom(body).stats;
}

async function fetchInternal(path: string): Promise<unknown | null> {
  try {
    const res = await fetch(`${STREAM_INTERNAL_URL}${path}`, {
      method: "GET",
      headers: { "X-Internal-Key": INTERNAL_API_KEY },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function toRoomList(payload: unknown): Record<string, unknown>[] | null {
  const candidates = [
    payload,
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>).data
      : undefined,
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>).rooms
      : undefined,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter(
        (entry): entry is Record<string, unknown> =>
          !!entry && typeof entry === "object",
      );
    }
  }
  return null;
}

function matchesRoom(entry: Record<string, unknown>, roomId: string): boolean {
  return ROOM_ID_FIELDS.some((field) => entry[field] === roomId);
}

/**
 * 스트림 서버에서 이 방의 실시간 참가자 수를 가져온다.
 *
 * 방 단위 stats 엔드포인트는 서버에 존재하지 않는다 (404). 실제로 있는 것은
 * 방 목록 하나뿐이라 거기서 이 방을 찾아 센다. 예전 경로는 서버가 나중에
 * 붙일 수 있으니 목록을 못 받았을 때만 대체로 시도한다.
 */
export async function fetchRoomParticipantStats(
  roomId: string,
): Promise<RoomParticipantStats | null> {
  const rooms = toRoomList(await fetchInternal("/internal/rooms"));

  if (rooms) {
    const room = rooms.find((entry) => matchesRoom(entry, roomId));
    // 목록에 방이 없으면 스트림 서버가 그 방을 들고 있지 않다는 뜻 — 0 이 맞다
    if (!room) return { total: 0, byLang: {} };

    const { stats, parsed } = statsFrom(room);
    if (parsed) return stats;

    console.warn(
      `[stream-stats] room ${roomId} 에서 참가자 수를 찾지 못했습니다. 응답 필드: ${Object.keys(
        room,
      ).join(", ")}`,
    );
    return stats;
  }

  for (const path of [
    `/internal/sessions/stats?roomId=${encodeURIComponent(roomId)}`,
    `/internal/rooms/${encodeURIComponent(roomId)}/stats`,
  ]) {
    const body = unwrap(await fetchInternal(path));
    if (!body) continue;
    const { stats, parsed } = statsFrom(body);
    if (parsed) return stats;
  }

  return null;
}

export function getLanguageLabel(code: string): string {
  const all = [...TARGET_LANGUAGES, ...SOURCE_LANGUAGES];
  return all.find((item) => item.value === code)?.label ?? code.toUpperCase();
}

/**
 * 내 모니터 소켓 한 자리를 뺀다.
 *
 * 관리자 콘솔은 청취자와 같은 /client/ws 에 붙기 때문에 스트림 서버는 이걸
 * 청취자 한 명으로 센다. 구독 언어는 항상 첫 번째 대상 언어라, 콘솔을 열어둔
 * 것만으로 그 언어에 1 이 얹혀 실제 1명이 2명으로 보였다.
 *
 * 서버가 모니터 소켓을 따로 구분해 주기 전까지의 보정이라, 콘솔을 두 곳에서
 * 열면 나머지 한 자리는 그대로 남는다.
 */
export function excludeSelfFromStats(
  stats: RoomParticipantStats,
  monitorLang: string | string[],
): RoomParticipantStats {
  // 음성 송출을 켜면 언어마다 소켓이 하나씩 더 붙는다. 한 자리만 빼면
  // 참가자 패널이 언어마다 유령을 한 명씩 세운다.
  const langs = Array.isArray(monitorLang) ? monitorLang : [monitorLang];
  const byLang = { ...stats.byLang };
  let removed = 0;

  for (const lang of langs) {
    if ((byLang[lang] ?? 0) > 0) {
      byLang[lang] -= 1;
    }
    removed += 1;
  }

  return { total: Math.max(0, stats.total - removed), byLang };
}

export function mergeParticipantCounts(
  targetLanguages: string[],
  ...sources: Array<RoomParticipantStats | undefined>
): RoomParticipantStats {
  const byLang: Record<string, number> = {};

  for (const lang of targetLanguages) {
    byLang[lang] = 0;
  }

  let reportedTotal = 0;
  for (const source of sources) {
    if (!source) continue;
    for (const [lang, count] of Object.entries(source.byLang)) {
      byLang[lang] = Math.max(byLang[lang] ?? 0, count);
    }
    reportedTotal = Math.max(reportedTotal, source.total);
  }

  const summed = Object.values(byLang).reduce((sum, count) => sum + count, 0);
  return { total: Math.max(summed, reportedTotal), byLang };
}
