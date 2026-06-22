/**
 * POST /api/trials/coordinator-message
 * Generates a plain-language message a caregiver can send to a trial coordinator
 * asking about eligibility for their care recipient.
 * Auth: caregiver, patient, provider.
 * Tables: reads patients (org-scoped). Writes audit_log.
 * HIPAA: Receives patient biomarker data that the caregiver chose to include.
 *   These are sent at the caregiver's explicit initiative (legally equivalent to a
 *   patient bringing their own lab results to a consultation). No patient name is
 *   included — only anonymous clinical profile + trial metadata.
 *   Anthropic call is server-side only; no PHI in the prompt beyond what the
 *   caregiver already entered on the page.
 */
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/auth/get-user";
import { checkOrigin } from "@/lib/cors";

export const runtime = "nodejs";
export const maxDuration = 30;

const ALLOWED_ROLES = ["caregiver", "patient", "provider"] as const;

interface RequestBody {
  patient_id: string;
  trial: {
    nct_id: string;
    title: string;
    phase: string;
    status: string;
    location: string;
    contact: string | null;
    external_url: string;
  };
  profile: {
    tumor_location?: string | null;
    ca19_9_level?: string | null;
    treatment_history?: string | null;
    fgfr2_status?: string | null;
    idh1_status?: string | null;
    extra_keywords?: string | null;
  };
}

export async function POST(request: Request) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const supabase = await createClient();
  const user = await getUserFromRequest();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!ALLOWED_ROLES.includes(user.role as (typeof ALLOWED_ROLES)[number])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orgId = user.organization_id;

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body?.patient_id || !body?.trial?.nct_id) {
    return NextResponse.json({ error: "patient_id and trial.nct_id required" }, { status: 400 });
  }

  // Org-scope check — confirm patient belongs to the caller's org.
  const { data: patient } = await supabase
    .from("patients")
    .select("organization_id, condition_template_id, custom_diagnosis")
    .eq("id", body.patient_id)
    .single();

  if (!patient || patient.organization_id !== orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let conditionName = patient.custom_diagnosis ?? "cholangiocarcinoma";
  if (patient.condition_template_id) {
    const { data: tmpl } = await supabase
      .from("condition_templates")
      .select("name")
      .eq("id", patient.condition_template_id)
      .single();
    if (tmpl?.name) conditionName = tmpl.name;
  }

  // Build a de-identified patient profile from caregiver-provided biomarker data.
  const profileLines: string[] = [];
  const p = body.profile;
  if (p.tumor_location && p.tumor_location !== "Not sure") {
    profileLines.push(`Tumor location: ${p.tumor_location}`);
  }
  if (p.ca19_9_level && p.ca19_9_level !== "Not tested") {
    profileLines.push(`CA 19-9 level: ${p.ca19_9_level} U/mL`);
  }
  if (p.treatment_history && p.treatment_history !== "Not yet started") {
    profileLines.push(`Treatment history: ${p.treatment_history}`);
  }
  if (p.fgfr2_status && p.fgfr2_status !== "Not tested") {
    profileLines.push(`FGFR2 fusion status: ${p.fgfr2_status}`);
  }
  if (p.idh1_status && p.idh1_status !== "Not tested") {
    profileLines.push(`IDH1 mutation status: ${p.idh1_status}`);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI service unavailable" }, { status: 503 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = [
    `Write a short, professional email from a caregiver to a clinical trial coordinator.`,
    ``,
    `Trial: ${body.trial.title}`,
    `NCT ID: ${body.trial.nct_id}`,
    `Phase: ${body.trial.phase} | Status: ${body.trial.status}`,
    `Location: ${body.trial.location}`,
    ``,
    `Diagnosis: ${conditionName}`,
    profileLines.length ? `Patient profile (provided by the caregiver):\n${profileLines.map((l) => `- ${l}`).join("\n")}` : "",
    ``,
    `Instructions:`,
    `- Opening: "Hello, I am writing on behalf of a family member with ${conditionName}."`,
    `- Ask whether this trial is accepting new patients and how to find out if they may be eligible.`,
    `- Include the patient profile if provided.`,
    `- Mention NCT ID so the coordinator can look it up.`,
    `- Keep the email under 150 words.`,
    `- Do not include a name or any personally identifying information.`,
    `- End with a polite closing and a blank line for the caregiver to sign.`,
    `- Output ONLY the email body (no subject line, no meta text).`,
  ]
    .filter((l) => l !== "")
    .join("\n");

  let messageText = "";
  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });
    const block = response.content[0];
    messageText = block?.type === "text" ? block.text.trim() : "";
  } catch {
    return NextResponse.json({ error: "Failed to generate message" }, { status: 502 });
  }

  // Audit log (no PHI — patient_id reference only).
  supabase.from("audit_log").insert({
    user_id: user.id,
    patient_id: body.patient_id,
    organization_id: orgId,
    action: "GENERATE",
    resource_type: "coordinator_message",
    resource_id: body.trial.nct_id,
  }).then(() => undefined, () => undefined);

  return NextResponse.json({ message: messageText });
}
