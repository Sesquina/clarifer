import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { summarizeLimiter } from "@/lib/ratelimit";
import { checkOrigin } from "@/lib/cors";
import { getDocumentAnalyzer } from "@/lib/documents/analyze";
import { getUserFromRequest } from "@/lib/auth/get-user";

export const runtime = "nodejs";
export const maxDuration = 60;

// Maps file extensions stored in documents.file_type to MIME types.
// The upload route stores the raw extension (e.g. "pdf", "jpg"), not the MIME type.
const EXT_TO_MIME: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  txt: "text/plain",
  csv: "text/csv",
  md: "text/markdown",
};

const STREAM_SYSTEM_PROMPT = `You are a medical document assistant helping family caregivers understand documents.
Write in plain, simple language a non-medical person can understand.
Use short paragraphs. No markdown. No # headers. No ** bold. No bullet points.
Never mention the patient by name. Never include diagnosis names.
Refer to the person as "the person you are caring for".
You are a caregiver support assistant. You help families understand medical information.
You never diagnose. You never recommend changing medications or dosages.
You never speculate on prognosis or survival.
Always recommend consulting the care team for clinical decisions.`;

const STREAMING_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "no-cache",
  "X-Content-Type-Options": "nosniff",
} as const;

export async function POST(request: Request) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const body = await request.json();

  if (body.warmup) {
    return NextResponse.json({ status: "warm" });
  }

  const supabase = await createClient();
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: userRecord } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!userRecord?.organization_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!["caregiver", "provider"].includes(userRecord.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const organizationId = userRecord.organization_id;

  const { success } = await summarizeLimiter.limit(user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many attempts. Please wait before trying again." }, { status: 429 });
  }

  const { documentId } = body;

  if (!documentId) {
    return NextResponse.json({ error: "Missing documentId" }, { status: 400 });
  }

  // Capture header values before the async boundary so they are available
  // inside ReadableStream start() callbacks.
  const ipAddress = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip");
  const userAgent = request.headers.get("user-agent");

  try {
    const { data: doc } = await supabase
      .from("documents")
      .select("file_url, file_type, patient_id, summary")
      .eq("id", documentId)
      .eq("organization_id", organizationId)
      .single();

    if (!doc?.file_url) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Cache hit: stream the stored summary directly without calling Anthropic.
    if (doc.summary) {
      const encoder = new TextEncoder();
      const cached = doc.summary as string;
      return new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(cached));
            controller.close();
          },
        }),
        { headers: STREAMING_HEADERS }
      );
    }

    // Try to read extracted_text (available after migration 20260617000001_add_extracted_text).
    // Falls back gracefully to the file-download path if the column does not exist yet.
    let extractedText: string | null = null;
    try {
      const { data: textRow } = await supabase
        .from("documents")
        .select("extracted_text")
        .eq("id", documentId)
        .eq("organization_id", organizationId)
        .single();
      extractedText =
        (textRow as { extracted_text?: string | null } | null)?.extracted_text ?? null;
    } catch {
      // Column absent until migration runs; continue to file-download fallback.
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
    const encoder = new TextEncoder();

    if (extractedText) {
      // Fast streaming path: first tokens reach the client in ~2 seconds.
      const stream = await anthropic.messages.stream({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: STREAM_SYSTEM_PROMPT,
        messages: [{ role: "user", content: extractedText }],
      });

      const readable = new ReadableStream({
        async start(controller) {
          let fullText = "";
          try {
            for await (const event of stream) {
              if (
                event.type === "content_block_delta" &&
                event.delta.type === "text_delta"
              ) {
                const chunk = event.delta.text;
                fullText += chunk;
                controller.enqueue(encoder.encode(chunk));
              }
            }
            await supabase
              .from("documents")
              .update({
                summary: fullText,
                analysis_status: "complete",
                analyzed_at: new Date().toISOString(),
              })
              .eq("id", documentId);
            await supabase.from("audit_log").insert({
              user_id: user.id,
              patient_id: doc.patient_id ?? null,
              action: "SELECT",
              resource_type: "document_summary",
              resource_id: documentId,
              organization_id: organizationId,
              ip_address: ipAddress,
              user_agent: userAgent,
              status: "success",
            });
          } catch (err) {
            console.error(
              JSON.stringify({ route: "api/summarize", error: String(err), step: "streaming" })
            );
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readable, { headers: STREAMING_HEADERS });
    }

    // Fallback path: download file and run structured analyzer.
    // Used for images and PDFs uploaded before the extracted_text migration.
    const fileRes = await fetch(doc.file_url);
    if (!fileRes.ok) {
      if (fileRes.status === 403 || fileRes.status === 401) {
        return NextResponse.json(
          { error: "Document expired. Please upload again." },
          { status: 410 }
        );
      }
      return NextResponse.json({ error: "Failed to retrieve document" }, { status: 503 });
    }

    const buffer = Buffer.from(await fileRes.arrayBuffer());
    const base64 = buffer.toString("base64");

    const rawType = (doc.file_type ?? "pdf").toLowerCase();
    const mimeType = rawType.includes("/")
      ? rawType
      : (EXT_TO_MIME[rawType] ?? "application/pdf");

    const result = await Promise.race([
      getDocumentAnalyzer().analyze(base64, mimeType),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("AI timeout")), 25000)
      ),
    ]);

    await supabase
      .from("documents")
      .update({
        summary: result.fullSummary,
        key_findings: result.findings,
        analysis_status: "complete",
        analyzed_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    await supabase.from("audit_log").insert({
      user_id: user.id,
      patient_id: doc.patient_id ?? null,
      action: "SELECT",
      resource_type: "document_summary",
      resource_id: documentId,
      organization_id: organizationId,
      ip_address: ipAddress,
      user_agent: userAgent,
      status: "success",
    });

    const summaryText = result.fullSummary;
    return new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(summaryText));
          controller.close();
        },
      }),
      { headers: STREAMING_HEADERS }
    );
  } catch (err) {
    console.error(JSON.stringify({ route: "api/summarize", error: String(err), step: "outer" }));
    return NextResponse.json({ error: "Failed to summarize" }, { status: 500 });
  }
}
