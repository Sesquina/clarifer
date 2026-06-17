/**
 * app/api/ai/analyze-document/route.ts
 * POST /api/ai/analyze-document
 * Streams an AI analysis of an uploaded document.
 * Tables: documents (read/write), patients (read), condition_templates (read),
 *         chat_messages (write), audit_log (write), users (read)
 * Auth: caregiver
 * HIPAA: PHI document. Auth + role + org_id enforced. audit_log written on every analysis.
 */
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { getUserFromRequest } from '@/lib/auth/get-user';
import { analyzeLimiter } from "@/lib/ratelimit";
import { checkOrigin } from "@/lib/cors";
import { extractText } from "@/lib/documents/extract";
import { buildAnalysisPrompt } from "@/lib/documents/prompt";
import { generateSignedUrl } from "@/lib/documents/storage";

export const runtime = "nodejs";
export const maxDuration = 60;

const ROUTE = 'api/ai/analyze-document';

const ALLOWED_ROLES = ["caregiver"];

export async function POST(request: Request) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  console.log("[analyze-document] ANTHROPIC_API_KEY present:", !!process.env.ANTHROPIC_API_KEY);

  const supabase = await createClient();
  const user = await getUserFromRequest(request);

  if (!user) {
    console.warn(JSON.stringify({
      route: ROUTE,
      method: request.method,
      event: 'unauthorized',
      userId: 'none',
      timestamp: new Date().toISOString(),
    }));
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { data: userRecord } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!userRecord || !ALLOWED_ROLES.includes(userRecord.role ?? "") || !userRecord.organization_id) {
    console.warn(JSON.stringify({
      route: ROUTE,
      method: request.method,
      event: 'unauthorized',
      userId: user.id,
      timestamp: new Date().toISOString(),
    }));
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }

  const organizationId = userRecord.organization_id;

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
  } catch (error: any) {
    console.error(JSON.stringify({
      route: ROUTE,
      method: request.method,
      error: error?.message ?? String(error),
      code: error?.code ?? null,
      stack: error?.stack?.split('\n').slice(0, 3).join(' | ') ?? null,
      userId: user.id,
      timestamp: new Date().toISOString(),
      step: 'parse_request_body',
    }));
    return NextResponse.json({ error: "Invalid request body", code: "BAD_REQUEST" }, { status: 400 });
  }

  if (!documentId || !patientId) {
    return NextResponse.json({ error: "documentId and patientId are required", code: "BAD_REQUEST" }, { status: 400 });
  }

  const { data: doc } = await supabase
    .from("documents")
    .select("id, patient_id, document_category, file_url, file_type")
    .eq("id", documentId)
    .eq("organization_id", organizationId)
    .single();

  if (!doc) {
    return NextResponse.json({ error: "Document not found", code: "NOT_FOUND" }, { status: 404 });
  }

  if (!doc.file_url) {
    console.error(JSON.stringify({
      route: ROUTE,
      method: request.method,
      error: 'Document has no file_url',
      code: null,
      stack: null,
      userId: user.id,
      timestamp: new Date().toISOString(),
      step: 'check_file_url',
      documentId,
    }));
    return NextResponse.json({ error: "Analysis temporarily unavailable" }, { status: 503 });
  }

  // FIX: Documents uploaded via /api/documents/upload store a bare storage path
  // (e.g. "org-id/patient-id/uuid.pdf"), not an absolute URL. fetch() on a relative
  // path throws TypeError: Only absolute URLs are supported, causing a 500.
  // Generate a fresh signed URL whenever file_url is not already an absolute URL.
  let fetchUrl = doc.file_url;
  if (!fetchUrl.startsWith("http")) {
    try {
      fetchUrl = await generateSignedUrl(doc.file_url);
    } catch (error: any) {
      console.error(JSON.stringify({
        route: ROUTE,
        method: request.method,
        error: error?.message ?? String(error),
        code: error?.code ?? null,
        stack: error?.stack?.split('\n').slice(0, 3).join(' | ') ?? null,
        userId: user.id,
        timestamp: new Date().toISOString(),
        step: 'generate_signed_url',
        documentId,
      }));
      return NextResponse.json({ error: "Analysis temporarily unavailable" }, { status: 503 });
    }
  }

  let buffer: Buffer;
  try {
    const fileResponse = await fetch(fetchUrl);
    if (!fileResponse.ok) {
      console.error(JSON.stringify({
        route: ROUTE,
        method: request.method,
        error: `File fetch returned status ${fileResponse.status}`,
        code: String(fileResponse.status),
        stack: null,
        userId: user.id,
        timestamp: new Date().toISOString(),
        step: 'fetch_document_file',
        documentId,
      }));
      return NextResponse.json({ error: "Analysis temporarily unavailable" }, { status: 503 });
    }
    buffer = Buffer.from(await fileResponse.arrayBuffer());
  } catch (error: any) {
    console.error(JSON.stringify({
      route: ROUTE,
      method: request.method,
      error: error?.message ?? String(error),
      code: error?.code ?? null,
      stack: error?.stack?.split('\n').slice(0, 3).join(' | ') ?? null,
      userId: user.id,
      timestamp: new Date().toISOString(),
      step: 'fetch_document_file',
      documentId,
    }));
    return NextResponse.json({ error: "Analysis temporarily unavailable" }, { status: 503 });
  }

  const rawType = doc.file_type ?? "pdf";
  const mimeType = rawType.includes("/") ? rawType : `application/${rawType}`;
  let documentText: string;
  try {
    documentText = await extractText(buffer, mimeType);
  } catch (error: any) {
    console.error(JSON.stringify({
      route: ROUTE,
      method: request.method,
      error: error?.message ?? String(error),
      code: error?.code ?? null,
      stack: error?.stack?.split('\n').slice(0, 3).join(' | ') ?? null,
      userId: user.id,
      timestamp: new Date().toISOString(),
      step: 'extract_text',
      documentId,
      mimeType,
    }));
    return NextResponse.json({ error: "Analysis temporarily unavailable" }, { status: 503 });
  }

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

  let anthropicClient: Anthropic;
  try {
    anthropicClient = new Anthropic();
  } catch (error: any) {
    console.error(JSON.stringify({
      route: ROUTE,
      method: request.method,
      error: error?.message ?? String(error),
      code: error?.code ?? null,
      stack: error?.stack?.split('\n').slice(0, 3).join(' | ') ?? null,
      userId: user.id,
      timestamp: new Date().toISOString(),
      step: 'init_anthropic_client',
    }));
    return NextResponse.json({ error: "Analysis temporarily unavailable" }, { status: 503 });
  }

  const documentType = doc.document_category ?? "medical document";
  const prompt = buildAnalysisPrompt(documentText, documentType, conditionContext);
  const encoder = new TextEncoder();

  const readableStream = new ReadableStream({
    async start(controller) {
      let fullText = "";
      try {
        await Promise.race([
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("AI timeout")), 25000)
          ),
          (async () => {
            const stream = anthropicClient.messages.stream({
              model: "claude-sonnet-4-6",
              max_tokens: 1000,
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

            await supabase.from("documents").update({
              summary: fullText.slice(0, 1000),
              analyzed_at: new Date().toISOString(),
            }).eq("id", documentId);

            await supabase.from("audit_log").insert({
              user_id: user.id,
              patient_id: doc.patient_id,
              action: "AI_ANALYSIS",
              resource_type: "documents",
              resource_id: documentId,
              organization_id: organizationId,
            });
          })(),
        ]);
        controller.close();
      } catch (error: any) {
        console.error(JSON.stringify({
          route: ROUTE,
          method: request.method,
          error: error?.message ?? String(error),
          code: error?.code ?? null,
          stack: error?.stack?.split('\n').slice(0, 3).join(' | ') ?? null,
          userId: user.id,
          timestamp: new Date().toISOString(),
          step: 'ai_stream',
          documentId,
        }));
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
