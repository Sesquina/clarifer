/**
 * lib/auth/demo-session.ts
 * Creates and verifies clarifer_demo_session cookies for demo@clarifer.com.
 * Synchronous HMAC-based token so getUserFromRequest stays non-async in cookie path.
 * Tables: None
 * Auth: Public (utility only)
 * HIPAA: No PHI. Token contains only user ID and organization ID.
 */
import { createHmac, timingSafeEqual } from "crypto";

export const DEMO_COOKIE = "clarifer_demo_session";
export const DEMO_COOKIE_MAX_AGE = 30 * 60; // 30 minutes

interface DemoPayload {
  sub: string;
  org: string;
  exp: number;
}

function getSecret(): Buffer {
  const s = process.env.DEMO_SESSION_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("DEMO_SESSION_SECRET must be set in production");
    }
    // Dev fallback -- never used in production
    return Buffer.from("dev-only-clarifer-demo-secret-not-for-prod-use!!");
  }
  return Buffer.from(s);
}

export function createDemoToken(sub: string, org: string): string {
  const payload: DemoPayload = {
    sub,
    org,
    exp: Math.floor(Date.now() / 1000) + DEMO_COOKIE_MAX_AGE,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", getSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifyDemoToken(
  token: string
): { sub: string; org: string } | null {
  try {
    const dotIndex = token.lastIndexOf(".");
    if (dotIndex === -1) return null;

    const encoded = token.slice(0, dotIndex);
    const sig = token.slice(dotIndex + 1);

    const expected = createHmac("sha256", getSecret())
      .update(encoded)
      .digest("base64url");

    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expected);
    if (
      sigBuf.length !== expectedBuf.length ||
      !timingSafeEqual(sigBuf, expectedBuf)
    ) {
      return null;
    }

    const parsed = JSON.parse(
      Buffer.from(encoded, "base64url").toString()
    ) as DemoPayload;

    if (!parsed.sub || !parsed.org) return null;
    if (parsed.exp < Math.floor(Date.now() / 1000)) return null;

    return { sub: parsed.sub, org: parsed.org };
  } catch (e) {
    console.error("[auth] verifyDemoToken error:", e instanceof Error ? e.message : String(e));
    return null;
  }
}
