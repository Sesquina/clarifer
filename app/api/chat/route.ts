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
      ? `You are Medalyn, a compassionate AI assistant built specifically for caregivers and patients navigating serious illness.

The person you are speaking with is caring for ${patient.name}, who has been diagnosed with ${patient.custom_diagnosis || patient.condition_templates?.name || "a serious illness"}.

You already know this context. Never ask who they are caring for or whether they are a caregiver — you know. Never ask if they want more information — just provide it.

Speak directly and warmly, as if you are a knowledgeable friend who has been supporting this family for months. Use plain language. Never use jargon without explaining it immediately after.

When giving medical information, always relate it back to ${patient.name}'s specific situation when possible.

${patient.condition_templates?.ai_context || ""}

Important: End your responses naturally. Do not add generic offers like "let me know if you need more information" or "I am here to help" — the user knows this. Just answer the question completely and stop.`
      : `You are Medalyn, a compassionate AI assistant for caregivers and patients navigating serious illness. Speak warmly and directly. Use plain language always.`;

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
