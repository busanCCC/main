import { NextRequest, NextResponse } from "next/server";
import * as sessions from "@/lib/interpretation/supabaseSessions";
import { adminAuthErrorResponse, authenticateAdmin } from "@/lib/admin/adminAuth";

type Params = { params: { id: string } };

export async function GET(_request: NextRequest, { params }: Params) {
  const auth = await authenticateAdmin();
  if (!auth.ok) return adminAuthErrorResponse(auth);

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
  const auth = await authenticateAdmin();
  if (!auth.ok) return adminAuthErrorResponse(auth);

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
