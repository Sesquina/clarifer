import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic();

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
    const completion = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: `You are a medical document analyzer. Summarize the following medical document clearly and concisely. Extract key findings as a JSON array of {label, value} objects. Return your response in this exact JSON format:
{"summary": "...", "keyFindings": [{"label": "...", "value": "..."}]}`,
      messages: [{ role: "user", content }],
    });

    const responseText = completion.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    let parsed: { summary: string; keyFindings: Array<{ label: string; value: string }> };
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = { summary: responseText, keyFindings: [] };
    }

    // Update document with summary
    await supabase
      .from("documents")
      .update({
        summary: parsed.summary,
        key_findings: parsed.keyFindings,
        analyzed_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Summarize error:", error);
    return NextResponse.json({ error: "Failed to summarize" }, { status: 500 });
  }
}
