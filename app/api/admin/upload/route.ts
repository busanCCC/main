import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.");
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

async function verifyAdmin(): Promise<boolean> {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) return false;

  const adminClient = getAdminClient();
  const { data, error } = await adminClient
    .from("user_info")
    .select("is_admin")
    .eq("id", userId)
    .single();

  return !error && data?.is_admin === true;
}

// POST /api/admin/upload
// FormData: file (File), bucket (string), path (string, optional)
export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { ok: false, reason: "관리자 권한이 필요합니다." },
      { status: 403 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const bucket = (formData.get("bucket") as string | null) ?? "contest-entries";
  const customPath = formData.get("path") as string | null;

  if (!file) {
    return NextResponse.json(
      { ok: false, reason: "파일이 없습니다." },
      { status: 400 }
    );
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const filePath = customPath ?? `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const adminClient = getAdminClient();
  const { error } = await adminClient.storage
    .from(bucket)
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ ok: false, reason: error.message });
  }

  const { data: urlData } = adminClient.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return NextResponse.json({ ok: true, data: { url: urlData.publicUrl, path: filePath } });
}

// DELETE /api/admin/upload?bucket=...&path=...
export async function DELETE(request: NextRequest) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { ok: false, reason: "관리자 권한이 필요합니다." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const bucket = searchParams.get("bucket") ?? "contest-entries";
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json(
      { ok: false, reason: "삭제할 파일 경로가 필요합니다." },
      { status: 400 }
    );
  }

  const adminClient = getAdminClient();
  const { error } = await adminClient.storage.from(bucket).remove([path]);

  if (error) {
    return NextResponse.json({ ok: false, reason: error.message });
  }

  return NextResponse.json({ ok: true, data: null });
}
