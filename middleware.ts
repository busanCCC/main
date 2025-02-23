import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse, NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Supabase 클라이언트 생성 (각 요청마다 새로운 세션 확인)
  const supabase = createMiddlewareClient({ req, res });

  // 현재 요청에서 사용자 세션을 가져옴
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ✅ 인증이 필요한 페이지 보호 (예: `/dashboard` 접근 제한)
  if (!user && (req.nextUrl.pathname.startsWith("/admin-page") || req.nextUrl.pathname.startsWith("/register"))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return res;
}

// ✅ `matcher`를 사용하여 특정 경로에만 미들웨어 적용 가능
export const config = {
  matcher: ["/admin-page/:path*", "/register/:path*"], // `/admin-page` 이하 모든 경로에서 적용
};
