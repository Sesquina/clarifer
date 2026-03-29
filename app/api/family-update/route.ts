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

    if (!patientId) {
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

    // Build user message with available context, omitting missing sections
    const contextParts: string[] = [];

    contextParts.push(`Patient name: ${patient.name}`);

    if (patient.custom_diagnosis) {
      contextParts.push(`Diagnosis: ${patient.custom_diagnosis}`);
    }

    if (recentSymptom) {
      const symptomLines: string[] = ["Recent symptom log:"];
      if (recentSymptom.created_at) {
        symptomLines.push(`  Date: ${recentSymptom.created_at}`);
      }
      if (recentSymptom.overall_severity != null) {
        symptomLines.push(`  Overall severity: ${recentSymptom.overall_severity}/10`);
      }
      if (recentSymptom.symptoms) {
        symptomLines.push(`  Symptoms: ${JSON.stringify(recentSymptom.symptoms)}`);
      }
      if (recentSymptom.ai_summary) {
        symptomLines.push(`  Summary: ${recentSymptom.ai_summary}`);
      }
      contextParts.push(symptomLines.join("\n"));
    }

    if (medications && medications.length > 0) {
      const medLines = medications.map((med) => {
        const parts = [med.name];
        if (med.dose) parts.push(med.dose);
        if (med.frequency) parts.push(med.frequency);
        if (med.indication) parts.push(`for ${med.indication}`);
        return `  - ${parts.join(", ")}`;
      });
      contextParts.push(`Active medications:\n${medLines.join("\n")}`);
    }

    const userMessage = contextParts.join("\n\n");

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system:
        "You are writing a warm, plain-language family update message on behalf of a caregiver. Write in first person as if the caregiver is sending this to family members. Be honest but gentle. Keep it under 200 words. Do not use medical jargon without explaining it.",
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ message: responseText });
  } catch (error) {
    console.error("Family update error:", error);
    return NextResponse.json(
      { error: "Failed to generate family update" },
      { status: 500 }
    );
  }
}
