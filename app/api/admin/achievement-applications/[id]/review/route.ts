import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.");
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

async function verifyAdmin(): Promise<{ ok: boolean; userId?: string }> {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false };
  }

  const { data, error } = await supabase
    .from("user_info")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (error || !data?.is_admin) {
    return { ok: false };
  }
  return { ok: true, userId: user.id };
}

/** POST /api/admin/achievement-applications/[id]/review
 * body: { status: "approved" | "rejected" }
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await verifyAdmin();
  if (!auth.ok || !auth.userId) {
    return NextResponse.json(
      { ok: false, reason: "관리자 권한이 필요합니다." },
      { status: 403 }
    );
  }

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
