import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { loginLimiter, signupLimiter } from "@/lib/ratelimit";

// 30 minutes of inactivity → force re-authentication
const SESSION_TIMEOUT_SECONDS = 30 * 60;
const SESSION_COOKIE = "cf_last_activity";

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limit auth endpoints by IP before anything else.
  // 5 per 15 min on /login; 3 per hour on /signup (defined in lib/ratelimit.ts).
  if (pathname === "/login" && request.method === "POST") {
    const ip = getClientIp(request);
    const { success, reset } = await loginLimiter.limit(`ip:${ip}`);
    if (!success) {
      const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
      return NextResponse.json(
        { error: "Too many login attempts. Please wait before trying again." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }
  }
  if (pathname === "/signup" && request.method === "POST") {
    const ip = getClientIp(request);
    const { success, reset } = await signupLimiter.limit(`ip:${ip}`);
    if (!success) {
      const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
      return NextResponse.json(
        { error: "Too many signup attempts. Please wait before trying again." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const publicRoutes = ["/", "/login", "/signup", "/auth/callback", "/privacy", "/terms", "/about", "/security"];
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || (route !== "/" && pathname.startsWith(route))
  );

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Session inactivity timeout (30 min).
  // Uses an HTTP-only cookie carrying the last-activity timestamp.
  if (user) {
    const now = Math.floor(Date.now() / 1000);
    const lastActivityRaw = request.cookies.get(SESSION_COOKIE)?.value;
    const lastActivity = lastActivityRaw ? parseInt(lastActivityRaw, 10) : 0;

    if (lastActivity && now - lastActivity > SESSION_TIMEOUT_SECONDS) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("reason", "session_timeout");
      const redirect = NextResponse.redirect(url);
      redirect.cookies.delete(SESSION_COOKIE);
      return redirect;
    }

    supabaseResponse.cookies.set(SESSION_COOKIE, String(now), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TIMEOUT_SECONDS,
    });
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.json|\\.well-known|auth|api|monitoring).*)",
  ],
};
