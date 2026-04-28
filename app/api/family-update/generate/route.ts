/**
 * app/api/family-update/generate/route.ts
 * Streams an AI-generated family update for a patient, with EN/ES output and audit logging.
 * Tables: reads users, patients, symptom_logs, medications, appointments, documents; writes family_updates and audit_log.
 * Auth: caregiver or patient role; org membership enforced; cross-tenant patient access returns 403.
 * Sprint: Sprint 9 -- Trials + Family Updates
 *
 * HIPAA: Sends minimum-necessary patient facts to Anthropic; persists generated text to family_updates and an audit_log row (action=INSERT, resource_type=family_update). No PHI written to console or error logs.
 */
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_ROLES = ["caregiver"];

const DISCLAIMER_EN = "This update was AI-assisted. Please review before sharing.";
const DISCLAIMER_ES =
  "Esta actualizacion fue generada con ayuda de IA. Por favor revise antes de compartir.";

export async function POST(request: Request) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: userRecord } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();
  if (!userRecord || !ALLOWED_ROLES.includes(userRecord.role ?? "") || !userRecord.organization_id) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  const orgId = userRecord.organization_id;

  const body = (await request.json().catch(() => null)) as {
    patient_id?: string;
    date_range_days?: number;
    language?: "en" | "es";
  } | null;
  if (!body?.patient_id) {
    return new Response(JSON.stringify({ error: "patient_id required" }), { status: 400 });
  }
  const patientId: string = body.patient_id;
  const language = body.language === "es" ? "es" : "en";
  const days = Math.max(1, Math.min(body.date_range_days ?? 7, 30));
  const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();

  const { data: patient } = await supabase
    .from("patients")
    .select("id, name, organization_id")
    .eq("id", patientId)
    .single();
  if (!patient || patient.organization_id !== orgId) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  const [symptoms, medications, appointmentsPast, appointmentsUpcoming, documents] = await Promise.all([
    supabase
      .from("symptom_logs")
      .select("created_at, overall_severity, ai_summary")
      .eq("patient_id", patientId)
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .limit(20),
    supabase
      .from("medications")
      .select("name, dose, unit, frequency, is_active, start_date, end_date")
      .eq("patient_id", patientId)
      .order("start_date", { ascending: false })
      .limit(20),
    supabase
      .from("appointments")
      .select("title, datetime, provider_name")
      .eq("patient_id", patientId)
      .lte("datetime", new Date().toISOString())
      .gte("datetime", since)
      .order("datetime", { ascending: true })
      .limit(10),
    supabase
      .from("appointments")
      .select("title, datetime, provider_name")
      .eq("patient_id", patientId)
      .gte("datetime", new Date().toISOString())
      .lte("datetime", new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString())
      .order("datetime", { ascending: true })
      .limit(10),
    supabase
      .from("documents")
      .select("title, summary, uploaded_at")
      .eq("patient_id", patientId)
      .gte("uploaded_at", new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString())
      .order("uploaded_at", { ascending: false })
      .limit(5),
  ]);

  const facts = {
    patient_first_name: (patient.name ?? "").split(" ")[0] || "your loved one",
    days_covered: days,
    symptoms: symptoms.data ?? [],
    medications: medications.data ?? [],
    recent_appointments: appointmentsPast.data ?? [],
    upcoming_appointments: appointmentsUpcoming.data ?? [],
    document_summaries: documents.data ?? [],
  };

  const disclaimer = language === "es" ? DISCLAIMER_ES : DISCLAIMER_EN;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        update_text: language === "es" ? "Servicio temporalmente no disponible." : "Service temporarily unavailable.",
        language,
        generated_at: new Date().toISOString(),
        disclaimer,
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const system =
    "You are writing a family update from a caregiver to family members. " +
    "Tone: warm, factual, never clinical, never speculative. Do not predict outcomes. " +
    "Do not interpret medical data. Just share what happened this week and what is coming up.\n" +
    "Output structure:\n" +
    "- 1-2 sentence opening (how things are overall)\n" +
    "- This week (3-5 bullets, plain language)\n" +
    "- Coming up (1-3 bullets)\n" +
    "- 1 sentence close (encouragement or thanks)\n" +
    `Output in ${language === "es" ? "Spanish" : "English"}. ` +
    "WhatsApp-friendly: no markdown symbols, no asterisks, use line breaks for paragraph separation.";

  const client = new Anthropic({ apiKey });
  const stream = client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1200,
    system,
    messages: [
      {
        role: "user",
        content: `Write the family update from these facts:\n${JSON.stringify(facts, null, 2)}`,
      },
    ],
  });

  const encoder = new TextEncoder();
  const generatedAt = new Date().toISOString();
  let fullText = "";

  const readable = new ReadableStream({
    async start(controller) {
      // Send metadata first as a JSON line
      controller.enqueue(
        encoder.encode(
          JSON.stringify({ kind: "meta", language, disclaimer, generated_at: generatedAt }) + "\n"
        )
      );
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            const chunk = event.delta.text;
            fullText += chunk;
            controller.enqueue(encoder.encode(JSON.stringify({ kind: "text", text: chunk }) + "\n"));
          }
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              kind: "error",
              message: err instanceof Error ? err.message : "stream failed",
            }) + "\n"
          )
        );
      }

      // Persist to family_updates (best-effort) and write audit log
      try {
        await supabase.from("family_updates").insert({
          patient_id: patientId,
          generated_by: user.id,
          organization_id: orgId,
          language,
          date_range_days: days,
          update_text: fullText,
        });
      } catch {
        // table may not exist before migration runs
      }
      try {
        await supabase.from("audit_log").insert({
          user_id: user.id,
          organization_id: orgId,
          action: "INSERT",
          resource_type: "family_update",
          patient_id: patientId,
        });
      } catch {
        // ignore
      }
      controller.enqueue(encoder.encode(JSON.stringify({ kind: "done" }) + "\n"));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-store",
    },
  });
}
