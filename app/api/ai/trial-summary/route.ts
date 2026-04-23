/**
 * POST /api/ai/trial-summary
 * Streams a plain-language clinical trial eligibility summary for a caregiver.
 * Fetches trial data from trial_saves and patient condition template.
 * Auth → role-check (caregiver only) → rate limit → fetch → stream.
 * Audit log written on completion via onFinish.
 */
import { NextResponse } from "next/server";
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createClient } from "@/lib/supabase/server";
import { trialSummaryLimiter } from "@/lib/ratelimit";
import { checkOrigin } from "@/lib/cors";

export const maxDuration = 60;

const ALLOWED_ROLES = ["caregiver"];

function buildSystemPrompt(): string {
  return `You are a clinical trial coordinator for Clarifer, helping caregivers understand whether a clinical trial might be worth discussing with their care team.

For each trial, summarize in plain language:
1. What is being tested (one sentence, no jargon)
2. Who this trial is looking for (in plain terms)
3. Key eligibility requirements (3-5 bullet points maximum)
4. Any criteria that might DISQUALIFY this patient (flag clearly)
5. Location and what participation involves
6. Next step if interested

Always end with: "Please discuss this trial with [patient name]'s oncologist before taking any action. Only your care team can confirm eligibility."

TONE: Helpful and informative. Not promotional. Not discouraging.

GUARDRAILS (non-negotiable):
- Do NOT recommend enrolling in any specific trial
- Do NOT speculate on trial outcomes or effectiveness
- Do NOT replace the eligibility assessment by the trial sponsor
- Always recommend consulting the oncologist before pursuing enrollment
- If a trial seems clearly inappropriate, say so clearly and explain why`;
}

export async function POST(request: Request) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED", status: 401 },
      { status: 401 }
    );
  }

  const { data: userRecord } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!userRecord || !ALLOWED_ROLES.includes(userRecord.role ?? "") || !userRecord.organization_id) {
    return NextResponse.json(
      { error: "Forbidden", code: "FORBIDDEN", status: 403 },
      { status: 403 }
    );
  }

  const organizationId = userRecord.organization_id;

  const { success } = await trialSummaryLimiter.limit(user.id);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again.", code: "RATE_LIMITED", status: 429 },
      { status: 429 }
    );
  }

  let trialId: string;
  let patientId: string;
  let trialDataOverride: Record<string, unknown> | undefined;
  try {
    const body = await request.json();
    trialId = body.trialId;
    patientId = body.patientId;
    trialDataOverride = body.trialData;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body", code: "BAD_REQUEST", status: 400 },
      { status: 400 }
    );
  }

  if (!trialId || !patientId) {
    return NextResponse.json(
      { error: "trialId and patientId are required", code: "BAD_REQUEST", status: 400 },
      { status: 400 }
    );
  }

  const [trialResult, patientResult] = await Promise.all([
    supabase
      .from("trial_saves")
      .select("trial_id, trial_name, phase, location, status, match_criteria")
      .eq("id", trialId)
      .eq("organization_id", organizationId)
      .single(),
    supabase
      .from("patients")
      .select("name, condition_template_id, primary_language, custom_diagnosis")
      .eq("id", patientId)
      .eq("organization_id", organizationId)
      .single(),
  ]);

  const trialSave = trialResult.data;
  const patient = patientResult.data;

  if (!trialSave && !trialDataOverride) {
    return NextResponse.json(
      { error: "Trial not found", code: "NOT_FOUND", status: 404 },
      { status: 404 }
    );
  }

  let conditionContext = patient?.custom_diagnosis ?? "general oncology";

  if (patient?.condition_template_id) {
    const { data: template } = await supabase
      .from("condition_templates")
      .select("ai_context")
      .eq("id", patient.condition_template_id ?? "")
      .single();
    if (template?.ai_context) conditionContext = template.ai_context;
  }

  const trialData = trialDataOverride ?? trialSave;
  const trialContext = [
    `Trial name: ${trialData?.trial_name ?? "Unknown trial"}`,
    `Phase: ${trialData?.phase ?? "Unknown"}`,
    `Status: ${trialData?.status ?? "Unknown"}`,
    `Location: ${trialData?.location ?? "Unknown"}`,
    trialData?.match_criteria
      ? `Eligibility criteria: ${JSON.stringify(trialData.match_criteria)}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const userMessage = `Patient name: ${patient?.name ?? "the patient"}
Patient condition: ${conditionContext}

Trial:
${trialContext}

Please summarize eligibility for this trial using the format in the system prompt.`;

  const result = streamText({
    model: anthropic("claude-haiku-4-5-20251001"),
    system: buildSystemPrompt(),
    messages: [{ role: "user", content: userMessage }],
    onFinish: async () => {
      await supabase.from("audit_log").insert({
        user_id: user.id,
        patient_id: patientId,
        action: "ai_trial_summary",
        resource_type: "trial_saves",
        resource_id: trialId,
        organization_id: organizationId,
        ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
        user_agent: request.headers.get("user-agent"),
        status: "success",
      });
    },
  });

  return result.toTextStreamResponse();
}
