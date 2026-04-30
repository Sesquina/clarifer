import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { summarizeLimiter } from "@/lib/ratelimit";
import { checkOrigin } from "@/lib/cors";
import { getDocumentAnalyzer } from "@/lib/documents/analyze";

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

export async function POST(request: Request) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const body = await request.json();

  if (body.warmup) {
    return NextResponse.json({ status: "warm" });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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

  try {
    // Fetch document metadata and file location in one query.
    const { data: doc } = await supabase
      .from("documents")
      .select("file_url, file_type, patient_id")
      .eq("id", documentId)
      .eq("organization_id", organizationId)
      .single();

    if (!doc?.file_url) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Download the file from the signed URL stored at upload time.
    // Signed URLs expire after 3600 seconds. A 403 here means the URL
    // expired before analysis ran -- rare in practice but handled explicitly.
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

    // Normalize extension to full MIME type so analyze.ts can branch correctly.
    const rawType = (doc.file_type ?? "pdf").toLowerCase();
    const mimeType = rawType.includes("/")
      ? rawType
      : (EXT_TO_MIME[rawType] ?? "application/pdf");

    const result = await getDocumentAnalyzer().analyze(base64, mimeType);
    const headline = result.headline;
    const keyFindings = result.findings;
    const fullSummary = result.fullSummary;

    let symptomConnection: string | null = null;

    if (doc.patient_id) {
      const [patientResult, logResult] = await Promise.all([
        supabase.from("patients").select("name, custom_diagnosis").eq("id", doc.patient_id).eq("organization_id", organizationId).single(),
        supabase.from("symptom_logs").select("symptoms, overall_severity, ai_summary").eq("patient_id", doc.patient_id).eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(1).single(),
      ]);

      const patient = patientResult.data;
      const recentLog = logResult.data;

      if (patient?.custom_diagnosis && keyFindings.length > 0) {
        const findingsText = keyFindings.map((f) => `${f.label}: ${f.value}`).join("; ");
        const symptomsText = recentLog
          ? `Recent symptoms: severity ${recentLog.overall_severity}/10. ${recentLog.ai_summary || JSON.stringify(recentLog.symptoms)}`
          : "No recent symptom logs available.";

        try {
          const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
          const connectionResult = await anthropic.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 300,
            system: "You are a warm, knowledgeable medical assistant helping a family caregiver. Write in plain language. Be practical and caring.",
            messages: [{
              role: "user",
              content: `Based on these lab findings: ${findingsText}

And this patient's diagnosis of ${patient.custom_diagnosis}:

${symptomsText}

What symptoms might ${patient.name || "the patient"} be experiencing that are connected to these results? Write 2-3 sentences in plain language for a caregiver. Be warm and practical. Mention what to watch for and when to call the doctor. Do not use medical jargon without explaining it.`,
            }],
          });

          symptomConnection = connectionResult.content
            .filter((block): block is Anthropic.TextBlock => block.type === "text")
            .map((block) => block.text)
            .join("");
        } catch {
          // Non-critical -- continue without symptom connection
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      summary: fullSummary,
      key_findings: keyFindings,
      analyzed_at: new Date().toISOString(),
    };
    if (symptomConnection) {
      updateData.symptom_connection = symptomConnection;
    }

    await supabase
      .from("documents")
      .update(updateData)
      .eq("id", documentId);

    await supabase.from("audit_log").insert({
      user_id: user.id,
      patient_id: doc.patient_id ?? null,
      action: "SELECT",
      resource_type: "document_summary",
      resource_id: documentId,
      organization_id: organizationId,
      ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
      user_agent: request.headers.get("user-agent"),
      status: "success",
    });

    return NextResponse.json({
      summary: fullSummary,
      headline,
      keyFindings,
      symptomConnection,
    });
  } catch {
    return NextResponse.json({ error: "Failed to summarize" }, { status: 500 });
  }
}
