/** 유튜브 링크에서 videoId 를 뽑고, 영상 메타데이터를 가져오는 유틸 */

const YOUTUBE_VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos";
const VIDEO_ID_LENGTH = 11;

export interface YouTubeVideoMeta {
  videoId: string;
  url: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  durationSeconds: number;
  publishedAt: string;
}

/**
 * 운영진이 붙여넣는 여러 형태의 링크에서 videoId 를 뽑는다.
 * watch?v=, youtu.be/, /live/, /embed/, /shorts/, 그리고 videoId 자체를 받는다.
 */
export function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 링크가 아니라 videoId 를 그대로 넣은 경우
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;

  let url: URL;
  try {
    url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return id.length === VIDEO_ID_LENGTH ? id : null;
  }

  if (host !== "youtube.com" && host !== "m.youtube.com" && host !== "music.youtube.com") {
    return null;
  }

  const queryId = url.searchParams.get("v");
  if (queryId && queryId.length === VIDEO_ID_LENGTH) return queryId;

  const pathMatch = url.pathname.match(/\/(?:live|embed|shorts|v)\/([\w-]{11})/);
  return pathMatch ? pathMatch[1] : null;
}

/** "PT1H2M30S" → 3750 */
export function parseIso8601Duration(value: string): number {
  const match = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return 0;

  const [, hours, minutes, seconds] = match;
  return (
    Number(hours ?? 0) * 3600 + Number(minutes ?? 0) * 60 + Number(seconds ?? 0)
  );
}

interface YouTubeVideoItem {
  id: string;
  snippet: {
    title: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: Record<string, { url: string } | undefined>;
  };
  contentDetails: { duration: string };
}

/** 썸네일은 큰 것부터 있는 대로 고른다 */
function pickThumbnail(
  thumbnails: Record<string, { url: string } | undefined>
): string {
  const preferred = ["maxres", "standard", "high", "medium", "default"];
  for (const key of preferred) {
    const found = thumbnails[key];
    if (found?.url) return found.url;
  }
  return "";
}

export async function fetchVideoMeta(
  videoId: string,
  apiKey: string
): Promise<YouTubeVideoMeta | null> {
  const url = `${YOUTUBE_VIDEOS_URL}?part=snippet,contentDetails&id=${encodeURIComponent(videoId)}&key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    console.error("[YouTube API] 영상 조회 실패:", await response.text());
    return null;
  }

  const data = (await response.json()) as { items?: YouTubeVideoItem[] };
  const item = data.items?.[0];
  if (!item) return null;

  return {
    videoId: item.id,
    url: `https://www.youtube.com/watch?v=${item.id}`,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    thumbnailUrl: pickThumbnail(item.snippet.thumbnails),
    durationSeconds: parseIso8601Duration(item.contentDetails.duration),
    publishedAt: item.snippet.publishedAt,
  };
}
