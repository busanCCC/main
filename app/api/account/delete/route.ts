import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Service Role Key를 사용하여 계정 삭제
function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.");
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

// 사용자 본인 계정 삭제 요청 처리
export async function POST() {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { ok: false, reason: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  const userId = user.id;
  const adminClient = getServiceRoleClient();

  try {
    // 1. user_info 테이블에서 사용자 정보 삭제 (auth.users FK 제약 해제를 위해 필수)
    const { error: userInfoError } = await adminClient
      .from("user_info")
      .delete()
      .eq("id", userId);

    if (userInfoError) {
      console.error("[account/delete] user_info 삭제 실패:", userInfoError);
      return NextResponse.json(
        {
          ok: false,
          reason: `사용자 정보 삭제 실패: ${userInfoError.message}`,
        },
        { status: 500 }
      );
    }

    // 2. auth.users에서 사용자 삭제
    const { error: deleteError } =
      await adminClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("[account/delete] deleteUser 오류:", deleteError);
      // FK 제약으로 실패 시 안내 메시지
      const isDbError = deleteError.message?.includes("Database error");
      return NextResponse.json(
        {
          ok: false,
          reason: isDbError
            ? "계정 삭제에 실패했습니다. docs/account-delete-fix.sql 마이그레이션을 Supabase SQL Editor에서 실행해 주세요."
            : deleteError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    console.error("[account/delete] 오류:", err);
    return NextResponse.json(
      { ok: false, reason: message },
      { status: 500 }
    );
  }
}
