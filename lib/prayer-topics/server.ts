import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type {
  PrayerTopicBoard,
  PrayerTopicChapel,
  PrayerTopicGroup,
  PrayerTopicItem,
} from "./types";

const TOPIC_TABLE = "chapel_prayer_topics";
const CHAPEL_TABLE = "chapels";

/** 기도제목/채플 모두 한 학기 규모라 한 번에 읽어 메모리에서 묶는다 */
const MAX_ROWS = 500;

/** 채플 일시 미정 센티널 연도 (admin ChapelForm 의 DATETIME_UNDECIDED_SENTINEL 과 동일 규칙) */
const UNDECIDED_YEAR_PREFIX = "2099";

const DISTRICT_LABEL = "지구 전체";
const UNKNOWN_CAMPUS_LABEL = "캠퍼스 미지정";

/** DB 함수가 아직 없을 때 쓰는 CAS 폴백의 재시도 횟수 */
const INCREMENT_RETRIES = 8;

/** 중보 카운트를 한 문장으로 올리는 DB 함수 (20260914000000 마이그레이션) */
const INCREMENT_RPC = "increment_chapel_prayer_topic_intercession";

/** 위 함수가 아직 배포되지 않은 DB 를 가리키는 PostgREST 에러 코드 */
const MISSING_FUNCTION_CODES = ["PGRST202", "42883"];

interface TopicRow {
  id: number;
  chapel_id: number;
  scope: "district" | "campus";
  campus: string | null;
  title: string;
  body: string | null;
  sort_order: number;
  intercession_count: number;
}

interface ChapelRow {
  id: number;
  topic: string | null;
  datetime: string | null;
  retreat_datetime: string | null;
}

/**
 * chapel_prayer_topics / chapels 는 RLS 로 잠겨 있어 anon 키로는 한 줄도 읽히지 않는다.
 * 비로그인 방문자도 메인에서 기도제목을 봐야 하므로 서버에서 service role 로 읽어 내려준다.
 */
export function getPrayerTopicClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.");
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.");

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function isUndecided(datetime: string | null): boolean {
  if (!datetime) return true;
  if (datetime.startsWith(UNDECIDED_YEAR_PREFIX)) return true;
  return Number.isNaN(new Date(datetime).getTime());
}

/**
 * 기도제목이 등록된 채플 중 "가장 최근" 한 개를 고른다.
 * 일시 미정(2099 센티널) 채플은 날짜 비교에서 제외하고, 전부 미정이면 최신 id 로 넘어간다.
 */
function pickLatestChapel(chapels: ChapelRow[]): ChapelRow | null {
  if (chapels.length === 0) return null;

  const dated = chapels.filter((chapel) => !isUndecided(chapel.datetime));
  if (dated.length > 0) {
    return dated.reduce((latest, chapel) =>
      new Date(chapel.datetime as string).getTime() >
      new Date(latest.datetime as string).getTime()
        ? chapel
        : latest
    );
  }

  return chapels.reduce((latest, chapel) => (chapel.id > latest.id ? chapel : latest));
}

/** sort_order 기본값이 모두 0일 수 있어 id 로 2차 정렬해 순서를 확정한다 (admin 화면과 동일) */
function toItems(rows: TopicRow[]): PrayerTopicItem[] {
  return [...rows]
    .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
    .map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      intercessionCount: row.intercession_count,
    }));
}

/** 지구 전체 카드를 맨 앞에, 캠퍼스 카드를 가나다순으로 */
function groupTopics(rows: TopicRow[]): PrayerTopicGroup[] {
  const groups: PrayerTopicGroup[] = [];

  const district = rows.filter((row) => row.scope === "district");
  if (district.length > 0) {
    groups.push({ key: "district", label: DISTRICT_LABEL, topics: toItems(district) });
  }

  const byCampus = new Map<string, TopicRow[]>();
  rows
    .filter((row) => row.scope === "campus")
    .forEach((row) => {
      const campus = (row.campus ?? "").trim();
      byCampus.set(campus, [...(byCampus.get(campus) ?? []), row]);
    });

  Array.from(byCampus.entries())
    .sort((a, b) => a[0].localeCompare(b[0], "ko"))
    .forEach(([campus, list]) => {
      groups.push({
        key: `campus:${campus}`,
        label: campus || UNKNOWN_CAMPUS_LABEL,
        topics: toItems(list),
      });
    });

  return groups;
}

function toChapel(row: ChapelRow): PrayerTopicChapel {
  return {
    id: row.id,
    topic: row.topic,
    datetime: isUndecided(row.datetime) ? null : row.datetime,
    retreatDatetime: row.retreat_datetime,
  };
}

/** 가장 최근 채플의 기도제목을 지구/캠퍼스별로 묶어서 돌려준다 */
export async function fetchLatestPrayerTopicBoard(
  client: SupabaseClient
): Promise<PrayerTopicBoard> {
  const { data: topicData, error: topicError } = await client
    .from(TOPIC_TABLE)
    .select("id,chapel_id,scope,campus,title,body,sort_order,intercession_count")
    .order("sort_order", { ascending: true })
    .limit(MAX_ROWS);

  if (topicError) throw new Error(topicError.message);

  const topics = (topicData ?? []) as unknown as TopicRow[];
  if (topics.length === 0) return { chapel: null, groups: [] };

  const chapelIds = Array.from(new Set(topics.map((row) => row.chapel_id)));
  const { data: chapelData, error: chapelError } = await client
    .from(CHAPEL_TABLE)
    .select("id,topic,datetime,retreat_datetime")
    .in("id", chapelIds);

  if (chapelError) throw new Error(chapelError.message);

  const latest = pickLatestChapel((chapelData ?? []) as unknown as ChapelRow[]);
  if (!latest) return { chapel: null, groups: [] };

  return {
    chapel: toChapel(latest),
    groups: groupTopics(topics.filter((row) => row.chapel_id === latest.id)),
  };
}

/** 한 번에 중보를 기록할 수 있는 기도제목 수 (카드 하나에 담기는 규모) */
export const MAX_INCREMENT_BATCH = 50;

export type IncrementResult =
  | { ok: true; intercessionCount: number }
  | { ok: false; reason: string; status: number };

/**
 * 중보 횟수 +1.
 *
 * 리트릿 중에는 여러 명이 같은 순간에 누르므로 원자적으로 올려야 한다.
 * 기본 경로는 DB 함수 한 문장이고, 마이그레이션 전 DB 를 위해 CAS 폴백을 남겨둔다.
 */
export async function incrementIntercession(
  client: SupabaseClient,
  topicId: number
): Promise<IncrementResult> {
  const { data, error } = await client.rpc(INCREMENT_RPC, { p_topic_id: topicId });

  if (!error) {
    if (data === null || data === undefined) {
      return { ok: false, reason: "기도제목을 찾을 수 없습니다.", status: 404 };
    }
    return { ok: true, intercessionCount: data as number };
  }

  if (!MISSING_FUNCTION_CODES.includes(error.code ?? "")) {
    return { ok: false, reason: error.message, status: 500 };
  }

  return incrementByCompareAndSwap(client, topicId);
}

/**
 * DB 함수가 없는 환경용 폴백.
 *
 * 읽은 값을 그대로 조건에 걸어 갱신(compare-and-swap)하므로 클릭이 유실되지는 않지만,
 * 경합이 심하면 재시도를 다 쓰고 실패할 수 있다.
 */
async function incrementByCompareAndSwap(
  client: SupabaseClient,
  topicId: number
): Promise<IncrementResult> {
  for (let attempt = 0; attempt < INCREMENT_RETRIES; attempt += 1) {
    const { data: current, error: readError } = await client
      .from(TOPIC_TABLE)
      .select("id,intercession_count")
      .eq("id", topicId)
      .maybeSingle();

    if (readError) return { ok: false, reason: readError.message, status: 500 };
    if (!current) return { ok: false, reason: "기도제목을 찾을 수 없습니다.", status: 404 };

    const next = (current.intercession_count as number) + 1;
    const { data: updated, error: updateError } = await client
      .from(TOPIC_TABLE)
      // updated_at 은 관리자가 내용을 고친 시각이라 중보 클릭으로는 건드리지 않는다
      .update({ intercession_count: next })
      .eq("id", topicId)
      .eq("intercession_count", current.intercession_count)
      .select("intercession_count")
      .maybeSingle();

    if (updateError) return { ok: false, reason: updateError.message, status: 500 };
    if (updated) return { ok: true, intercessionCount: updated.intercession_count as number };

    // 경합으로 조건이 어긋난 경우 → 조금 흩뜨려 기다렸다가 최신값으로 다시 시도
    await new Promise((resolve) => setTimeout(resolve, 20 + Math.random() * 60));
  }

  return { ok: false, reason: "요청이 몰리고 있어요. 잠시 후 다시 눌러주세요.", status: 409 };
}

export type IncrementManyResult =
  | { ok: true; counts: Record<number, number> }
  | { ok: false; reason: string; status: number };

/**
 * 카드(지구 전체 / 캠퍼스) 하나의 기도제목 전체에 중보 +1.
 *
 * "기도할게요" 버튼이 카드 단위라, 그 카드에 묶인 기도제목을 모두 올린다.
 * 서로 다른 행이라 경합이 없어 병렬로 처리한다.
 */
export async function incrementIntercessionMany(
  client: SupabaseClient,
  topicIds: number[]
): Promise<IncrementManyResult> {
  const results = await Promise.all(
    topicIds.map(async (topicId) => ({
      topicId,
      result: await incrementIntercession(client, topicId),
    }))
  );

  const counts: Record<number, number> = {};
  results.forEach(({ topicId, result }) => {
    if (result.ok) counts[topicId] = result.intercessionCount;
  });

  // 한 건도 못 올렸을 때만 실패로 본다 (일부 실패는 다음 클릭에서 따라잡힌다)
  if (Object.keys(counts).length === 0) {
    const failed = results.find((entry) => !entry.result.ok);
    const reason = failed && !failed.result.ok ? failed.result.reason : "기도를 기록하지 못했습니다.";
    const status = failed && !failed.result.ok ? failed.result.status : 500;
    return { ok: false, reason, status };
  }

  return { ok: true, counts };
}
