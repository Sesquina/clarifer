/**
 * POST /api/ai/family-update
 * Streams a plain-language family update for a patient's caregiver.
 * Fetches last 7 days of symptom logs, active medications, and recent documents.
 * Auth: authenticate → role-check (caregiver only) → process.
 * Language: uses request body language param, falls back to patient.language.
 * Audit log written on completion via onFinish.
 * No PHI in any log output.
 */
import { NextResponse } from "next/server";
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createClient } from "@/lib/supabase/server";
import { familyUpdateStreamLimiter } from "@/lib/ratelimit";
import { checkOrigin } from "@/lib/cors";

export const maxDuration = 60;

const ALLOWED_ROLES = ["caregiver"];

/**
 * Family update system prompt stub.
 * STUB: requires Samira review before production (especially Spanish output).
 * Language and context are interpolated at request time.
 */
function buildSystemPrompt(language: string, symptomSummary: string, medicationList: string, documentHighlights: string): string {
  console.warn("[STUB PROMPT -- requires Samira review before production]");

  const langInstruction = language === "es"
    ? "Write entirely in Spanish. Use warm, conversational Spanish appropriate for a family member."
    : "Write entirely in English. Use warm, conversational English appropriate for a family member.";

  return `You help a caregiver write a plain-language family update about a patient's recent health status.

${langInstruction}

Rules:
- No medical jargon without a plain-language explanation in parentheses.
- No prognosis speculation. Never estimate how long or how severe.
- No treatment recommendations. Never suggest changing medications.
- Keep it under 200 words.
- Warm, hopeful where honest, never alarming.
- End with an invitation for family to reach out with questions.
- Write from the caregiver's perspective (first person plural: "we", "our").

Current data:
Symptoms (last 7 days): ${symptomSummary}
Medications: ${medicationList}
Recent documents: ${documentHighlights}`;
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
  const { success } = await familyUpdateStreamLimiter.limit(user.id);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again.", code: "RATE_LIMITED", status: 429 },
      { status: 429 }
    );
  }

  // 4. Parse input
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

  // 5. Fetch patient (for language preference fallback)
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

  // Respect patient language preference if no explicit language provided
  const language = requestedLanguage ?? patient.primary_language ?? "en";

  // 6. Fetch last 7 days of symptom logs, active medications, recent documents
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

  // Build context strings -- no PHI beyond what is necessary
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

  // 7. Stream family update via Vercel AI SDK
  // Model: claude-haiku-4-5-20251001 -- family update (fast task, sufficient accuracy)
  const result = streamText({
    model: anthropic("claude-haiku-4-5-20251001"),
    system: buildSystemPrompt(language, symptomSummary, medicationList, documentHighlights),
    messages: [
      {
        role: "user",
        content: `Please write the family update now.`,
      },
    ],
    onFinish: async () => {
      // Audit log on completion
      await supabase.from("audit_log").insert({
        user_id: user.id,
        patient_id: patientId,
        action: "ai_family_update",
        resource_type: "patients",
        resource_id: patientId,
        organization_id: organizationId,
      });
    },
  });

  return result.toTextStreamResponse();
}
