import { NextRequest, NextResponse } from "next/server";
import { extractVideoId, fetchVideoMeta } from "@/lib/chapel-summary/youtube";
import { verifyAdmin } from "@/lib/chapel-summary/auth";

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

export const dynamic = "force-dynamic";

/** 유튜브 링크를 받아 영상 메타데이터(제목/썸네일/길이)를 돌려준다 */
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json(
      { ok: false, reason: "관리자 권한이 필요합니다." },
      { status: 403 }
    );
  }

  const url = request.nextUrl.searchParams.get("url") ?? "";
  const videoId = extractVideoId(url);

  if (!videoId) {
    return NextResponse.json(
      { ok: false, reason: "유튜브 링크를 인식하지 못했습니다." },
      { status: 400 }
    );
  }

  if (!YOUTUBE_API_KEY) {
    return NextResponse.json(
      { ok: false, reason: "YouTube API 키가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const meta = await fetchVideoMeta(videoId, YOUTUBE_API_KEY);
  if (!meta) {
    return NextResponse.json(
      { ok: false, reason: "영상을 찾지 못했습니다. 링크를 확인해 주세요." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, data: meta });
}
