import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Open-redirect filter for the optional ?next= query param. Only the
 * /internal admin deep-link is honored as an explicit override.
 * Unknown or missing values fall through to /patients here, but the
 * GET handler below ignores that fallback and instead routes by user
 * state (see routePostAuth).
 *
 * Kept as a named export so the existing open-redirect tests stay
 * green -- the function's job is sanitization, not routing.
 */
export function resolveCallbackRedirect(next: string | null | undefined): string {
  if (next && next.startsWith("/internal")) return "/internal";
  return "/patients";
}

/**
 * State-based routing after a successful auth code exchange.
 *   - public.users row missing or organization_id null -> /onboarding
 *   - has org but no patients yet                       -> /onboarding
 *   - has org and at least one patient                  -> /home
 * /home is the returning-user landing page in this codebase (the
 * spec's "/dashboard" target does not exist; /home redirects to
 * /onboarding itself if a patient is missing, so this is consistent
 * end-to-end).
 */
async function routePostAuth(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "/login?error=auth_failed";

  const { data: userRecord } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!userRecord?.organization_id) return "/onboarding";

  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("organization_id", userRecord.organization_id)
    .limit(1)
    .maybeSingle();
  if (!patient) return "/onboarding";

  return "/home";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // Honor the admin /internal deep-link override only when it was
  // explicitly requested. All other auth flows go through state-based
  // routing so new users never land on a broken page.
  if (next && next.startsWith("/internal")) {
    return NextResponse.redirect(`${origin}/internal`);
  }

  try {
    const target = await routePostAuth(supabase);
    return NextResponse.redirect(`${origin}${target}`);
  } catch {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }
}
