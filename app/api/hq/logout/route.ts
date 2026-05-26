/**
 * app/api/hq/logout/route.ts
 * Clears the hq_session cookie and redirects to the login page.
 * Called by the "Sign out" link in app/hq/layout.tsx.
 * Tables: none
 * Auth: none required (clearing a cookie is always safe)
 * Sprint: fix/hq-rename-and-passcode
 * HIPAA: No PHI. Internal dashboard only.
 */
import { NextResponse } from "next/server";

const COOKIE_NAME = "hq_session";

export async function GET(request: Request): Promise<Response> {
  const origin = new URL(request.url).origin;
  const response = NextResponse.redirect(`${origin}/hq/login`);
  // Delete the session cookie so the user must re-enter the passcode.
  response.cookies.delete(COOKIE_NAME);
  return response;
}
