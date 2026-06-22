/**
 * lib/auth/get-user.ts
 * Single source of truth for user authentication across all API routes.
 * Checks demo session cookie first, then Supabase Auth as legacy fallback.
 * Never throws. Returns null if not authenticated.
 * HIPAA: No PHI. Auth only.
 */
import { cookies } from "next/headers";
import { verifyDemoToken, DEMO_COOKIE } from "./demo-session";
import { verifyToken } from "./verify-token";
import { createClient } from "@/lib/supabase/server";

export interface AuthUser {
  id: string;
  organization_id: string;
  role: string;
  is_demo: boolean;
  auth_method: "demo" | "keycloak" | "supabase_legacy";
  email?: string | null;
}

// _request is accepted but unused -- kept for call-site backward compat during
// migration. All 53 routes call getUserFromRequest(request); removing the param
// would cause 53 TS errors. Routes are migrated individually to drop the arg.
export async function getUserFromRequest(
  _request?: Request
): Promise<AuthUser | null> {
  // CASE 1: Demo session cookie (clarifer_demo_session)
  // Created by POST /api/auth/demo-login after successful Keycloak ROPC auth.
  // Contains the user's actual users.id and organization_id, not the Keycloak sub.
  try {
    const cookieStore = await cookies();
    const demoToken = cookieStore.get(DEMO_COOKIE)?.value;
    if (demoToken) {
      const payload = verifyDemoToken(demoToken);
      if (payload) {
        console.log("[auth] demo", payload.sub.slice(0, 8));
        return {
          id: payload.sub,
          organization_id: payload.org,
          role: "caregiver",
          is_demo: true,
          auth_method: "demo",
          email: "demo@clarifer.com",
        };
      }
    }
  } catch {
    // cookie() access can fail outside request context; fall through
  }

  // CASE 2: Keycloak JWT cookie (clarifer_token)
  // Handles users who authenticated via Keycloak (web and Flutter).
  // Looks up by keycloak_id (indexed, stable) to get the internal users.id.
  try {
    const cookieStore = await cookies();
    const kcToken = cookieStore.get("clarifer_token")?.value;
    if (kcToken) {
      const verified = await verifyToken(kcToken);
      if (verified) {
        const supabase = await createClient();
        const { data: userRecord } = await supabase
          .from("users")
          .select("id, role, organization_id")
          .eq("keycloak_id", verified.id)
          .single();
        if (userRecord?.organization_id) {
          console.log("[auth] keycloak:", userRecord.id.slice(0, 8));
          return {
            id: userRecord.id,
            organization_id: userRecord.organization_id,
            role: userRecord.role ?? verified.role ?? "caregiver",
            is_demo: false,
            email: verified.email,
            auth_method: "keycloak",
          };
        }
      }
    }
  } catch {
    // fall through to supabase_legacy
  }

  // CASE 3: Supabase Auth legacy fallback
  // Handles users who authenticated before the Keycloak migration.
  // Remove when Supabase Auth is decommissioned.
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.log("[auth] no valid session found");
      return null;
    }
    const { data: userRecord } = await supabase
      .from("users")
      .select("role, organization_id")
      .eq("id", user.id)
      .single();
    if (!userRecord?.organization_id) {
      console.log("[auth] user record missing organization_id");
      return null;
    }
    console.warn(
      "[auth] supabase_legacy -- should not happen post-migration"
    );
    return {
      id: user.id,
      organization_id: userRecord.organization_id,
      role: userRecord.role ?? "caregiver",
      is_demo: false,
      auth_method: "supabase_legacy",
      email: user.email ?? null,
    };
  } catch {
    console.log("[auth] no valid session found");
    return null;
  }
}

// Alias used by /api/auth/me -- cookies() works identically without a Request.
export const getUserFromCookies = getUserFromRequest;
