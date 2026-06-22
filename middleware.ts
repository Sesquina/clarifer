import { createRemoteJWKSet, jwtVerify } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { loginLimiter, signupLimiter } from "@/lib/ratelimit";

/**
 * Computes sha256(input) and returns it as a lowercase hex string.
 * Uses the Web Crypto API (available in both Edge and Node.js 18+ runtimes).
 */
async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// 30 minutes — token lifetime is configured in Keycloak realm settings.
// Middleware just validates the JWT; expiry is enforced by jose.
const SESSION_COOKIE = "clarifer_token";

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

let _jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS(): ReturnType<typeof createRemoteJWKSet> | null {
  if (_jwks) return _jwks;
  const base = process.env.KEYCLOAK_URL;
  const realm = process.env.KEYCLOAK_REALM;
  if (!base || !realm) return null;
  try {
    _jwks = createRemoteJWKSet(
      new URL(`${base}/realms/${realm}/protocol/openid-connect/certs`)
    );
  } catch {
    return null;
  }
  return _jwks;
}

async function isValidToken(token: string): Promise<boolean> {
  const jwksSet = getJWKS();
  if (!jwksSet) return false;
  const base = process.env.KEYCLOAK_URL;
  const realm = process.env.KEYCLOAK_REALM;
  if (!base || !realm) return false;
  try {
    await jwtVerify(token, jwksSet, {
      issuer: `${base}/realms/${realm}`,
    });
    return true;
  } catch {
    return false;
  }
}

// /hq is listed as a public route so the Keycloak check is bypassed for it.
// /hq/* pages have their own passcode gate (below).
const publicRoutes = [
  "/",
  "/login",
  "/signup",
  "/auth/callback",
  "/update-password",
  "/privacy",
  "/terms",
  "/about",
  "/security",
  "/ccf",
  "/disclaimer",
  "/data",
  "/waitlist",
  "/promise",
  "/privacy-notice",
  "/hq",
  "/research",
  "/demo",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /hq passcode gate -- protects all /hq/* pages except /hq/login.
  // Validation: cookie "hq_session" must equal sha256(INTERNAL_PASSCODE + "clarifer-hq-salt").
  if (pathname.startsWith("/hq") && pathname !== "/hq/login") {
    const passcode = process.env.INTERNAL_PASSCODE;
    if (!passcode) {
      const url = request.nextUrl.clone();
      url.pathname = "/hq/login";
      return NextResponse.redirect(url);
    }
    const expectedHash = await sha256Hex(passcode + "clarifer-hq-salt");
    const cookieValue = request.cookies.get("hq_session")?.value;
    if (!cookieValue || cookieValue !== expectedHash) {
      const url = request.nextUrl.clone();
      url.pathname = "/hq/login";
      return NextResponse.redirect(url);
    }
  }

  // Rate limit auth endpoints by IP before anything else.
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

  // Determine if this is a public route (no auth required).
  const isPublicRoute = publicRoutes.some(
    (route) =>
      pathname === route ||
      (route !== "/" && pathname.startsWith(route + "/"))
  );

  // Demo session -- clarifer_demo_session is an HMAC-signed cookie set by
  // /api/auth/demo-login. Full HMAC verification happens in getUserFromRequest
  // on every API call; here we only check existence so demo users aren't
  // redirected to /login when their Keycloak JWT expires mid-session.
  // We cannot import verifyDemoToken here (uses createHmac -- Node.js only).
  const hasDemoSession = !!request.cookies
    .get("clarifer_demo_session")
    ?.value?.includes(".");

  // Verify Keycloak JWT from cookie or Authorization header.
  const token =
    request.cookies.get(SESSION_COOKIE)?.value ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  const authenticated =
    hasDemoSession || (token ? await isValidToken(token) : false);

  if (!authenticated && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect already-authenticated users away from login/signup.
  if (authenticated && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.ico|.*\\.webmanifest|.*\\.json|.*\\.txt|\\.well-known|auth|api|monitoring).*)",
  ],
};
