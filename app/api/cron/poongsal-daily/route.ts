import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const CRON_SECRET = process.env.CRON_SECRET;
const YOUTUBE_CHANNEL_ID = "UC7ueCtbLRAmctB0uv3MxAnQ";
const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.");
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function getNowInKst() {
  const now = new Date();
  // UTC → KST(+9)을 직접 더해도 되지만, 여기선 Intl로 날짜 문자열만 뽑습니다.
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
  const weekday = parts.find((p) => p.type === "weekday")!.value; // 예: 일, 월, ...

  const dateStr = `${year}-${month}-${day}`; // YYYY-MM-DD
  return { now, dateStr, weekday };
}

function getKstDateFromIso(iso: string): string {
  const date = new Date(iso);
  const formatter = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;
  return `${year}-${month}-${day}`;
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // 1) 크론 보안 체크
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

  // 2) KST 기준 오늘 날짜/요일
  const { dateStr: todayKst, weekday } = getNowInKst();

  // 일요일(주일) 스킵 (예: "일")
  if (weekday.startsWith("일")) {
    return NextResponse.json({
      ok: true,
      skipped: "sunday_kst",
    });
  }

  const adminClient = getAdminClient();

  // 3) 이미 오늘 daily_devotions + youtube_* 가 채워져 있으면 바로 종료 (early-exit)
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

  if (existing?.youtube_video_id) {
    // 이미 오늘 영상이 저장되어 있으면 이후 크론 실행에서는 바로 종료
    return NextResponse.json({
      ok: true,
      skipped: "already_saved_today",
    });
  }

  // 4) YouTube 최신 영상 1개 조회
  const searchUrl =
    `${YOUTUBE_SEARCH_URL}?` +
    new URLSearchParams({
      part: "snippet",
      channelId: YOUTUBE_CHANNEL_ID,
      order: "date",
      maxResults: "1",
      type: "video",
      key: YOUTUBE_API_KEY,
    }).toString();

  const ytRes = await fetch(searchUrl);
  if (!ytRes.ok) {
    const body = await ytRes.text();
    console.error("[poongsal-daily] YouTube 검색 실패:", body);
    return NextResponse.json(
      { ok: false, reason: "YouTube 검색 실패" },
      { status: 502 }
    );
  }

  const ytData = await ytRes.json();
  const item = (ytData.items ?? [])[0];
  if (!item) {
    return NextResponse.json({
      ok: true,
      skipped: "no_video",
    });
  }

  const videoId: string | undefined = item.id?.videoId;
  const snippet = item.snippet ?? {};
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

  // 전날 저녁(22시~24시) 업로드된 영상이 “오늘” 풍삶이므로, 최신 영상 1개를 오늘 날짜(todayKst)에 저장
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // 5) 해당 날짜의 daily_devotions가 있을 때만 UPDATE (없으면 스킵)
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
      // updated_at 트리거가 있으므로 별도 처리 불필요
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

