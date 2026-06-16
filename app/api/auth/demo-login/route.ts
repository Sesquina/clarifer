/**
 * POST /api/auth/demo-login
 * Authenticates demo@clarifer.com without Supabase Auth.
 * Auth: none (public — this IS the auth endpoint)
 * Tables: none
 * HIPAA: No PHI access. Hardcoded to demo account only.
 */
import { NextResponse } from "next/server";
import {
  isDemoAccount,
  checkDemoPassword,
  createDemoToken,
  DEMO_COOKIE,
} from "@/lib/auth/demo-session";

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
