/**
 * lib/trials/who-ictrp.ts
 * Scaffolded WHO ICTRP adapter that returns an empty list until a real ICTRP data source is configured.
 * Tables: none (no network calls today; no Supabase access).
 * Auth: callers (API routes) handle auth; this module trusts its inputs and is not exposed directly to clients.
 * Sprint: Sprint 9 -- Trials + Family Updates
 *
 * HIPAA: No PHI stored in this file. When a data source is wired in, only condition name and country must be sent externally.
 */
import type { NormalizedTrial } from "./clinicaltrials-gov";

/**
 * WHO ICTRP integration.
 *
 * The WHO International Clinical Trials Registry Platform does not
 * currently expose a stable public REST API. The official "API" is a
 * weekly XML bulk download requiring registration. This module is
 * scaffolded so the contract is in place; once Samira either (a)
 * registers for ICTRP weekly XML and we ingest it server-side, or
 * (b) we contract a third-party aggregator like CenterWatch or
 * trialscope, this function will be wired to return real results.
 *
 * For now: returns an empty array and logs a single info-level note.
 * Callers must merge defensively (treat empty as "no international
 * results" rather than an error).
 */
export interface InternationalSearchOptions {
  condition: string;
  country?: string | null;
  limit?: number;
}

let warned = false;
function warnOnce() {
  if (warned) return;
  warned = true;
  // eslint-disable-next-line no-console
  console.info("[who-ictrp] integration scaffolded; returning empty results until data source configured");
}

export async function searchInternationalTrials(
  opts: InternationalSearchOptions
): Promise<NormalizedTrial[]> {
  if (!opts.condition?.trim()) return [];
  if (!opts.country) return [];
  // International only — skip for US patients (covered by clinicaltrials.gov).
  if (opts.country.toUpperCase().includes("UNITED STATES") || opts.country.toUpperCase() === "US") {
    return [];
  }
  warnOnce();
  return [];
}
