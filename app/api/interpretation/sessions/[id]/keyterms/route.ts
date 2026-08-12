import { NextRequest, NextResponse } from "next/server";
import { verifyInterpretationAdmin } from "@/lib/interpretation/adminAuth";
import { normalizeKeyterms } from "@/lib/interpretation/keyterms";
import * as sessions from "@/lib/interpretation/supabaseSessions";

type Params = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await verifyInterpretationAdmin();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, reason: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { keyterms?: unknown };
    const raw = Array.isArray(body.keyterms)
      ? body.keyterms.filter((item): item is string => typeof item === "string")
      : [];
    const session = await sessions.updateSessionKeyterms(params.id, normalizeKeyterms(raw));
    return NextResponse.json({ ok: true, data: session });
  } catch (err) {
    return NextResponse.json(
      { ok: false, reason: err instanceof Error ? err.message : "keyterm 저장 실패" },
      { status: 502 },
    );
  }
}
