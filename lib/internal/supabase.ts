import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { isAllowedEmail } from "@/lib/internal/types";
import type { Database } from "@/lib/supabase/types";

let cached: SupabaseClient<Database> | null = null;

export function internalSupabase(): SupabaseClient<Database> {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "internalSupabase requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  cached = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export function checkInternalAuth(authHeader: string | null): boolean {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) return false;
  if (!authHeader) return false;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;
  return timingSafeEquals(match[1], secret);
}

export async function getInternalSessionEmail(): Promise<string | null> {
  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase.auth.getUser();
    return data.user?.email ?? null;
  } catch {
    return null;
  }
}

export async function checkInternalRequest(authHeader: string | null): Promise<{
  ok: boolean;
  via: "bearer" | "session" | null;
  email: string | null;
}> {
  if (checkInternalAuth(authHeader)) {
    return { ok: true, via: "bearer", email: null };
  }
  const email = await getInternalSessionEmail();
  if (isAllowedEmail(email)) {
    return { ok: true, via: "session", email };
  }
  return { ok: false, via: null, email };
}

function timingSafeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
