import { NextRequest, NextResponse } from "next/server";
import { verifyInterpretationAdmin } from "@/lib/interpretation/adminAuth";
import * as sessions from "@/lib/interpretation/supabaseSessions";

type Params = { params: { id: string } };

export async function GET(_request: NextRequest, { params }: Params) {
  const auth = await verifyInterpretationAdmin();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, reason: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const data = await sessions.getSession(params.id);
    if (!data) {
      return NextResponse.json({ ok: false, reason: "세션이 존재하지 않습니다." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return NextResponse.json(
      { ok: false, reason: err instanceof Error ? err.message : "조회 실패" },
      { status: 502 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await verifyInterpretationAdmin();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, reason: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    await sessions.deleteSession(params.id);
    return NextResponse.json({ ok: true, data: { deleted: true } });
  } catch (err) {
    return NextResponse.json(
      { ok: false, reason: err instanceof Error ? err.message : "삭제 실패" },
      { status: 502 },
    );
  }
}
