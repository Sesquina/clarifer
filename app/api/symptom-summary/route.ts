import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic();

export async function POST(request: Request) {
  const { symptoms, severity, notes } = await request.json();

  if (!symptoms) {
    return NextResponse.json({ error: "Missing symptoms" }, { status: 400 });
  }

  try {
    const completion = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 256,
      system: "You are a medical symptom summarizer. Given symptoms, severity, and notes, produce a brief 1-2 sentence clinical-style summary suitable for a doctor to quickly review. Be factual and concise.",
      messages: [
        {
          role: "user",
          content: `Symptoms: ${symptoms}\nSeverity: ${severity}/10\nNotes: ${notes || "None"}`,
        },
      ],
    });

    const summary = completion.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Symptom summary error:", error);
    return NextResponse.json({ summary: null });
  }
}
