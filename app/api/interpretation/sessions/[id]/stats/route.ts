import { NextRequest, NextResponse } from "next/server";
import { verifyInterpretationAdmin } from "@/lib/interpretation/adminAuth";
import { fetchRoomParticipantStats } from "@/lib/interpretation/streamStats";
import * as sessions from "@/lib/interpretation/supabaseSessions";

type Params = { params: { id: string } };

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: Params) {
  const auth = await verifyInterpretationAdmin();
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, reason: "관리자 권한이 필요합니다." },
      { status: 403 },
    );
  }

  try {
    const session = await sessions.getSession(params.id);
    if (!session?.roomId) {
      return NextResponse.json(
        { ok: false, reason: "세션 또는 Room ID 가 없습니다." },
        { status: 404 },
      );
    }

    const stats = await fetchRoomParticipantStats(session.roomId);

    return NextResponse.json({
      ok: true,
      data: stats ?? {
        total: 0,
        byLang: Object.fromEntries(
          session.targetLanguages.map((lang) => [lang, 0]),
        ),
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        reason: err instanceof Error ? err.message : "참가자 통계 조회 실패",
      },
      { status: 502 },
    );
  }
}
