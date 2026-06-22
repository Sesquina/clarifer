/**
 * POST /api/auth/demo-login
 * Authenticates demo@clarifer.com. Tries Keycloak ROPC (5-second timeout),
 * then creates the demo session cookie directly. Works when Keycloak is down.
 * Auth: none (public -- this IS the auth endpoint)
 * Tables: users (read-only, informational lookup)
 * HIPAA: No PHI access. Hardcoded to demo account only.
 */
import { NextResponse } from "next/server";
import {
  isDemoAccount,
  checkDemoPassword,
  createDemoToken,
  DEMO_COOKIE,
} from "@/lib/auth/demo-session";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let email = "",
    password = "";
  try {
    const body = await request.json();
    email = String(body.email ?? "");
    password = String(body.password ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!isDemoAccount(email) || !checkDemoPassword(password)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Step 1-2: Keycloak ROPC -- optional. Skip if env vars absent; fall through on any failure.
  const keycloakUrl = process.env.KEYCLOAK_URL;
  const keycloakRealm = process.env.KEYCLOAK_REALM;
  const keycloakClientId = process.env.KEYCLOAK_CLIENT_ID;

  if (keycloakUrl && keycloakRealm && keycloakClientId) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const kcRes = await fetch(
        `${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "password",
            client_id: keycloakClientId,
            username: email,
            password,
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);
      if (!kcRes.ok) {
        console.warn(
          `[demo-login] Keycloak returned ${kcRes.status} -- falling through to direct session`
        );
      }
    } catch (err) {
      console.warn(
        "[demo-login] Keycloak unreachable:",
        err instanceof Error ? err.message : err,
        "-- falling through to direct session"
      );
    }
  }

  // Step 3-5: Look up demo user. If found, great. If not, createDemoToken() uses
  // hardcoded DEMO_USER_ID / DEMO_ORG_ID as the absolute last fallback -- session
  // creation never fails regardless of DB or Keycloak availability.
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("users")
      .select("id, organization_id")
      .eq("email", "demo@clarifer.com")
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      console.warn(
        "[demo-login] demo user not found in users table -- using hardcoded fallback",
        error?.message
      );
    }
  } catch (err) {
    console.warn(
      "[demo-login] users table lookup failed:",
      err instanceof Error ? err.message : err,
      "-- using hardcoded fallback"
    );
  }

  const token = createDemoToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(DEMO_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });
  return res;
}
