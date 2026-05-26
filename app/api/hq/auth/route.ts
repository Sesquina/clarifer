/**
 * app/api/hq/auth/route.ts
 * Validates the HQ passcode and sets an httpOnly session cookie.
 * Replaces the Google OAuth gate that required a Google account.
 * Tables: none
 * Auth: none (this is the auth entry point)
 * Sprint: fix/hq-rename-and-passcode
 * HIPAA: No PHI. This route handles only the internal dashboard, not patient data.
 *
 * Cookie: hq_session = sha256(INTERNAL_PASSCODE + "clarifer-hq-salt"), httpOnly, 7 days
 * Comparison: uses crypto.timingSafeEqual to prevent timing attacks.
 */
import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";

const SALT = "clarifer-hq-salt";
const COOKIE_NAME = "hq_session";
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

/** Returns the expected cookie value: sha256(passcode + salt) as hex. */
function buildCookieValue(passcode: string): string {
  return createHash("sha256").update(passcode + SALT).digest("hex");
}

export async function POST(request: Request): Promise<Response> {
  const passcode = process.env.INTERNAL_PASSCODE;

  if (!passcode) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  let submitted: string;
  try {
    const body = await request.json();
    submitted = typeof body?.code === "string" ? body.code : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!submitted) {
    return NextResponse.json({ error: "Incorrect access code" }, { status: 401 });
  }

  // Timing-safe comparison. Buffer lengths must match for timingSafeEqual.
  const submittedBuf = Buffer.from(submitted);
  const passcodeBuf = Buffer.from(passcode);
  const lengthsMatch = submittedBuf.length === passcodeBuf.length;
  // Always run timingSafeEqual with same-length buffers to prevent length leaks.
  const compareBuf = lengthsMatch ? passcodeBuf : Buffer.alloc(submittedBuf.length);
  const correct = lengthsMatch && timingSafeEqual(submittedBuf, compareBuf);

  if (!correct) {
    return NextResponse.json({ error: "Incorrect access code" }, { status: 401 });
  }

  // Passcode matched -- set the session cookie.
  const cookieValue = buildCookieValue(passcode);
  const isProduction = process.env.NODE_ENV === "production";

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
  return response;
}
