import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse, NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Supabase 클라이언트 생성 (세션은 쿠키에서 읽음, 네트워크 요청 없음)
  const supabase = createMiddlewareClient({ req, res });

  // getSession(): 쿠키만 읽어 세션 확인 (토큰 갱신 요청 없음 → 429 방지)
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const { pathname } = req.nextUrl;

  // 🔹 인증이 필요한 페이지 보호 (비로그인 사용자는 접근 불가)
  const isProtectedRoute =
    pathname.startsWith("/admin-page") ||
    pathname.startsWith("/admin-dashboard") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/account");

  if (!user && isProtectedRoute) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
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
  matcher: ["/admin-page/:path*", "/admin-dashboard/:path*", "/register", "/login", "/account/:path*"],
};
