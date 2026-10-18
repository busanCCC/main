import { NextRequest, NextResponse } from "next/server";
import { fetchRoomParticipantStats } from "@/lib/interpretation/streamStats";
import * as sessions from "@/lib/interpretation/supabaseSessions";
import { adminAuthErrorResponse, authenticateAdmin } from "@/lib/admin/adminAuth";

type Params = { params: { id: string } };

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: Params) {
  const auth = await authenticateAdmin();
  if (!auth.ok) return adminAuthErrorResponse(auth);

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
