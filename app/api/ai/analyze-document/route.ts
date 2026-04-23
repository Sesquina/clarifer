import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { analyzeLimiter } from "@/lib/ratelimit";
import { checkOrigin } from "@/lib/cors";
import { extractText } from "@/lib/documents/extract";
import { buildAnalysisPrompt } from "@/lib/documents/prompt";

export const runtime = "nodejs";

const ALLOWED_ROLES = ["caregiver"];

export async function POST(request: Request) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { data: userRecord } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!userRecord || !ALLOWED_ROLES.includes(userRecord.role ?? "") || !userRecord.organization_id) {
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }

  const organizationId = userRecord.organization_id;

  const { success } = await analyzeLimiter.limit(user.id);
  if (!success) {
    return NextResponse.json({ error: "Rate limited", code: "RATE_LIMITED" }, { status: 429 });
  }

  let documentId: string;
  let patientId: string;
  try {
    const body = await request.json();
    documentId = body.documentId;
    patientId = body.patientId;
  } catch {
    return NextResponse.json({ error: "Invalid request body", code: "BAD_REQUEST" }, { status: 400 });
  }

  if (!documentId || !patientId) {
    return NextResponse.json({ error: "documentId and patientId are required", code: "BAD_REQUEST" }, { status: 400 });
  }

  const { data: doc } = await supabase
    .from("documents")
    .select("id, patient_id, document_category, file_path, mime_type")
    .eq("id", documentId)
    .eq("organization_id", organizationId)
    .single();

  if (!doc) {
    return NextResponse.json({ error: "Document not found", code: "NOT_FOUND" }, { status: 404 });
  }

  if (!doc.file_path) {
    return NextResponse.json({ error: "Analysis temporarily unavailable" }, { status: 503 });
  }

  const { data: fileData, error: downloadError } = await supabase.storage
    .from("documents")
    .download(doc.file_path);

  if (downloadError || !fileData) {
    return NextResponse.json({ error: "Analysis temporarily unavailable" }, { status: 503 });
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());
  const documentText = await extractText(buffer, doc.mime_type ?? "application/pdf");

  const { data: patient } = await supabase
    .from("patients")
    .select("condition_template_id, primary_language")
    .eq("id", patientId)
    .eq("organization_id", organizationId)
    .single();

  let conditionContext = "general medical";
  if (patient?.condition_template_id) {
    const { data: template } = await supabase
      .from("condition_templates")
      .select("ai_context")
      .eq("id", patient.condition_template_id)
      .single();
    if (template?.ai_context) conditionContext = template.ai_context;
  }

  const documentType = doc.document_category ?? "medical document";
  const prompt = buildAnalysisPrompt(documentText, documentType, conditionContext);
  const anthropicClient = new Anthropic();
  const encoder = new TextEncoder();

  const readableStream = new ReadableStream({
    async start(controller) {
      let fullText = "";
      try {
        const stream = anthropicClient.messages.stream({
          model: "claude-opus-4-6",
          max_tokens: 2048,
          messages: [{ role: "user", content: prompt }],
        });

        for await (const chunk of stream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            fullText += chunk.delta.text;
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }

        await supabase.from("chat_messages").insert({
          document_id: documentId,
          organization_id: organizationId,
          patient_id: doc.patient_id,
          role: "assistant",
          content: fullText,
        });

        await supabase.from("documents").update({ analysis_status: "completed" }).eq("id", documentId);

        await supabase.from("audit_log").insert({
          user_id: user.id,
          patient_id: doc.patient_id,
          action: "AI_ANALYSIS",
          resource_type: "documents",
          resource_id: documentId,
          organization_id: organizationId,
        });

        controller.close();
      } catch {
        controller.enqueue(
          encoder.encode(JSON.stringify({ error: "Analysis temporarily unavailable" }))
        );
        controller.close();
      }
    },
  });

  return new Response(readableStream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
