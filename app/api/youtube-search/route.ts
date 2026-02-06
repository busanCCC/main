import { NextRequest, NextResponse } from "next/server";

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const MAX_RESULTS = 5;
const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: {
      medium: { url: string };
    };
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const pageToken = searchParams.get("pageToken");

  if (!query || query.trim() === "") {
    return NextResponse.json(
      { ok: false, reason: "검색어를 입력해주세요." },
      { status: 400 }
    );
  }

  if (!YOUTUBE_API_KEY) {
    return NextResponse.json(
      { ok: false, reason: "YouTube API 키가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  let url = `${YOUTUBE_SEARCH_URL}?part=snippet&type=video&maxResults=${MAX_RESULTS}&q=${encodeURIComponent(query.trim())}&key=${YOUTUBE_API_KEY}`;

  if (pageToken) {
    url += `&pageToken=${encodeURIComponent(pageToken)}`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[YouTube API] 검색 실패:", errorBody);
    return NextResponse.json(
      { ok: false, reason: "YouTube 검색에 실패했습니다." },
      { status: 502 }
    );
  }

  const data = await response.json();
  const items = (data.items ?? []) as YouTubeSearchItem[];

  const results = items.map((item) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails.medium.url,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
  }));

  return NextResponse.json({
    ok: true,
    data: results,
    nextPageToken: data.nextPageToken ?? null,
  });
}
