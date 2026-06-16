/**
 * lib/auth/demo-session.ts
 * Demo account session -- bypasses Supabase Auth when it is down.
 * Uses Node built-in crypto for HMAC signing. No new packages.
 * Only works for demo@clarifer.com. Never touches real user auth.
 * Tables: none
 * Auth: hardcoded demo credentials only
 * HIPAA: No PHI.
 */
import { createHmac, timingSafeEqual } from "crypto";

export const DEMO_EMAIL = "demo@clarifer.com";
export const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";
export const DEMO_ORG_ID = "fa731120-304a-48ba-889a-3be6431454f3";
export const DEMO_PATIENT_ID = "5fc76836-e2f7-47b6-a394-ddccef619c95";
export const DEMO_COOKIE = "clarifer_demo_session";

const DEMO_PASSWORD =
  process.env.DEMO_ACCOUNT_PASSWORD ?? "ClariferdDemo2026!";
const SECRET =
  process.env.DEMO_SESSION_SECRET ?? "clarifer-demo-secret-2026-change-me";

export function isDemoAccount(email: string): boolean {
  return email.toLowerCase().trim() === DEMO_EMAIL;
}

export function checkDemoPassword(pw: string): boolean {
  return pw === DEMO_PASSWORD;
}

/** Create a signed token: base64(payload).signature */
export function createDemoToken(): string {
  const payload = Buffer.from(
    JSON.stringify({
      sub: DEMO_USER_ID,
      org: DEMO_ORG_ID,
      pat: DEMO_PATIENT_ID,
      exp: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
    })
  ).toString("base64url");

  const sig = createHmac("sha256", SECRET)
    .update(payload)
    .digest("base64url");

  return `${payload}.${sig}`;
}

/** Verify token. Returns payload or null. */
export function verifyDemoToken(
  token: string
): { sub: string; org: string; pat: string } | null {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return null;

    const expected = createHmac("sha256", SECRET)
      .update(payload)
      .digest("base64url");

    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expBuf)) return null;

    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString()
    );
    if (data.exp < Date.now()) return null;
    return { sub: data.sub, org: data.org, pat: data.pat };
  } catch {
    return null;
  }
}
