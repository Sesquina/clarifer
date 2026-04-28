/**
 * lib/trials/clinicaltrials-gov.ts
 * Server-side adapter for the ClinicalTrials.gov v2 studies API that returns NormalizedTrial records.
 * Tables: none (network-only against clinicaltrials.gov; no Supabase access).
 * Auth: callers (API routes) handle auth; this module trusts its inputs and is not exposed directly to clients.
 * Sprint: Sprint 9 -- Trials + Family Updates
 *
 * HIPAA: No PHI stored in this file. Only condition name and city/state/country are sent to the public API; no patient identifiers.
 */
import { stripHtml } from "@/lib/sanitize";

export interface TrialSearchOptions {
  condition: string;
  location?: { city?: string | null; state?: string | null; country?: string | null };
  phase?: Array<"1" | "2" | "3" | "4">;
  limit?: number;
}

export interface NormalizedTrial {
  source: "clinicaltrials.gov" | "who_ictrp";
  nct_id: string;
  title: string;
  phase: string;
  status: string;
  location: string;
  city: string | null;
  state: string | null;
  country: string | null;
  brief_summary: string;
  eligibility: string;
  contact: string | null;
  external_url: string;
}

const ENDPOINT = "https://clinicaltrials.gov/api/v2/studies";

export async function searchTrials(opts: TrialSearchOptions): Promise<NormalizedTrial[]> {
  const condition = stripHtml(String(opts.condition || "")).trim();
  if (!condition) return [];

  const params = new URLSearchParams({
    "query.cond": condition,
    pageSize: String(Math.min(Math.max(opts.limit ?? 10, 1), 50)),
    "filter.overallStatus": "RECRUITING",
    format: "json",
  });

  const locParts = [opts.location?.city, opts.location?.state, opts.location?.country]
    .filter(Boolean)
    .map((s) => stripHtml(String(s)));
  if (locParts.length) {
    params.set("query.locn", locParts.join(", "));
  }

  if (opts.phase && opts.phase.length) {
    const phaseFilter = opts.phase.map((p) => `PHASE${p}`).join("|");
    params.set("filter.advanced", `AREA[Phase](${phaseFilter})`);
  }

  let res: Response;
  try {
    res = await fetch(`${ENDPOINT}?${params.toString()}`, {
      next: { revalidate: 3600 },
    });
  } catch {
    return [];
  }
  if (!res.ok) return [];

  const json = (await res.json()) as { studies?: Array<Record<string, unknown>> };
  const studies = json.studies ?? [];
  return studies.map(normalizeStudy).filter((t): t is NormalizedTrial => t !== null);
}

function normalizeStudy(study: Record<string, unknown>): NormalizedTrial | null {
  const protocol = (study.protocolSection ?? {}) as Record<string, unknown>;
  const ident = (protocol.identificationModule ?? {}) as Record<string, unknown>;
  const status = (protocol.statusModule ?? {}) as Record<string, unknown>;
  const design = (protocol.designModule ?? {}) as Record<string, unknown>;
  const desc = (protocol.descriptionModule ?? {}) as Record<string, unknown>;
  const elig = (protocol.eligibilityModule ?? {}) as Record<string, unknown>;
  const contacts = (protocol.contactsLocationsModule ?? {}) as Record<string, unknown>;
  const locations = (contacts.locations as Array<Record<string, unknown>>) ?? [];
  const central = (contacts.centralContacts as Array<Record<string, unknown>>) ?? [];

  const nctId = (ident.nctId as string) || null;
  if (!nctId) return null;

  const first = locations[0] ?? {};
  const phases = (design.phases as string[]) ?? [];

  return {
    source: "clinicaltrials.gov",
    nct_id: nctId,
    title: (ident.briefTitle as string) || "Untitled trial",
    phase: phases.length ? phases.join(", ") : "Not specified",
    status: (status.overallStatus as string) || "Unknown",
    location: [first.city, first.state, first.country].filter(Boolean).join(", ") || "Not specified",
    city: (first.city as string) ?? null,
    state: (first.state as string) ?? null,
    country: (first.country as string) ?? null,
    brief_summary: ((desc.briefSummary as string) ?? "").slice(0, 800),
    eligibility: ((elig.eligibilityCriteria as string) ?? "").slice(0, 2000),
    contact:
      (central[0]?.name as string) ??
      (first.contacts as Array<Record<string, unknown>>)?.[0]?.name as string ??
      null,
    external_url: `https://clinicaltrials.gov/study/${nctId}`,
  };
}
