import { NextRequest, NextResponse } from "next/server";
import { adminAuthErrorResponse, authenticateAdmin, getAdminClient } from "@/lib/admin/adminAuth";

/** POST /api/admin/achievement-applications/[id]/review
 * body: { status: "approved" | "rejected" }
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const auth = await authenticateAdmin();
  if (!auth.ok) return adminAuthErrorResponse(auth);

  let body: { status?: string; rejection_reason?: string };
  try {
    body = await _request.json();
  } catch {
    return NextResponse.json(
      { ok: false, reason: "잘못된 요청입니다." },
      { status: 400 }
    );
  }

  const status = body.status;
  if (status !== "approved" && status !== "rejected") {
    return NextResponse.json(
      { ok: false, reason: "status는 approved 또는 rejected여야 합니다." },
      { status: 400 }
    );
  }

  const rejectionReason = body.rejection_reason?.trim();
  if (status === "rejected" && !rejectionReason) {
    return NextResponse.json(
      { ok: false, reason: "거부 시 거부 사유를 입력해 주세요." },
      { status: 400 }
    );
  }

  const adminClient = getAdminClient();
  const updateData: Record<string, unknown> = {
    status,
    reviewed_by: auth.userId,
    reviewed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (status === "rejected") {
    updateData.rejection_reason = rejectionReason;
  } else {
    updateData.rejection_reason = null; // 승인 시 기존 거부 사유 제거
  }

  const { data, error } = await adminClient
    .from("achievement_applications")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, reason: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, data });
}
