/**
 * app/api/trials/search/route.ts
 * POST that searches ClinicalTrials.gov plus WHO ICTRP, caches the merged result, and adds plain-language summaries via Claude.
 * Tables: reads users, patients, condition_templates, trial_cache, trial_saves; writes trial_cache (service-role) and audit_log.
 * Auth: caregiver, patient, or provider role; cross-tenant patient access returns 403.
 * Sprint: Sprint 9 -- Trials + Family Updates
 *
 * HIPAA: Sends only condition name plus city/state/country (no patient name) to external trial APIs; sends eligibility text plus condition to Claude. Writes audit_log row (action=SEARCH, resource_type=trial). No PHI in cache key (sha256 of condition+country+phases).
 */
import { NextResponse } from "next/server";
import { createHash } from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { checkOrigin } from "@/lib/cors";
import { searchTrials, type NormalizedTrial } from "@/lib/trials/clinicaltrials-gov";
import { searchInternationalTrials } from "@/lib/trials/who-ictrp";

export const runtime = "nodejs";
export const maxDuration = 30;

const ALLOWED_ROLES = ["caregiver", "patient", "provider"] as const;
const CACHE_TTL_HOURS = 24;

interface PlainLanguageOutput {
  five_things_to_know: string[];
  possible_disqualifiers: string[];
  next_step: string;
}

interface EnrichedTrial extends NormalizedTrial {
  plain_language: PlainLanguageOutput | null;
  saved: boolean;
}

function cacheKey(condition: string, country: string, phases: string[], lang: "en" | "es"): string {
  const raw = `${condition.toLowerCase()}|${country.toLowerCase()}|${phases.sort().join(",")}|${lang}`;
  return createHash("sha256").update(raw).digest("hex");
}

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function POST(request: Request) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: userRecord } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();
  if (
    !userRecord ||
    !ALLOWED_ROLES.includes((userRecord.role ?? "") as (typeof ALLOWED_ROLES)[number]) ||
    !userRecord.organization_id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const orgId = userRecord.organization_id;

  const body = (await request.json().catch(() => null)) as {
    patient_id?: string;
    language?: "en" | "es";
    filters?: { phases?: Array<"1" | "2" | "3" | "4">; source?: "all" | "us" | "international" };
    tumor_location?: string;
    ca19_9_level?: string;
    treatment_history?: string;
    fgfr2_status?: string;
    idh1_status?: string;
    extra_keywords?: string;
  } | null;
  if (!body?.patient_id) {
    return NextResponse.json({ error: "patient_id required" }, { status: 400 });
  }

  const { data: patientRow, error: patientErr } = await supabase
    .from("patients")
    .select("*")
    .eq("id", body.patient_id)
    .single();
  if (patientErr || !patientRow) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }
  if ((patientRow.organization_id ?? null) !== orgId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const patient = patientRow as Record<string, unknown>;
  const conditionId = (patient.condition_template_id as string | null) ?? null;
  let condition = (patient.custom_diagnosis as string | null) ?? "";
  if (conditionId) {
    const { data: tmpl } = await supabase
      .from("condition_templates")
      .select("name")
      .eq("id", conditionId)
      .single();
    if (tmpl?.name) condition = tmpl.name;
  }
  if (!condition.trim()) {
    return NextResponse.json({ error: "Patient has no diagnosis" }, { status: 400 });
  }

  // CCA biomarker filter context -- append to condition before cache key computation
  // so different filter combinations produce distinct cache entries.
  const tumorLocation = body?.tumor_location ?? null;
  const fgfr2Status = body?.fgfr2_status ?? null;
  const idh1Status = body?.idh1_status ?? null;
  const treatmentHistory = body?.treatment_history ?? null;
  const extraKeywords = body?.extra_keywords?.trim() ?? null;

  if (tumorLocation && tumorLocation !== "Not sure") {
    condition = `${tumorLocation} ${condition}`;
  }
  if (fgfr2Status === "Positive") {
    condition += " FGFR2 fusion";
  }
  if (idh1Status === "Positive") {
    condition += " IDH1 mutation ivosidenib";
  }
  if (treatmentHistory === "First stopped working" || treatmentHistory === "Two or more tried") {
    condition += " second line refractory";
  }
  if (extraKeywords) {
    condition += ` ${extraKeywords}`;
  }

  const country = ((patient.country as string | null) ?? "United States").trim();
  const city = (patient.city as string | null) ?? null;
  const state = (patient.state as string | null) ?? null;
  const phases = body.filters?.phases ?? [];
  const source = body.filters?.source ?? "all";

  // International persona: surface ICTRP results first and translate to Spanish
  // when the patient's primary language is Spanish or country is non-US (CCF
  // demo personas: Panama, Mexico). Caller can override via body.language.
  const isInternational = !country.toLowerCase().includes("united states");
  const patientLanguage = (patient.primary_language as string | null) ?? null;
  const language: "en" | "es" =
    body.language === "es" || body.language === "en"
      ? body.language
      : (patientLanguage === "es" || isInternational ? "es" : "en");

  const key = cacheKey(condition, country, phases, language);
  const svc = serviceClient();

  // Cache check
  let cachedTrials: EnrichedTrial[] | null = null;
  try {
    const { data: cached } = await svc
      .from("trial_cache")
      .select("payload, expires_at")
      .eq("cache_key", key)
      .single();
    if (cached && new Date(cached.expires_at as string).getTime() > Date.now()) {
      cachedTrials = (cached.payload as { trials: EnrichedTrial[] }).trials;
    }
  } catch {
    // table may not exist before migration; fall through to live fetch
  }

  let enriched: EnrichedTrial[];
  if (cachedTrials) {
    enriched = cachedTrials;
  } else {
    const wantUs = source !== "international";
    const wantIntl = source !== "us" && isInternational;
    const [usResults, intlResults] = await Promise.all([
      wantUs ? searchTrials({ condition, location: { city, state, country }, phase: phases }) : Promise.resolve([]),
      wantIntl ? searchInternationalTrials({ condition, country }) : Promise.resolve([]),
    ]);

    // International persona sees ICTRP first; US-based persona sees CT.gov first.
    const orderedRaw = isInternational
      ? [...intlResults, ...usResults]
      : [...usResults, ...intlResults];
    const merged = dedupeTrials(orderedRaw);
    const plainLanguage = await renderPlainLanguage(merged, language);
    enriched = merged.map((t) => ({ ...t, plain_language: plainLanguage[t.nct_id] ?? null, saved: false }));

    // Cache write (best-effort)
    try {
      await svc.from("trial_cache").upsert(
        {
          cache_key: key,
          payload: { trials: enriched },
          source: "merged",
          expires_at: new Date(Date.now() + CACHE_TTL_HOURS * 3600 * 1000).toISOString(),
        },
        { onConflict: "cache_key" }
      );
    } catch {
      // ignore
    }
  }

  // Mark which trials are saved for this patient
  try {
    const { data: saved } = await supabase
      .from("trial_saves")
      .select("trial_id")
      .eq("patient_id", body.patient_id);
    if (saved) {
      const set = new Set((saved as Array<{ trial_id: string | null }>).map((r) => r.trial_id));
      enriched = enriched.map((t) => ({ ...t, saved: set.has(t.nct_id) }));
    }
  } catch {
    // ignore
  }

  // Audit log (no PHI in details; just patient_id reference)
  try {
    await supabase.from("audit_log").insert({
      user_id: user.id,
      organization_id: orgId,
      action: "SEARCH",
      resource_type: "trial",
      resource_id: body.patient_id,
      patient_id: body.patient_id,
    });
  } catch {
    // ignore
  }

  return NextResponse.json({ trials: enriched, condition, country, source, language });
}

function dedupeTrials(trials: NormalizedTrial[]): NormalizedTrial[] {
  const seen = new Set<string>();
  const out: NormalizedTrial[] = [];
  for (const t of trials) {
    const key = `${t.title.toLowerCase().trim()}|${t.location.toLowerCase().trim()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

async function renderPlainLanguage(
  trials: NormalizedTrial[],
  language: "en" | "es"
): Promise<Record<string, PlainLanguageOutput>> {
  if (!trials.length || !process.env.ANTHROPIC_API_KEY) return {};

  const compact = trials.map((t) => ({
    nct_id: t.nct_id,
    title: t.title,
    eligibility: t.eligibility.slice(0, 1500),
    summary: t.brief_summary.slice(0, 600),
  }));

  const outputLanguage = language === "es" ? "Spanish" : "English";

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  let text = "";
  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system:
        "You are translating clinical trial eligibility into plain language for a caregiver. " +
        "For each trial, identify: the 5 most important requirements in plain language, any " +
        "criteria likely to be disqualifying based on the patient profile, and the next step " +
        "to find out more. Never recommend enrolling or not enrolling. " +
        `Write all output strings in ${outputLanguage}. ` +
        "Output ONLY a JSON object keyed by nct_id, where each value is " +
        '{"five_things_to_know":[...5 strings...],"possible_disqualifiers":[...0-5 strings...],"next_step":"..."}. ' +
        "No prose outside the JSON.",
      messages: [
        {
          role: "user",
          content: `Translate these trials:\n\n${JSON.stringify(compact)}`,
        },
      ],
    });
    const block = response.content[0];
    text = block && block.type === "text" ? block.text : "";
  } catch {
    return {};
  }

  // Extract JSON from response (model sometimes wraps in code fences)
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return {};
  try {
    return JSON.parse(match[0]) as Record<string, PlainLanguageOutput>;
  } catch {
    return {};
  }
}
