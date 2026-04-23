/**
 * POST /api/ai/analyze-document
 * Streams AI analysis of a medical document for the patient's caregiver.
 * Auth: authenticate → role-check (caregiver only) → process.
 * Streaming: Vercel AI SDK streamText(). First token target: under 500ms.
 * Audit log written on stream completion via onFinish.
 * No PHI in any log output.
 */
import { NextResponse } from "next/server";
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createClient } from "@/lib/supabase/server";
import { analyzeLimiter } from "@/lib/ratelimit";
import { checkOrigin } from "@/lib/cors";

export const maxDuration = 60;

// Roles permitted to call this route
const ALLOWED_ROLES = ["caregiver"];

/**
 * Document analysis system prompt stub.
 * STUB: requires Samira review before production.
 * Condition context and document type are interpolated at request time.
 */
function buildSystemPrompt(conditionContext: string, documentType: string, language: string): string {
  console.warn("[STUB PROMPT -- requires Samira review before production]");
  return `You are Clarifer's document analysis assistant helping a family caregiver understand a medical document.

You NEVER diagnose. You NEVER recommend treatment changes. You NEVER speculate on prognosis.
You NEVER suggest a patient stop, change, or adjust any medication.
You NEVER assign probability to outcomes or disease progression.

Condition context: ${conditionContext}
Document type: ${documentType}
Language: ${language}

Output four clearly labeled sections:
1. KEY FINDINGS -- plain-language summary of what the document shows
2. MEDICATIONS MENTIONED -- any medications referenced in the document
3. NEXT STEPS -- concrete actions the caregiver can take (never treatment changes)
4. QUESTIONS TO ASK -- 3 specific questions for the next provider visit

Use warm, clear language. Never clinical or cold. Write as if speaking directly to a caregiver.
If asked to diagnose or speculate on prognosis, redirect warmly to the care team.`;
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

  // 2. Authorize -- role check before any processing
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
  const { success } = await analyzeLimiter.limit(user.id);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again.", code: "RATE_LIMITED", status: 429 },
      { status: 429 }
    );
  }

  // 4. Parse and validate input
  let documentId: string;
  let patientId: string;
  try {
    const body = await request.json();
    documentId = body.documentId;
    patientId = body.patientId;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body", code: "BAD_REQUEST", status: 400 },
      { status: 400 }
    );
  }

  if (!documentId || !patientId) {
    return NextResponse.json(
      { error: "documentId and patientId are required", code: "BAD_REQUEST", status: 400 },
      { status: 400 }
    );
  }

  // 5. Fetch document metadata (verify it exists and belongs to org)
  const { data: doc } = await supabase
    .from("documents")
    .select("id, patient_id, document_category, title")
    .eq("id", documentId)
    .eq("organization_id", organizationId)
    .single();

  if (!doc) {
    return NextResponse.json(
      { error: "Document not found", code: "NOT_FOUND", status: 404 },
      { status: 404 }
    );
  }

  // 6. Fetch patient + condition template for AI context
  const { data: patient } = await supabase
    .from("patients")
    .select("condition_template_id, primary_language")
    .eq("id", patientId)
    .eq("organization_id", organizationId)
    .single();

  let conditionContext = "general medical";
  let language = patient?.primary_language ?? "en";

  if (patient?.condition_template_id) {
    const { data: template } = await supabase
      .from("condition_templates")
      .select("ai_context, document_types")
      .eq("id", patient.condition_template_id ?? "")
      .single();
    if (template?.ai_context) conditionContext = template.ai_context;
  }

  const documentType = doc.document_category ?? "medical document";

  // 7. Stream analysis via Vercel AI SDK
  // Model: claude-opus-4-6 -- document analysis (complex task, highest accuracy required)
  const result = streamText({
    model: anthropic("claude-opus-4-6"),
    system: buildSystemPrompt(conditionContext, documentType, language),
    messages: [
      {
        role: "user",
        content: `Please analyze this ${documentType}. Document ID: ${documentId}. Provide the four sections: KEY FINDINGS, MEDICATIONS MENTIONED, NEXT STEPS, QUESTIONS TO ASK.`,
      },
    ],
    onFinish: async ({ text }) => {
      // Write summary to documents table linked by document_id
      await supabase
        .from("documents")
        .update({ summary: text, analyzed_at: new Date().toISOString() })
        .eq("id", documentId);

      // Audit log on completion -- Tier 1 requirement
      await supabase.from("audit_log").insert({
        user_id: user.id,
        patient_id: patientId,
        action: "ai_analyze_document",
        resource_type: "documents",
        resource_id: documentId,
        organization_id: organizationId,
      });
    },
  });

  return result.toTextStreamResponse();
}
