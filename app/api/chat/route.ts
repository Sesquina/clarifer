import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { messages, patientId } = await req.json();

    const supabase = await createClient();

    // Get patient and condition template
    const { data: patient } = await supabase
      .from("patients")
      .select("*, condition_templates(*)")
      .eq("id", patientId)
      .single();

    const systemPrompt = patient
      ? `You are a compassionate AI assistant supporting a caregiver. Patient name: ${patient.name}. Diagnosis: ${patient.custom_diagnosis || patient.condition_templates?.name || "unknown"}. ${patient.condition_templates?.ai_context || ""} Always respond in plain language. Never use medical jargon without explaining it. Be warm and supportive.`
      : "You are a compassionate AI assistant supporting a caregiver.";

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1024,
            system: systemPrompt,
            messages: messages.map((m: { role: string; content: string }) => ({
              role: m.role,
              content: m.content,
            })),
            stream: true,
          });

          for await (const event of response) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          console.error("Stream error:", err);
          controller.enqueue(
            encoder.encode("Sorry, something went wrong.")
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
