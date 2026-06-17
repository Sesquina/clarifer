/**
 * POST /api/auth/demo-login
 * Authenticates demo@clarifer.com against Keycloak via the Resource Owner
 * Password Credentials (ROPC) grant and sets a clarifer_token cookie.
 * Only works when KEYCLOAK_URL, KEYCLOAK_REALM, and KEYCLOAK_CLIENT_ID are set.
 *
 * HIPAA: No PHI in request or response. Token is HttpOnly, Secure, SameSite=Lax.
 */
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ROUTE = 'api/auth/demo-login';

const DEMO_USER = "demo@clarifer.com";
const DEMO_PASS = "ClariferdDemo2026!";
const TOKEN_COOKIE = "clarifer_token";
// 30 minutes — matches Keycloak access token lifespan in the clarifer realm
const COOKIE_MAX_AGE = 30 * 60;

export async function POST(request: Request) {
  const base = process.env.KEYCLOAK_URL;
  const realm = process.env.KEYCLOAK_REALM;
  const clientId = process.env.KEYCLOAK_CLIENT_ID;

  if (!base || !realm || !clientId) {
    return NextResponse.json(
      { error: "Keycloak is not configured on this server." },
      { status: 503 }
    );
  }

  const tokenUrl = `${base}/realms/${realm}/protocol/openid-connect/token`;

  const body = new URLSearchParams({
    grant_type: "password",
    client_id: clientId,
    username: DEMO_USER,
    password: DEMO_PASS,
  });

  let tokenResponse: Response;
  try {
    tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  } catch (error: any) {
    console.error(JSON.stringify({
      route: ROUTE,
      method: request.method,
      error: error?.message ?? String(error),
      code: error?.code ?? null,
      stack: error?.stack?.split('\n').slice(0, 3).join(' | ') ?? null,
      userId: null,
      timestamp: new Date().toISOString(),
      step: 'fetch_keycloak_token',
    }));
    return NextResponse.json(
      { error: "Could not reach Keycloak. Try again shortly." },
      { status: 502 }
    );
  }

  if (!tokenResponse.ok) {
    const detail = await tokenResponse.text().catch(() => "");
    console.error(JSON.stringify({
      route: ROUTE,
      method: request.method,
      error: `Keycloak token endpoint returned ${tokenResponse.status}`,
      code: String(tokenResponse.status),
      stack: null,
      userId: null,
      timestamp: new Date().toISOString(),
      step: 'keycloak_token_response',
      detail: detail.slice(0, 200),
    }));
    return NextResponse.json(
      { error: "Demo login failed. Please try again." },
      { status: 401 }
    );
  }

  let payload: { access_token?: string; expires_in?: number };
  try {
    payload = await tokenResponse.json();
  } catch (error: any) {
    console.error(JSON.stringify({
      route: ROUTE,
      method: request.method,
      error: error?.message ?? String(error),
      code: error?.code ?? null,
      stack: error?.stack?.split('\n').slice(0, 3).join(' | ') ?? null,
      userId: null,
      timestamp: new Date().toISOString(),
      step: 'parse_keycloak_response',
    }));
    return NextResponse.json({ error: "Unexpected response from Keycloak." }, { status: 502 });
  }

  const accessToken = payload.access_token;
  if (!accessToken) {
    console.error(JSON.stringify({
      route: ROUTE,
      method: request.method,
      error: 'No access_token in Keycloak response',
      code: null,
      stack: null,
      userId: null,
      timestamp: new Date().toISOString(),
      step: 'extract_access_token',
    }));
    return NextResponse.json({ error: "No access token returned." }, { status: 502 });
  }

  const maxAge = payload.expires_in ?? COOKIE_MAX_AGE;

  const response = NextResponse.json({ ok: true });
  response.cookies.set(TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  return response;
}
