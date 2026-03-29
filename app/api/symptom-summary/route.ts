import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";
import { stripHtml } from "@/lib/sanitize";

const anthropic = new Anthropic();

export async function POST(request: Request) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { symptoms, severity, notes } = await request.json();

  if (!symptoms) {
    return NextResponse.json({ error: "Missing symptoms" }, { status: 400 });
  }

  const sanitizedSymptoms = stripHtml(String(symptoms));
  const sanitizedNotes = stripHtml(String(notes || "None"));

  if (sanitizedSymptoms.length > 50000) {
    return NextResponse.json({ error: "Content too large. Please shorten your message." }, { status: 400 });
  }

  try {
    const completion = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 256,
      system: "You are a medical symptom summarizer. Given symptoms, severity, and notes, produce a brief 1-2 sentence clinical-style summary suitable for a doctor to quickly review. Be factual and concise.",
      messages: [
        {
          role: "user",
          content: `Symptoms: ${sanitizedSymptoms}\nSeverity: ${severity}/10\nNotes: ${sanitizedNotes}`,
        },
      ],
    });

    const summary = completion.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    return NextResponse.json({ summary });
  } catch {
    return NextResponse.json({ summary: null });
  }
}
