import { NextResponse } from "next/server";
import * as sessions from "@/lib/interpretation/supabaseSessions";
import { adminAuthErrorResponse, authenticateAdmin } from "@/lib/admin/adminAuth";

type Params = { params: { id: string } };

export async function POST(_request: Request, { params }: Params) {
  const auth = await authenticateAdmin();
  if (!auth.ok) return adminAuthErrorResponse(auth);

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
