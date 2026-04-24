/**
 * POST /api/auth/reset-password
 * Sends a password-reset email via Supabase. Rate-limited per IP.
 * Body: { email: string }
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";
import { resetLimiter } from "@/lib/ratelimit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESET_REDIRECT = "https://clarifer.com/auth/reset-password";

export async function POST(request: Request) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const { success, reset } = await resetLimiter.limit(`ip:${ip}`);
  if (!success) {
    const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return NextResponse.json(
      { error: "Too many password reset attempts. Please wait and try again." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  let email: string;
  try {
    const body = await request.json();
    email = (body.email ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const supabase = await createClient();
  // Supabase returns success even for unknown emails (to avoid account enumeration).
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: RESET_REDIRECT,
  });

  return NextResponse.json({ success: true });
}
