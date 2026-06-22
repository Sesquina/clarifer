/**
 * POST /api/auth/demo-login
 * Authenticates demo@clarifer.com against Keycloak via the Resource Owner
 * Password Credentials (ROPC) grant, looks up the demo user in the users table,
 * and sets a clarifer_demo_session cookie that getUserFromRequest() reads first.
 * Only works when KEYCLOAK_URL, KEYCLOAK_REALM, and KEYCLOAK_CLIENT_ID are set.
 *
 * HIPAA: No PHI in request or response. Cookies are HttpOnly, Secure, SameSite=Lax.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createDemoToken,
  DEMO_COOKIE,
  DEMO_COOKIE_MAX_AGE,
} from "@/lib/auth/demo-session";

export const runtime = "nodejs";

const ROUTE = "api/auth/demo-login";

const DEMO_USER = "demo@clarifer.com";
const DEMO_PASS = "ClariferdDemo2026!";
const LEGACY_TOKEN_COOKIE = "clarifer_token";

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
    console.error(
      JSON.stringify({
        route: ROUTE,
        method: request.method,
        error: error?.message ?? String(error),
        code: error?.code ?? null,
        stack: error?.stack?.split("\n").slice(0, 3).join(" | ") ?? null,
        userId: null,
        timestamp: new Date().toISOString(),
        step: "fetch_keycloak_token",
      })
    );
    return NextResponse.json(
      { error: "Could not reach Keycloak. Try again shortly." },
      { status: 502 }
    );
  }

  if (!tokenResponse.ok) {
    const detail = await tokenResponse.text().catch(() => "");
    console.error(
      JSON.stringify({
        route: ROUTE,
        method: request.method,
        error: `Keycloak token endpoint returned ${tokenResponse.status}`,
        code: String(tokenResponse.status),
        stack: null,
        userId: null,
        timestamp: new Date().toISOString(),
        step: "keycloak_token_response",
        detail: detail.slice(0, 200),
      })
    );
    return NextResponse.json(
      { error: "Demo login failed. Please try again." },
      { status: 401 }
    );
  }

  let kcPayload: { access_token?: string; expires_in?: number };
  try {
    kcPayload = await tokenResponse.json();
  } catch (error: any) {
    console.error(
      JSON.stringify({
        route: ROUTE,
        method: request.method,
        error: error?.message ?? String(error),
        code: error?.code ?? null,
        stack: error?.stack?.split("\n").slice(0, 3).join(" | ") ?? null,
        userId: null,
        timestamp: new Date().toISOString(),
        step: "parse_keycloak_response",
      })
    );
    return NextResponse.json(
      { error: "Unexpected response from Keycloak." },
      { status: 502 }
    );
  }

  const accessToken = kcPayload.access_token;
  if (!accessToken) {
    console.error(
      JSON.stringify({
        route: ROUTE,
        method: request.method,
        error: "No access_token in Keycloak response",
        code: null,
        stack: null,
        userId: null,
        timestamp: new Date().toISOString(),
        step: "extract_access_token",
      })
    );
    return NextResponse.json(
      { error: "No access token returned." },
      { status: 502 }
    );
  }

  // Look up the demo user in the users table by email to get their actual
  // users.id and organization_id. The Keycloak sub != the Supabase Auth UUID
  // that lives in users.id, so we must look up by email.
  let userId: string;
  let organizationId: string;
  try {
    const supabase = await createClient();
    const { data: userRow } = await supabase
      .from("users")
      .select("id, organization_id")
      .eq("email", DEMO_USER)
      .single();

    if (!userRow?.id || !userRow?.organization_id) {
      console.error(
        JSON.stringify({
          route: ROUTE,
          method: request.method,
          error: "Demo user not found in users table",
          code: null,
          stack: null,
          userId: null,
          timestamp: new Date().toISOString(),
          step: "lookup_demo_user",
        })
      );
      return NextResponse.json(
        { error: "Demo user not provisioned. Contact support." },
        { status: 503 }
      );
    }

    userId = userRow.id;
    organizationId = userRow.organization_id;
  } catch (error: any) {
    console.error(
      JSON.stringify({
        route: ROUTE,
        method: request.method,
        error: error?.message ?? String(error),
        code: error?.code ?? null,
        stack: error?.stack?.split("\n").slice(0, 3).join(" | ") ?? null,
        userId: null,
        timestamp: new Date().toISOString(),
        step: "lookup_demo_user",
      })
    );
    return NextResponse.json(
      { error: "Could not verify demo account. Try again shortly." },
      { status: 503 }
    );
  }

  // Create a clarifer_demo_session token containing the real users.id and
  // organization_id. getUserFromRequest() checks this cookie first on every request.
  let demoSessionToken: string;
  try {
    demoSessionToken = createDemoToken(userId, organizationId);
  } catch (error: any) {
    console.error(
      JSON.stringify({
        route: ROUTE,
        method: request.method,
        error: error?.message ?? String(error),
        code: error?.code ?? null,
        stack: null,
        userId,
        timestamp: new Date().toISOString(),
        step: "create_demo_token",
      })
    );
    return NextResponse.json(
      { error: "Could not create demo session." },
      { status: 500 }
    );
  }

  const maxAge = kcPayload.expires_in ?? DEMO_COOKIE_MAX_AGE;

  const response = NextResponse.json({ ok: true });

  // Primary session cookie for API route auth (getUserFromRequest Case 1)
  response.cookies.set(DEMO_COOKIE, demoSessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: DEMO_COOKIE_MAX_AGE,
  });

  // Legacy Keycloak JWT cookie -- kept for any code still reading clarifer_token
  response.cookies.set(LEGACY_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  console.log("[auth] demo-login success", userId.slice(0, 8));
  return response;
}
