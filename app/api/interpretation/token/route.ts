import { NextResponse } from "next/server";
import { verifyInterpretationAdmin } from "@/lib/interpretation/adminAuth";
import { createCccAdminToken } from "@/lib/interpretation/devToken";
import { CCC_STREAM_URL } from "@/lib/interpretation/constants";

export async function GET() {
  const auth = await verifyInterpretationAdmin();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, reason: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    data: {
      token: createCccAdminToken(auth.userId),
      streamUrl: `${CCC_STREAM_URL}/admin/ws`,
      monitorStreamUrl: `${CCC_STREAM_URL}/client/ws`,
    },
  });
}
