import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  try {
    const response = NextResponse.next();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // ✅ `supabase.auth.getUser()` 호출하여 사용
    const { error } = await supabase.auth.getUser();
    if (error) {
      console.error("Error fetching user:", error);
    } else {
    }
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.next();
  }
};
