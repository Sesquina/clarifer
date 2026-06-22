/**
 * app/api/auth/logout/route.ts
 * Clears all session cookies and redirects to /login.
 * HIPAA: no PHI.
 */
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest) {
  const response = NextResponse.json({ ok: true }, { status: 200 });
  response.cookies.delete("clarifer_token");
  response.cookies.delete("clarifer_demo_session");
  return response;
}
