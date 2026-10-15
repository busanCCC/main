import { NextResponse } from "next/server";
import { createCccAdminToken } from "@/lib/interpretation/devToken";
import { CCC_STREAM_URL } from "@/lib/interpretation/constants";
import { adminAuthErrorResponse, authenticateAdmin } from "@/lib/admin/adminAuth";

export async function GET() {
  const auth = await authenticateAdmin();
  if (!auth.ok) return adminAuthErrorResponse(auth);

  return NextResponse.json({
    ok: true,
    data: {
      token: createCccAdminToken(auth.userId),
      streamUrl: `${CCC_STREAM_URL}/admin/ws`,
      monitorStreamUrl: `${CCC_STREAM_URL}/client/ws`,
    },
  });
}
