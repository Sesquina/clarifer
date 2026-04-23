/**
 * POST /api/ai/family-update
 * Streams a plain-language family update for a patient's caregiver.
 * Fetches last 7 days of symptom logs, active medications, and recent documents.
 * Auth → role-check (caregiver only) → rate limit → fetch → stream.
 * Audit log written on completion via onFinish.
 */
import { NextResponse } from "next/server";
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createClient } from "@/lib/supabase/server";
import { familyUpdateStreamLimiter } from "@/lib/ratelimit";
import { checkOrigin } from "@/lib/cors";

export const maxDuration = 60;

const ALLOWED_ROLES = ["caregiver"];

function buildSystemPrompt(language: string): string {
  return `You are a care coordinator for Clarifer, helping caregivers communicate health updates to family members in plain language.

Generate a warm, clear family update based on the patient data provided.

FORMAT:
- Opening: one sentence on how the patient is doing overall
- Recent changes: 2-3 bullet points on what has changed
- What is helping: 1-2 things that are working
- What to watch for: 1-2 things to monitor
- Next steps: upcoming appointments or plans
- Closing: one warm, hopeful sentence

TONE: Write as if you are a trusted friend who happens to know medicine. Warm, human, never clinical. The reader may be opening this at 2am worried about someone they love.

LANGUAGE: Respond in ${language === "es" ? "Spanish" : "English"}.

GUARDRAILS (non-negotiable):
- Do NOT speculate on prognosis or life expectancy
- Do NOT recommend medication changes
- Do NOT diagnose or suggest diagnoses
- Do NOT include specific lab values or medical jargon
- Keep it under 200 words
- End with something that acknowledges the caregiver's effort`;
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

  const { success } = await familyUpdateStreamLimiter.limit(user.id);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again.", code: "RATE_LIMITED", status: 429 },
      { status: 429 }
    );
  }

  let patientId: string;
  let requestedLanguage: string | undefined;
  try {
    const body = await request.json();
    patientId = body.patientId;
    requestedLanguage = body.language;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body", code: "BAD_REQUEST", status: 400 },
      { status: 400 }
    );
  }

  if (!patientId) {
    return NextResponse.json(
      { error: "patientId is required", code: "BAD_REQUEST", status: 400 },
      { status: 400 }
    );
  }

  const { data: patient } = await supabase
    .from("patients")
    .select("primary_language, custom_diagnosis")
    .eq("id", patientId)
    .eq("organization_id", organizationId)
    .single();

  if (!patient) {
    return NextResponse.json(
      { error: "Patient not found", code: "NOT_FOUND", status: 404 },
      { status: 404 }
    );
  }

  const language = requestedLanguage ?? patient.primary_language ?? "en";
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [symptomResult, medicationResult, documentResult] = await Promise.all([
    supabase
      .from("symptom_logs")
      .select("overall_severity, ai_summary, created_at")
      .eq("patient_id", patientId)
      .eq("organization_id", organizationId)
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: false })
      .limit(7),
    supabase
      .from("medications")
      .select("name, dose, frequency")
      .eq("patient_id", patientId)
      .eq("organization_id", organizationId)
      .eq("is_active", true),
    supabase
      .from("documents")
      .select("title, document_category, uploaded_at")
      .eq("patient_id", patientId)
      .eq("organization_id", organizationId)
      .order("uploaded_at", { ascending: false })
      .limit(3),
  ]);

  const symptomSummary = symptomResult.data && symptomResult.data.length > 0
    ? symptomResult.data
        .map((s) => s.ai_summary ?? `Severity ${s.overall_severity}/10`)
        .join("; ")
    : "No symptoms logged in the past 7 days";

  const medicationList = medicationResult.data && medicationResult.data.length > 0
    ? medicationResult.data
        .map((m) => [m.name, m.dose, m.frequency].filter(Boolean).join(" "))
        .join(", ")
    : "No active medications listed";

  const documentHighlights = documentResult.data && documentResult.data.length > 0
    ? documentResult.data
        .map((d) => `${d.title ?? "Untitled"} (${d.document_category ?? "document"})`)
        .join("; ")
    : "No recent documents";

  const userMessage = `Patient context (last 7 days):
Symptoms: ${symptomSummary}
Active medications: ${medicationList}
Recent documents: ${documentHighlights}

Please write the family update now.`;

  const result = streamText({
    model: anthropic("claude-haiku-4-5-20251001"),
    system: buildSystemPrompt(language),
    messages: [{ role: "user", content: userMessage }],
    onFinish: async () => {
      await supabase.from("audit_log").insert({
        user_id: user.id,
        patient_id: patientId,
        action: "ai_family_update",
        resource_type: "patients",
        resource_id: patientId,
        organization_id: organizationId,
        ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
        user_agent: request.headers.get("user-agent"),
        status: "success",
      });
    },
  });

  return result.toTextStreamResponse();
}
