import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit } from "@/lib/rate-limit";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkRateLimit(user.id)) {
      return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
    }

    const { patientId } = await request.json();

    if (!patientId || typeof patientId !== "string") {
      return NextResponse.json(
        { error: "patientId is required" },
        { status: 400 }
      );
    }

    // Fetch patient, most recent symptom log, and active medications in parallel
    const [patientResult, symptomResult, medicationsResult] = await Promise.all([
      supabase
        .from("patients")
        .select("name, custom_diagnosis")
        .eq("id", patientId)
        .single(),
      supabase
        .from("symptom_logs")
        .select("symptoms, overall_severity, ai_summary, created_at")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("medications")
        .select("name, dose, frequency, indication")
        .eq("patient_id", patientId)
        .eq("is_active", true),
    ]);

    if (patientResult.error || !patientResult.data) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    const patient = patientResult.data;
    const recentSymptom = symptomResult.data;
    const medications = medicationsResult.data;

    // Build concise context for the prompt
    const symptomSummary = recentSymptom?.ai_summary
      || (recentSymptom?.symptoms ? JSON.stringify(recentSymptom.symptoms) : "None logged recently");

    const medList = medications && medications.length > 0
      ? medications.map((m) => [m.name, m.dose, m.frequency].filter(Boolean).join(" ")).join(", ")
      : "None listed";

    const userMessage = `Patient name: ${patient.name}. Diagnosis: ${patient.custom_diagnosis || "Not specified"}. Recent symptoms: ${symptomSummary}. Current medications: ${medList}.`;

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 300,
            system: [{ type: "text", text: "Write a warm, plain-language family update from a caregiver's perspective in under 150 words. Keep it conversational, hopeful where honest, and end with an invitation for family to reach out with questions.", cache_control: { type: "ephemeral" } }],
            messages: [{ role: "user", content: userMessage }],
            stream: true,
          });

          for await (const event of response) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          console.error("Family update stream error:", err);
          controller.enqueue(encoder.encode("Sorry, something went wrong generating the update."));
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
  } catch (error) {
    console.error("Family update error:", error);
    return NextResponse.json(
      { error: "Failed to generate family update" },
      { status: 500 }
    );
  }
}
