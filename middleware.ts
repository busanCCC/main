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

  const { pathname } = req.nextUrl;

  // 🔹 인증이 필요한 페이지 보호 (비로그인 사용자는 `/admin-page` 접근 불가)
  if (
    !user &&
    (pathname.startsWith("/admin-page") || pathname.startsWith("/register")) // 임시로 register 페이지 접근 제한
  ) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 🔹 로그인한 사용자가 `/login` 또는 `/register` 페이지에 접근하면 `/admin-page`로 리디렉션
  if (
    user &&
    (pathname.startsWith("/login") || pathname.startsWith("/register"))
  ) {
    return NextResponse.redirect(new URL("/admin-page", req.url));
  }

  return res;
}

// ✅ `matcher`를 사용하여 특정 경로에서만 미들웨어 실행
export const config = {
  matcher: ["/admin-page/:path*", "/register", "/login"],
};
