import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const CRON_SECRET = process.env.CRON_SECRET;
const YOUTUBE_CHANNEL_ID = "UC7ueCtbLRAmctB0uv3MxAnQ";
// 채널 업로드 재생목록: UC → UU
const UPLOADS_PLAYLIST_ID = "UU7ueCtbLRAmctB0uv3MxAnQ";
const YOUTUBE_PLAYLIST_ITEMS_URL =
  "https://www.googleapis.com/youtube/v3/playlistItems";
const MAX_RETRIES = 2;

async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetch(url, { ...init, cache: "no-store" });
    } catch (err) {
      if (attempt >= retries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw new Error("fetchWithRetry: unreachable");
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
    // Next 14 Data Cache가 supabase GET 응답을 영구 캐시하지 않도록 강제
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

function getNowInKst() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;
  const weekday = parts.find((p) => p.type === "weekday")!.value;

  const dateStr = `${year}-${month}-${day}`;
  return { now, dateStr, weekday };
}

export const dynamic = "force-dynamic";
// Next 14 route handler는 force-dynamic만으로는 fetch 캐시가 꺼지지 않음(GET-only 라우트).
// 캐시되면 매일 같은 YouTube/DB 응답이 재사용되어 이전 영상이 반복 저장된다.
export const fetchCache = "force-no-store";
export const revalidate = 0;

type PlaylistItem = {
  snippet?: {
    title?: string;
    publishedAt?: string;
    resourceId?: { videoId?: string };
    thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
  };
};

/** 제목의 "[11월 6일 풍삶" 같은 날짜가 대상 날짜(YYYY-MM-DD)와 일치하는지 */
function titleMatchesDate(title: string, dateStr: string) {
  const [, m, d] = dateStr.split("-").map(Number);
  const re = /(\d{1,2})\s*월\s*(\d{1,2})\s*일/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(title)) !== null) {
    if (Number(match[1]) === m && Number(match[2]) === d) return true;
  }
  return false;
}

/** 매일 자정 00시(KST) 실행 — 최신 YouTube 영상을 오늘 날짜의 daily_devotions에 매칭 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!CRON_SECRET || token !== CRON_SECRET) {
    return NextResponse.json(
      { ok: false, reason: "unauthorized" },
      { status: 401 }
    );
  }

  if (!YOUTUBE_API_KEY) {
    return NextResponse.json(
      { ok: false, reason: "YouTube API 키가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const { dateStr: todayKst, weekday } = getNowInKst();

  if (weekday.startsWith("일")) {
    return NextResponse.json({
      ok: true,
      skipped: "sunday_kst",
    });
  }

  const adminClient = getAdminClient();

  const { data: existing, error: existingError } = await adminClient
    .from("daily_devotions")
    .select("id, youtube_video_id, youtube_fetched_at")
    .eq("date", todayKst)
    .maybeSingle();

  if (existingError) {
    console.error(
      "[poongsal-daily] existing check error:",
      existingError.message
    );
  }

  // PlaylistItems API로 채널의 최신 업로드 영상 조회 (캐싱 없이 실시간)
  const playlistUrl =
    `${YOUTUBE_PLAYLIST_ITEMS_URL}?` +
    new URLSearchParams({
      part: "snippet",
      playlistId: UPLOADS_PLAYLIST_ID,
      maxResults: "10",
      key: YOUTUBE_API_KEY,
    }).toString();

  const ytRes = await fetchWithRetry(playlistUrl);
  if (!ytRes.ok) {
    const body = await ytRes.text();
    console.error("[poongsal-daily] YouTube PlaylistItems 실패:", body);
    return NextResponse.json(
      { ok: false, reason: "YouTube 조회 실패" },
      { status: 502 }
    );
  }

  const ytData = await ytRes.json();
  const items: PlaylistItem[] = ytData.items ?? [];
  if (items.length === 0) {
    return NextResponse.json({
      ok: true,
      skipped: "no_video",
    });
  }

  // 이미 다른 날짜에 저장된 영상은 제외하고 새 영상만 선택
  const candidateVideoIds = items
    .map((item) => item.snippet?.resourceId?.videoId)
    .filter(Boolean) as string[];

  const { data: alreadyUsed, error: usedError } = await adminClient
    .from("daily_devotions")
    .select("date, youtube_video_id")
    .in("youtube_video_id", candidateVideoIds);

  if (usedError) {
    console.error("[poongsal-daily] used check error:", usedError.message);
    return NextResponse.json(
      { ok: false, reason: "중복 확인 실패" },
      { status: 500 }
    );
  }

  // 오늘 행 자신에 저장된 영상은 "사용됨"으로 보지 않음 (재실행 시 그대로 유지 가능)
  const usedIds = new Set(
    (alreadyUsed ?? [])
      .filter((r: { date: string }) => r.date !== todayKst)
      .map((r: { youtube_video_id: string }) => r.youtube_video_id)
  );
  const isFresh = (item: PlaylistItem) => {
    const vid = item.snippet?.resourceId?.videoId;
    return !!vid && !usedIds.has(vid);
  };

  // 1순위: 제목 날짜가 오늘(KST)과 일치하는 영상, 2순위: 아직 사용되지 않은 최신 영상
  const freshItem =
    items.find(
      (item) => isFresh(item) && titleMatchesDate(item.snippet?.title ?? "", todayKst)
    ) ?? items.find(isFresh);

  if (!freshItem) {
    return NextResponse.json({
      ok: true,
      skipped: "no_new_video",
    });
  }

  const snippet = freshItem.snippet ?? {};
  const videoId = snippet.resourceId?.videoId ?? "";
  const title: string = snippet.title ?? "";
  const publishedAt: string = snippet.publishedAt ?? "";
  const thumbnail: string | undefined =
    snippet.thumbnails?.medium?.url ??
    snippet.thumbnails?.default?.url ??
    undefined;

  if (!videoId || !publishedAt) {
    return NextResponse.json({
      ok: true,
      skipped: "invalid_video_data",
    });
  }

  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  if (!existing) {
    return NextResponse.json({
      ok: true,
      skipped: "no_daily_devotion_for_today",
    });
  }

  const { data: updated, error: updateError } = await adminClient
    .from("daily_devotions")
    .update({
      youtube_channel_id: YOUTUBE_CHANNEL_ID,
      youtube_video_id: videoId,
      youtube_url: youtubeUrl,
      youtube_title: title,
      youtube_thumbnail_url: thumbnail ?? null,
      youtube_published_at: publishedAt,
      youtube_fetched_at: new Date().toISOString(),
    })
    .eq("date", todayKst)
    .select("id")
    .maybeSingle();

  if (updateError) {
    console.error("[poongsal-daily] update error:", updateError.message);
    return NextResponse.json(
      { ok: false, reason: "DB 업데이트 실패" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      id: updated?.id ?? existing.id,
      date: todayKst,
      videoId,
      youtubeUrl,
    },
  });
}
