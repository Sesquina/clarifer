import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { summarizeLimiter } from "@/lib/ratelimit";
import { checkOrigin } from "@/lib/cors";
import { stripHtml } from "@/lib/sanitize";

export const maxDuration = 60;

const MAX_CONTENT_LENGTH = 50000;

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

  const { documentId, content } = body;

  if (!documentId || !content) {
    return NextResponse.json({ error: "Missing documentId or content" }, { status: 400 });
  }

  if (typeof content === "string" && content.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json({ error: "Content too large. Please shorten your message." }, { status: 400 });
  }

  const sanitizedContent = typeof content === "string" ? stripHtml(content) : content;

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    const completion = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      system: `Be concise. 3-4 sentences for the summary maximum. Key findings only.

You are helping a family caregiver understand a medical document. Analyze and return structured JSON. Use plain, warm language — no jargon without a parenthetical explanation. Start with the most important takeaway.

Return ONLY valid JSON:
{
  "headline": "One-line plain-language takeaway",
  "findings": [
    {"label": "Finding name", "value": "Plain-language explanation", "status": "normal"},
    {"label": "Concerning item", "value": "Plain-language explanation", "status": "flagged"}
  ],
  "fullSummary": "3-4 sentence plain-language summary for a caregiver"
}

Use "flagged" for abnormal values, "normal" for normal values.`,
      messages: [{ role: "user", content: sanitizedContent }],
    });

    const responseText = completion.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    let parsed: {
      headline?: string;
      findings?: Array<{ label: string; value: string; status?: string }>;
      fullSummary?: string;
      summary?: string;
      keyFindings?: Array<{ label: string; value: string; status?: string }>;
    };

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);
    } catch {
      parsed = {
        headline: "Document analyzed",
        findings: [],
        fullSummary: responseText,
      };
    }

    const headline = parsed.headline || parsed.summary || "Document analyzed";
    const keyFindings = parsed.findings || parsed.keyFindings || [];
    const fullSummary = parsed.fullSummary || parsed.summary || responseText;

    const { data: doc } = await supabase
      .from("documents")
      .select("patient_id")
      .eq("id", documentId)
      .eq("organization_id", organizationId)
      .single();

    let symptomConnection: string | null = null;

    if (doc?.patient_id) {
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
          // Non-critical — continue without symptom connection
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
      patient_id: doc?.patient_id ?? null,
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
