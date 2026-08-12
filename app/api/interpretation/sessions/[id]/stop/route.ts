import { NextResponse } from "next/server";
import { verifyInterpretationAdmin } from "@/lib/interpretation/adminAuth";
import * as sessions from "@/lib/interpretation/supabaseSessions";

type Params = { params: { id: string } };

export async function POST(_request: Request, { params }: Params) {
  const auth = await verifyInterpretationAdmin();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, reason: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    await sessions.stopSession(params.id);
    return NextResponse.json({ ok: true, data: { stopped: true } });
  } catch (err) {
    return NextResponse.json(
      { ok: false, reason: err instanceof Error ? err.message : "세션 종료 실패" },
      { status: 502 },
    );
  }
}
