/**
 * app/api/ai/analyze-document/route.ts
 * POST /api/ai/analyze-document
 * Classifies a document then extracts structured, type-specific analysis.
 * Two sequential Anthropic calls: (1) classify, (2) type-specific extraction.
 * Returns JSON (not a stream) so AnalysisTrigger can call router.refresh() on success.
 *
 * Tables: documents (read/write), patients (read), condition_templates (read),
 *         chat_messages (write), audit_log (write)
 * Auth: caregiver
 * HIPAA: PHI document. Auth + role + org_id enforced. audit_log written on every analysis.
 *        No patient name in any Anthropic prompt. Uses "the patient".
 */
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/auth/get-user";
import { analyzeLimiter } from "@/lib/ratelimit";
import { checkOrigin } from "@/lib/cors";
import { extractText } from "@/lib/documents/extract";
import { generateSignedUrl } from "@/lib/documents/storage";

export const runtime = "nodejs";
export const maxDuration = 60;

const ROUTE = "api/ai/analyze-document";

const ALLOWED_ROLES = ["caregiver"];

type DocumentType =
  | "GENETIC_REPORT"
  | "LAB_RESULTS"
  | "PROCEDURE_REPORT"
  | "IMAGING_REPORT"
  | "CLINICAL_NOTE"
  | "LEGAL_ADMINISTRATIVE"
  | "OTHER";

const KNOWN_TYPES: DocumentType[] = [
  "GENETIC_REPORT",
  "LAB_RESULTS",
  "PROCEDURE_REPORT",
  "IMAGING_REPORT",
  "CLINICAL_NOTE",
  "LEGAL_ADMINISTRATIVE",
  "OTHER",
];

const SYSTEM_PROMPT =
  "You are a caregiver support assistant helping a family understand " +
  "medical documents. You never diagnose. You never recommend changing " +
  "medications. You always recommend consulting the care team. Return only " +
  "valid JSON with no markdown formatting.";

// ── Classification ────────────────────────────────────────────────────────────

async function classifyDocument(
  client: Anthropic,
  text: string
): Promise<DocumentType> {
  try {
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 64,
      system: "You are a medical document classifier. Respond only with valid JSON.",
      messages: [
        {
          role: "user",
          content:
            `Classify this medical document into exactly one of these types: ` +
            `GENETIC_REPORT, LAB_RESULTS, PROCEDURE_REPORT, IMAGING_REPORT, ` +
            `CLINICAL_NOTE, LEGAL_ADMINISTRATIVE, OTHER.\n\n` +
            `Return only: { "type": "TYPE_HERE" }\n\n` +
            `Document text (first 500 chars): ${text.slice(0, 500)}`,
        },
      ],
    });
    const block = res.content[0];
    const raw = block?.type === "text" ? block.text : "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return "OTHER";
    const parsed = JSON.parse(match[0]) as { type?: string };
    const t = (parsed.type ?? "").toUpperCase() as DocumentType;
    return KNOWN_TYPES.includes(t) ? t : "OTHER";
  } catch {
    return "OTHER";
  }
}

// ── Type-specific extraction prompts ─────────────────────────────────────────

function buildExtractionPrompt(type: DocumentType, text: string): string {
  const body = text.slice(0, 3000);
  switch (type) {
    case "GENETIC_REPORT":
      return (
        `This is a genetic or liquid biopsy report. Extract:\n` +
        `{\n` +
        `  "summary": "2-3 sentence plain-language summary of what this test shows",\n` +
        `  "key_findings": [\n` +
        `    { "marker": "name", "result": "value", "plain_language": "what this means in one sentence" }\n` +
        `  ],\n` +
        `  "not_detected": ["list of important markers that were NOT found"],\n` +
        `  "action_items": ["specific next steps the care team recommended"],\n` +
        `  "clinical_trials_note": "one sentence on how these results affect trial eligibility if relevant"\n` +
        `}\n\n` +
        `Important: the absence of FGFR2, IDH1, KRAS is clinically significant ` +
        `and must be listed in not_detected if absent.\n\n` +
        `Document text: ${body}`
      );

    case "LAB_RESULTS":
      return (
        `This is a lab results document. Extract:\n` +
        `{\n` +
        `  "summary": "2-3 sentence plain-language summary",\n` +
        `  "abnormal_values": [\n` +
        `    { "test": "name", "value": "result with units",\n` +
        `      "status": "HIGH or LOW",\n` +
        `      "plain_language": "what this means in one plain sentence" }\n` +
        `  ],\n` +
        `  "normal_values_summary": "one sentence summarizing what was normal",\n` +
        `  "pattern": "if there is a clinical pattern (e.g. cholestatic), describe it in plain language",\n` +
        `  "action_items": ["specific follow-up steps mentioned in the document"]\n` +
        `}\n\n` +
        `Document text: ${body}`
      );

    case "PROCEDURE_REPORT":
      return (
        `This is a procedure report. Extract:\n` +
        `{\n` +
        `  "summary": "2-3 sentence plain-language summary of what was done",\n` +
        `  "what_was_found": "plain-language description of findings",\n` +
        `  "what_was_done": "plain-language description of the procedure",\n` +
        `  "action_items": ["each recommendation from the report as a separate action item"],\n` +
        `  "follow_up": "when and why follow-up is needed"\n` +
        `}\n\n` +
        `Document text: ${body}`
      );

    case "IMAGING_REPORT":
      return (
        `This is an imaging report (CT, MRI, X-ray, PET). Extract:\n` +
        `{\n` +
        `  "summary": "2-3 sentence plain-language summary of what the scan showed",\n` +
        `  "key_findings": ["each significant finding in plain language"],\n` +
        `  "what_is_normal": "one sentence on what was normal",\n` +
        `  "action_items": ["recommendations from the radiologist"],\n` +
        `  "urgency": "routine, follow-up needed, or urgent"\n` +
        `}\n\n` +
        `Document text: ${body}`
      );

    case "CLINICAL_NOTE":
      return (
        `This is a clinical note or hospital record. Extract:\n` +
        `{\n` +
        `  "summary": "2-3 sentence plain-language summary",\n` +
        `  "reason_for_visit": "why the patient was seen",\n` +
        `  "key_findings": ["important things discovered during this visit"],\n` +
        `  "what_was_done": "treatments or procedures performed",\n` +
        `  "action_items": ["specific follow-up instructions from the note"],\n` +
        `  "medications_mentioned": ["any medications started, stopped, or changed"]\n` +
        `}\n\n` +
        `Document text: ${body}`
      );

    case "OTHER":
    default:
      return (
        `Summarize this document in plain language for a family caregiver.\n` +
        `{\n` +
        `  "summary": "3-4 sentence plain-language summary",\n` +
        `  "key_findings": ["important points from the document"],\n` +
        `  "action_items": ["any recommended next steps"]\n` +
        `}\n\n` +
        `Document text: ${body}`
      );
  }
}

// ── Extraction ────────────────────────────────────────────────────────────────

async function extractStructuredData(
  client: Anthropic,
  type: DocumentType,
  text: string
): Promise<Record<string, unknown>> {
  const prompt = buildExtractionPrompt(type, text);
  try {
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });
    const block = res.content[0];
    const raw = block?.type === "text" ? block.text : "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return {};
    return JSON.parse(match[0]) as Record<string, unknown>;
  } catch {
    return {};
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const supabase = await createClient();
  const user = await getUserFromRequest();

  if (!user) {
    console.warn(
      JSON.stringify({
        route: ROUTE,
        method: request.method,
        event: "unauthorized",
        userId: "none",
        timestamp: new Date().toISOString(),
      })
    );
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  if (!ALLOWED_ROLES.includes(user.role)) {
    console.warn(
      JSON.stringify({
        route: ROUTE,
        method: request.method,
        event: "unauthorized",
        userId: user.id,
        timestamp: new Date().toISOString(),
      })
    );
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }

  const organizationId = user.organization_id;

  let rateLimitPassed = true;
  try {
    const { success } = await analyzeLimiter.limit(user.id);
    rateLimitPassed = success;
  } catch {
    rateLimitPassed = true;
  }
  if (!rateLimitPassed) {
    return NextResponse.json({ error: "Rate limited", code: "RATE_LIMITED" }, { status: 429 });
  }

  let documentId: string;
  let patientId: string;
  try {
    const body = await request.json();
    documentId = body.documentId;
    patientId = body.patientId;
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string; stack?: string };
    console.error(
      JSON.stringify({
        route: ROUTE,
        method: request.method,
        error: err?.message ?? String(error),
        userId: user.id,
        timestamp: new Date().toISOString(),
        step: "parse_request_body",
      })
    );
    return NextResponse.json({ error: "Invalid request body", code: "BAD_REQUEST" }, { status: 400 });
  }

  if (!documentId || !patientId) {
    return NextResponse.json(
      { error: "documentId and patientId are required", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  const { data: doc } = await supabase
    .from("documents")
    .select("id, patient_id, document_category, file_url, file_path, file_type")
    .eq("id", documentId)
    .eq("organization_id", organizationId)
    .single();

  if (!doc) {
    return NextResponse.json({ error: "Document not found", code: "NOT_FOUND" }, { status: 404 });
  }

  // Resolve the download URL — file_url may be a bare storage path.
  const storagePath = (doc.file_path ?? doc.file_url) as string | null;
  if (!storagePath) {
    console.error(
      JSON.stringify({
        route: ROUTE,
        method: request.method,
        error: "Document has no file_path or file_url",
        userId: user.id,
        timestamp: new Date().toISOString(),
        step: "check_file_path",
        documentId,
      })
    );
    return NextResponse.json({ error: "Analysis temporarily unavailable" }, { status: 503 });
  }

  let fetchUrl: string;
  if (storagePath.startsWith("http")) {
    fetchUrl = storagePath;
  } else {
    try {
      fetchUrl = await generateSignedUrl(storagePath);
    } catch (error: unknown) {
      const err = error as { message?: string; code?: string };
      console.error(
        JSON.stringify({
          route: ROUTE,
          method: request.method,
          error: err?.message ?? String(error),
          userId: user.id,
          timestamp: new Date().toISOString(),
          step: "generate_signed_url",
          documentId,
        })
      );
      return NextResponse.json({ error: "Analysis temporarily unavailable" }, { status: 503 });
    }
  }

  let buffer: Buffer;
  try {
    const fileResponse = await fetch(fetchUrl);
    if (!fileResponse.ok) {
      console.error(
        JSON.stringify({
          route: ROUTE,
          method: request.method,
          error: `File fetch returned status ${fileResponse.status}`,
          userId: user.id,
          timestamp: new Date().toISOString(),
          step: "fetch_document_file",
          documentId,
        })
      );
      return NextResponse.json({ error: "Analysis temporarily unavailable" }, { status: 503 });
    }
    buffer = Buffer.from(await fileResponse.arrayBuffer());
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    console.error(
      JSON.stringify({
        route: ROUTE,
        method: request.method,
        error: err?.message ?? String(error),
        userId: user.id,
        timestamp: new Date().toISOString(),
        step: "fetch_document_file",
        documentId,
      })
    );
    return NextResponse.json({ error: "Analysis temporarily unavailable" }, { status: 503 });
  }

  const rawType = (doc.file_type as string | null) ?? "pdf";
  const mimeType = rawType.includes("/") ? rawType : `application/${rawType}`;

  let documentText: string;
  try {
    documentText = await extractText(buffer, mimeType);
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    console.error(
      JSON.stringify({
        route: ROUTE,
        method: request.method,
        error: err?.message ?? String(error),
        userId: user.id,
        timestamp: new Date().toISOString(),
        step: "extract_text",
        documentId,
        mimeType,
      })
    );
    return NextResponse.json({ error: "Analysis temporarily unavailable" }, { status: 503 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Analysis temporarily unavailable" }, { status: 503 });
  }

  const anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // ── Step A: Classify ──────────────────────────────────────────────────────

  const documentType = await classifyDocument(anthropicClient, documentText);

  // ── Step B: Extract (or return static for LEGAL_ADMINISTRATIVE) ───────────

  let structured: Record<string, unknown>;

  if (documentType === "LEGAL_ADMINISTRATIVE") {
    structured = {
      summary:
        "This appears to be a legal or administrative document. Clarifer summarizes clinical records only. " +
        "Please consult your attorney or administrator regarding this document.",
      key_findings: [],
      action_items: [],
    };
  } else {
    structured = await extractStructuredData(anthropicClient, documentType, documentText);
  }

  const summary =
    typeof structured.summary === "string"
      ? structured.summary
      : "Summary not available.";

  const actionItems = Array.isArray(structured.action_items)
    ? (structured.action_items as string[])
    : [];

  // ── Step C: Persist ───────────────────────────────────────────────────────

  await supabase
    .from("documents")
    .update({
      summary: summary.slice(0, 2000),
      document_category: documentType,
      key_findings: structured,
      analysis_status: "complete",
      analyzed_at: new Date().toISOString(),
    })
    .eq("id", documentId);

  // Keep chat_messages in sync for any existing code that reads from there.
  await supabase.from("chat_messages").insert({
    document_id: documentId,
    organization_id: organizationId,
    patient_id: doc.patient_id,
    role: "assistant",
    content: summary,
  });

  await supabase.from("audit_log").insert({
    user_id: user.id,
    patient_id: doc.patient_id,
    action: "AI_ANALYSIS",
    resource_type: "documents",
    resource_id: documentId,
    organization_id: organizationId,
  });

  return NextResponse.json({
    document_type: documentType,
    summary,
    action_items: actionItems,
    ...structured,
  });
}
