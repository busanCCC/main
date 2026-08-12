import { NextRequest, NextResponse } from "next/server";
import { verifyInterpretationAdmin } from "@/lib/interpretation/adminAuth";
import * as sessions from "@/lib/interpretation/supabaseSessions";
import type { CreateSessionInput } from "@/lib/interpretation/types";

export async function GET() {
  const auth = await verifyInterpretationAdmin();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, reason: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const data = await sessions.listSessions();
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return NextResponse.json(
      { ok: false, reason: err instanceof Error ? err.message : "세션 목록 조회 실패" },
      { status: 502 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyInterpretationAdmin();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, reason: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as CreateSessionInput;
    const { session, generatedPassword } = await sessions.createSession(body);
    return NextResponse.json({
      ok: true,
      data: {
        id: session.id,
        roomId: session.roomId,
        streamUrl: session.streamUrl,
        status: session.status,
        ...(generatedPassword ? { generatedPassword } : {}),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, reason: err instanceof Error ? err.message : "세션 생성 실패" },
      { status: 502 },
    );
  }
}
