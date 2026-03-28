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

  const { message, patientId } = await request.json();

  if (!message || !patientId) {
    return NextResponse.json({ error: "Missing message or patientId" }, { status: 400 });
  }

  // Fetch patient context
  const [patientResult, logsResult, medsResult, docsResult] = await Promise.all([
    supabase.from("patients").select("*, condition_templates(*)").eq("id", patientId).single(),
    supabase.from("symptom_logs").select("*").eq("patient_id", patientId).order("created_at", { ascending: false }).limit(5),
    supabase.from("medications").select("*").eq("patient_id", patientId).eq("is_active", true),
    supabase.from("documents").select("title, summary, document_category").eq("patient_id", patientId).order("uploaded_at", { ascending: false }).limit(5),
  ]);

  const patient = patientResult.data;
  const template = patient?.condition_templates;

  const systemPrompt = `You are Medalyn, an AI health companion. You help patients and caregivers understand their health information, track symptoms, and navigate their care journey.

IMPORTANT RULES:
- You are NOT a doctor. Always recommend consulting healthcare providers for medical decisions.
- Be empathetic, clear, and concise. Use plain language.
- When discussing symptoms or medications, reference the patient's actual data when available.
- If you don't know something, say so. Never fabricate medical information.

PATIENT CONTEXT:
- Name: ${patient?.name || "Unknown"}
- Diagnosis: ${patient?.custom_diagnosis || "Not specified"}
- Diagnosis date: ${patient?.diagnosis_date || "Not specified"}
${template?.ai_context ? `- Condition context: ${template.ai_context}` : ""}

RECENT SYMPTOMS:
${logsResult.data?.map((l) => `- ${l.created_at}: severity ${l.overall_severity}/10, ${JSON.stringify(l.symptoms)}`).join("\n") || "None recorded"}

ACTIVE MEDICATIONS:
${medsResult.data?.map((m) => `- ${m.name} ${m.dose || ""} ${m.frequency || ""}`).join("\n") || "None recorded"}

RECENT DOCUMENTS:
${docsResult.data?.map((d) => `- ${d.title} (${d.document_category}): ${d.summary || "No summary"}`).join("\n") || "None uploaded"}`;

  // Save user message
  await supabase.from("chat_messages").insert({
    user_id: user.id,
    patient_id: patientId,
    role: "user",
    content: message,
  });

  try {
    const completion = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: message }],
    });

    const responseText = completion.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    // Save assistant message
    await supabase.from("chat_messages").insert({
      user_id: user.id,
      patient_id: patientId,
      role: "assistant",
      content: responseText,
    });

    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }
}
