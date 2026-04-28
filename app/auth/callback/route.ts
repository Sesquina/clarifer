import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Decide where to send the user after a successful OAuth code exchange.
 * Only known prefixes are honored. Unknown or missing values default to
 * /patients so that an attacker cannot use ?next= for open redirects.
 */
export function resolveCallbackRedirect(next: string | null | undefined): string {
  if (next && next.startsWith("/internal")) return "/internal";
  return "/patients";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const target = resolveCallbackRedirect(next);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${target}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
