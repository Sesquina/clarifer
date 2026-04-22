import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { summarizeLimiter } from "@/lib/ratelimit";
import { checkOrigin } from "@/lib/cors";

export const maxDuration = 60;

const MAX_CONTENT_LENGTH = 50000;

export async function POST(request: Request) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success } = await summarizeLimiter.limit(user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many attempts. Please wait before trying again." }, { status: 429 });
  }

  const body = await request.json();
  const { documentId, content } = body;

  if (!documentId || !content) {
    return NextResponse.json({ error: "Missing documentId or content" }, { status: 400 });
  }

  if (typeof content === "string" && content.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json({ error: "Content too large." }, { status: 400 });
  }

  // Verify the document exists and belongs to a patient this user can access
  const { data: doc } = await supabase
    .from("documents")
    .select("id, patient_id")
    .eq("id", documentId)
    .single();

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

    const completion = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      system: `Be concise. 3-4 sentences for the summary maximum. Key findings only.

You are helping a family caregiver understand a medical document. Analyze and return structured JSON. Use plain, warm language — no jargon without a parenthetical explanation. Start with the most important takeaway.

Return ONLY valid JSON:
{
  "headline": "One-line plain-language takeaway",
  "findings": [
    {"label": "Finding name", "value": "Plain-language explanation", "status": "normal"}
  ],
  "fullSummary": "3-4 sentence plain-language summary for a caregiver"
}

Use "flagged" for abnormal values, "normal" for normal values.`,
      messages: [{ role: "user", content }],
    });

    const responseText = completion.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    let parsed: {
      headline?: string;
      findings?: Array<{ label: string; value: string; status?: string }>;
      fullSummary?: string;
    };

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);
    } catch {
      parsed = { headline: "Document analyzed", findings: [], fullSummary: responseText };
    }

    const headline = parsed.headline || "Document analyzed";
    const keyFindings = parsed.findings || [];
    const fullSummary = parsed.fullSummary || responseText;

    // Link the summary to the source document by documentId
    await supabase
      .from("documents")
      .update({
        summary: fullSummary,
        key_findings: keyFindings,
        analyzed_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    return NextResponse.json({
      documentId,
      summary: fullSummary,
      headline,
      keyFindings,
    });
  } catch {
    return NextResponse.json({ error: "Failed to analyze document" }, { status: 500 });
  }
}
