import { NextRequest, NextResponse } from "next/server";
import { adminAuthErrorResponse, authenticateAdmin, getAdminClient } from "@/lib/admin/adminAuth";

// POST /api/admin/upload
// FormData: file (File), bucket (string), path (string, optional)
export async function POST(request: NextRequest) {
  const auth = await authenticateAdmin();
  if (!auth.ok) return adminAuthErrorResponse(auth);

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
  const auth = await authenticateAdmin();
  if (!auth.ok) return adminAuthErrorResponse(auth);

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
