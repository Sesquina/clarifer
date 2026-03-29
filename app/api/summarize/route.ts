import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await request.json();

  if (body.warmup) {
    return NextResponse.json({ status: "warm" });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId, content } = body;

  if (!documentId || !content) {
    return NextResponse.json({ error: "Missing documentId or content" }, { status: 400 });
  }

  if (typeof content === "string" && content.length > 100000) {
    return NextResponse.json({ error: "Content exceeds maximum length" }, { status: 400 });
  }

  // Strip HTML tags from content before processing
  const sanitizedContent = typeof content === "string" ? content.replace(/<[^>]*>/g, "") : content;

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    // Step 1: Summarize the document
    const completion = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
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

    // Step 2: Get patient context for symptom connection
    const { data: doc } = await supabase
      .from("documents")
      .select("patient_id")
      .eq("id", documentId)
      .single();

    let symptomConnection: string | null = null;

    if (doc?.patient_id) {
      const [patientResult, logResult] = await Promise.all([
        supabase.from("patients").select("name, custom_diagnosis").eq("id", doc.patient_id).single(),
        supabase.from("symptom_logs").select("symptoms, overall_severity, ai_summary").eq("patient_id", doc.patient_id).order("created_at", { ascending: false }).limit(1).single(),
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
            model: "claude-sonnet-4-20250514",
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
        } catch (err) {
          console.error("Symptom connection error:", err);
        }
      }
    }

    // Update document
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

    return NextResponse.json({
      summary: fullSummary,
      headline,
      keyFindings,
      symptomConnection,
    });
  } catch (error) {
    console.error("Summarize error:", error);
    return NextResponse.json({ error: "Failed to summarize" }, { status: 500 });
  }
}
