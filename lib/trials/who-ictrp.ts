/**
 * lib/trials/who-ictrp.ts
 * Searches the Clarifer-owned WHO ICTRP mirror table.
 * Tables: who_ictrp_trials (read, service role)
 * Auth: called server-side only from trials search route
 * Sprint: Sprint 10 -- WHO ICTRP Pipeline
 *
 * HIPAA: No PHI. Public trial data only. Service role used because the
 * who_ictrp_trials RLS policy returns false for all non-service callers
 * (the table holds public-registry data; org isolation is unnecessary,
 * and service-only access keeps writes admin-gated).
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type { NormalizedTrial } from "./clinicaltrials-gov";

export interface InternationalSearchOptions {
  condition: string;
  country?: string | null;
  limit?: number;
}

function serviceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

type Row = Database["public"]["Tables"]["who_ictrp_trials"]["Row"];

function normalizeRow(row: Row): NormalizedTrial {
  const country = (row.countries ?? [])[0] ?? null;
  return {
    source: "who_ictrp",
    nct_id: row.trial_id,
    title: row.title,
    phase: row.phase ?? "Not specified",
    status: row.status ?? "Unknown",
    location: country ?? "Not specified",
    city: null,
    state: null,
    country,
    brief_summary: row.condition ?? "",
    eligibility: "",
    contact: row.primary_sponsor ?? row.sponsor ?? null,
    external_url: row.url ?? "",
  };
}

/**
 * Searches the local WHO ICTRP mirror by condition (full-text against the
 * condition column) and optional country (membership in the countries[]
 * array). Returns NormalizedTrial[] for shape parity with ClinicalTrials.gov.
 * Returns [] on any error -- never throws -- so the trials search route
 * can degrade gracefully.
 */
export async function searchWhoIctrp(
  condition: string,
  country?: string,
  limit = 25
): Promise<NormalizedTrial[]> {
  const cond = (condition ?? "").trim();
  if (!cond) return [];
  try {
    const supabase = serviceClient();
    let query = supabase
      .from("who_ictrp_trials")
      .select("*")
      .textSearch("condition", cond, { type: "websearch", config: "english" });
    if (country && country.trim()) {
      query = query.contains("countries", [country.trim()]);
    }
    const { data, error } = await query.limit(Math.max(1, Math.min(limit, 100)));
    if (error || !data) return [];
    return data.map(normalizeRow);
  } catch {
    return [];
  }
}

/**
 * Backwards-compatible wrapper for the call site in
 * app/api/trials/search/route.ts (Sprint 9). Delegates to searchWhoIctrp.
 */
export async function searchInternationalTrials(
  opts: InternationalSearchOptions
): Promise<NormalizedTrial[]> {
  if (!opts?.condition?.trim()) return [];
  if (!opts.country) return [];
  // International only -- skip for US patients (covered by clinicaltrials.gov).
  if (
    opts.country.toUpperCase().includes("UNITED STATES") ||
    opts.country.toUpperCase() === "US"
  ) {
    return [];
  }
  return searchWhoIctrp(opts.condition, opts.country, opts.limit);
}
