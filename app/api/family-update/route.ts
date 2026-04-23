import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { familyUpdateLimiter } from "@/lib/ratelimit";
import { checkOrigin } from "@/lib/cors";

export const maxDuration = 30;

const MAX_CONTENT_LENGTH = 50000;

export async function POST(request: Request) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userRecord } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!userRecord?.organization_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const organizationId = userRecord.organization_id;

    const { success } = await familyUpdateLimiter.limit(user.id);
    if (!success) {
      return NextResponse.json({ error: "Too many attempts. Please wait before trying again." }, { status: 429 });
    }

    const { patientId } = await request.json();

    if (!patientId || typeof patientId !== "string") {
      return NextResponse.json({ error: "patientId is required" }, { status: 400 });
    }

    const [patientResult, symptomResult, medicationsResult] = await Promise.all([
      supabase.from("patients").select("name, custom_diagnosis").eq("id", patientId).eq("organization_id", organizationId).single(),
      supabase.from("symptom_logs").select("symptoms, overall_severity, ai_summary, created_at").eq("patient_id", patientId).eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("medications").select("name, dose, frequency, indication").eq("patient_id", patientId).eq("organization_id", organizationId).eq("is_active", true),
    ]);

    if (patientResult.error || !patientResult.data) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const patient = patientResult.data;
    const recentSymptom = symptomResult.data;
    const medications = medicationsResult.data;

    const symptomSummary = recentSymptom?.ai_summary
      || (recentSymptom?.symptoms ? JSON.stringify(recentSymptom.symptoms) : "None logged recently");

    const medList = medications && medications.length > 0
      ? medications.map((m) => [m.name, m.dose, m.frequency].filter(Boolean).join(" ")).join(", ")
      : "None listed";

    const userMessage = `Patient name: ${patient.name}. Diagnosis: ${patient.custom_diagnosis || "Not specified"}. Recent symptoms: ${symptomSummary}. Current medications: ${medList}.`;

    if (userMessage.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json({ error: "Content too large. Please shorten your message." }, { status: 400 });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
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
        } catch {
          controller.enqueue(encoder.encode("Sorry, something went wrong generating the update."));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Transfer-Encoding": "chunked" },
    });
  } catch {
    return NextResponse.json({ error: "Failed to generate family update" }, { status: 500 });
  }
}
