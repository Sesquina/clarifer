/**
 * GET /api/auth/callback
 * Handles Supabase Auth email verification and OAuth redirect.
 * After exchanging the code for a session, redirects to:
 *   - /home (existing users)
 *   - /onboarding/role-select (new users without a role set)
 *
 * Used by: magic link, email verification, OAuth providers.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/home";

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/error?reason=no_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/error?reason=${encodeURIComponent(error.message)}`
    );
  }

  // Check if the user has a role assigned; if not, redirect to role selection
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: userRecord } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!userRecord?.role) {
      return NextResponse.redirect(`${origin}/onboarding/role-select`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
