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
  createDemoToken,
  DEMO_COOKIE,
  DEMO_COOKIE_MAX_AGE,
} from "@/lib/auth/demo-session";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const DEMO_EMAIL = "demo@clarifer.com";
const DEMO_PASSWORD =
  process.env.DEMO_ACCOUNT_PASSWORD ?? "ClariferdDemo2026!";

// Hardcoded fallback values used when the users table lookup fails.
const FALLBACK_USER_ID = "00000000-0000-0000-0000-000000000001";
const FALLBACK_ORG_ID = "fa731120-304a-48ba-889a-3be6431454f3";

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

  if (
    email.toLowerCase().trim() !== DEMO_EMAIL ||
    password !== DEMO_PASSWORD
  ) {
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

  // Step 3: Look up demo user to get real users.id and organization_id.
  // Step 5: If not found, fall back to hardcoded constants so session always succeeds.
  let userId = FALLBACK_USER_ID;
  let orgId = FALLBACK_ORG_ID;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("users")
      .select("id, organization_id")
      .eq("email", DEMO_EMAIL)
      .limit(1)
      .maybeSingle();

    if (data?.id && data?.organization_id) {
      userId = data.id;
      orgId = data.organization_id;
    } else {
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

  // Step 4: Create demo session cookie -- never fails.
  const token = createDemoToken(userId, orgId);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(DEMO_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DEMO_COOKIE_MAX_AGE,
  });
  return res;
}
