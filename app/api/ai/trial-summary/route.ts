/**
 * POST /api/ai/trial-summary
 * Streams a plain-language clinical trial eligibility summary for a caregiver.
 * Fetches trial data from trial_saves and patient condition template.
 * Auth: authenticate → role-check (caregiver only) → process.
 * Output: 5 eligibility requirements in plain language, disqualifying criteria flagged.
 * Audit log written on completion via onFinish.
 * No PHI in any log output.
 */
import { NextResponse } from "next/server";
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createClient } from "@/lib/supabase/server";
import { trialSummaryLimiter } from "@/lib/ratelimit";
import { checkOrigin } from "@/lib/cors";

export const maxDuration = 60;

const ALLOWED_ROLES = ["caregiver"];

/**
 * Trial eligibility summary system prompt stub.
 * STUB: requires Samira review before production.
 */
function buildSystemPrompt(conditionContext: string, language: string): string {
  console.warn("[STUB PROMPT -- requires Samira review before production]");

  const langInstruction = language === "es"
    ? "Write entirely in Spanish."
    : "Write entirely in English.";

  return `You translate clinical trial eligibility criteria into plain language for a family caregiver.

${langInstruction}

Rules:
- Write in plain language. No medical jargon without explanation.
- Never recommend enrolling or not enrolling in any trial.
- Never make promises about trial outcomes or efficacy.
- Always remind the caregiver to discuss eligibility with their oncologist or care team.

Condition context: ${conditionContext}

Output format:
1. TRIAL NAME -- one sentence description of what the trial is studying
2. TOP 5 ELIGIBILITY REQUIREMENTS -- plain-language list of the 5 most important requirements
3. LIKELY DISQUALIFYING CRITERIA -- clearly flag any criteria that may disqualify this patient
4. NEXT STEP -- one action the caregiver can take (always: talk to care team or call trial coordinator)

Flag disqualifying criteria clearly. Be honest but warm. This is critical information for a family.`;
}

export async function POST(request: Request) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  // 1. Authenticate
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED", status: 401 },
      { status: 401 }
    );
  }

  // 2. Authorize
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

  // 3. Rate limit
  const { success } = await trialSummaryLimiter.limit(user.id);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again.", code: "RATE_LIMITED", status: 429 },
      { status: 429 }
    );
  }

  // 4. Parse input
  let trialId: string;
  let patientId: string;
  let trialDataOverride: Record<string, unknown> | undefined;
  try {
    const body = await request.json();
    trialId = body.trialId;
    patientId = body.patientId;
    trialDataOverride = body.trialData; // Optional: client can pass raw trial data
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

  // 5. Fetch trial data from trial_saves and patient condition template
  const [trialResult, patientResult] = await Promise.all([
    supabase
      .from("trial_saves")
      .select("trial_id, trial_name, phase, location, status, match_criteria")
      .eq("id", trialId)
      .eq("organization_id", organizationId)
      .single(),
    supabase
      .from("patients")
      .select("condition_template_id, primary_language")
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

  // Fetch condition template for AI context
  let conditionContext = "general oncology";
  const language = patient?.primary_language ?? "en";

  if (patient?.condition_template_id) {
    const { data: template } = await supabase
      .from("condition_templates")
      .select("ai_context, trial_filters")
      .eq("id", patient.condition_template_id ?? "")
      .single();
    if (template?.ai_context) conditionContext = template.ai_context;
  }

  // Build the trial context string for the prompt
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

  // 6. Stream trial summary via Vercel AI SDK
  // Model: claude-haiku-4-5-20251001 -- trial summary (fast task, sufficient accuracy)
  const result = streamText({
    model: anthropic("claude-haiku-4-5-20251001"),
    system: buildSystemPrompt(conditionContext, language),
    messages: [
      {
        role: "user",
        content: `Please summarize the eligibility for this clinical trial:\n\n${trialContext}`,
      },
    ],
    onFinish: async () => {
      // Audit log on completion
      await supabase.from("audit_log").insert({
        user_id: user.id,
        patient_id: patientId,
        action: "ai_trial_summary",
        resource_type: "trial_saves",
        resource_id: trialId,
        organization_id: organizationId,
      });
    },
  });

  return result.toTextStreamResponse();
}
