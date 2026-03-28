import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId, content } = await request.json();

  if (!documentId || !content) {
    return NextResponse.json({ error: "Missing documentId or content" }, { status: 400 });
  }

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    const completion = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: `You are a medical document analyzer. Analyze the following medical document and return a structured JSON response.

Return ONLY valid JSON in this exact format:
{
  "headline": "One-line summary of the document",
  "findings": [
    {"label": "Finding name", "value": "Finding detail", "status": "normal"},
    {"label": "Flagged item", "value": "Detail", "status": "flagged"}
  ],
  "fullSummary": "2-3 paragraph detailed summary"
}

Use "status": "flagged" for abnormal/concerning values and "status": "normal" for normal values.`,
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

    const summary = parsed.headline || parsed.summary || "Document analyzed";
    const keyFindings = parsed.findings || parsed.keyFindings || [];
    const fullSummary = parsed.fullSummary || parsed.summary || responseText;

    await supabase
      .from("documents")
      .update({
        summary: fullSummary,
        key_findings: keyFindings,
        analyzed_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    return NextResponse.json({
      summary: fullSummary,
      headline: summary,
      keyFindings,
    });
  } catch (error) {
    console.error("Summarize error:", error);
    return NextResponse.json({ error: "Failed to summarize" }, { status: 500 });
  }
}
