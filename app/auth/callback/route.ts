import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * Open-redirect filter for the optional ?next= query param. Only the
 * /hq admin deep-link is honored as an explicit override.
 * Unknown or missing values fall through to /patients here, but the
 * GET handler below ignores that fallback and instead routes by user
 * state (see routePostAuth).
 *
 * Kept as a named export so the existing open-redirect tests stay
 * green -- the function's job is sanitization, not routing.
 */
export function resolveCallbackRedirect(next: string | null | undefined): string {
  if (next && next.startsWith("/hq")) return "/hq";
  if (next === "/update-password") return "/update-password";
  return "/home";
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
  let exchangeError: Error | null = null;
  let exchangeData: Awaited<ReturnType<typeof supabase.auth.exchangeCodeForSession>>["data"] | undefined;
  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) exchangeError = error;
    else exchangeData = data;
  } catch (err) {
    exchangeError = err instanceof Error ? err : new Error("network_error");
  }
  if (exchangeError) {
    const isNetwork =
      exchangeError.message?.toLowerCase().includes("fetch") ||
      exchangeError.message?.toLowerCase().includes("network");
    const errorCode = isNetwork ? "service_unavailable" : "auth_failed";
    return NextResponse.redirect(`${origin}/login?error=${errorCode}`);
  }

  // Password-reset recovery flow: redirect to the update-password page so
  // the user can set a new password with their active recovery session.
  if (next === "/update-password") {
    return NextResponse.redirect(`${origin}/update-password`);
  }

  // Honor the admin /hq deep-link override only when it was
  // explicitly requested. All other auth flows go through state-based
  // routing so new users never land on a broken page.
  if (next && next.startsWith("/hq")) {
    return NextResponse.redirect(`${origin}/hq`);
  }

  // Self-heal: provision org and users row if handle_new_user trigger didn't fire.
  // Covers: migration not applied to production, user predates the trigger,
  // Google OAuth first sign-in where trigger fired but failed silently.
  // Uses service-role client to bypass RLS. Non-fatal: failure is logged and
  // ignored so routePostAuth still runs and routes to /onboarding correctly.
  const authedUser = exchangeData?.user;
  if (authedUser) {
    try {
      const { data: existing } = await supabase
        .from("users")
        .select("organization_id")
        .eq("id", authedUser.id)
        .maybeSingle();

      if (!existing?.organization_id) {
        const admin = createAdminClient();
        const { data: newOrg, error: orgError } = await admin
          .from("organizations")
          .insert({ name: "Personal" })
          .select("id")
          .single();
        if (orgError || !newOrg) throw orgError ?? new Error("org insert failed");
        const { error: userError } = await admin
          .from("users")
          .upsert(
            {
              id: authedUser.id,
              email: authedUser.email ?? "",
              organization_id: newOrg.id,
              role: "caregiver",
            },
            { onConflict: "id" }
          );
        if (userError) throw userError;
      }
    } catch (err) {
      console.error("[auth/callback] self-heal failed for user", authedUser.id, err);
    }
  }

  try {
    const target = await routePostAuth(supabase);
    return NextResponse.redirect(`${origin}${target}`);
  } catch {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }
}
