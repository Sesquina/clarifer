import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { checkOrigin } from "@/lib/cors";

export async function POST(request: Request) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
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

  const { patientId } = await request.json();

  if (!patientId) {
    return NextResponse.json({ error: "Missing patientId" }, { status: 400 });
  }

  const [patientResult, logsResult, medsResult, docsResult, trialsResult] = await Promise.all([
    supabase.from("patients").select("*").eq("id", patientId).eq("organization_id", organizationId).single(),
    supabase
      .from("symptom_logs")
      .select("created_at, overall_severity, symptoms, ai_summary")
      .eq("patient_id", patientId)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("medications")
      .select("name, dose, frequency")
      .eq("patient_id", patientId)
      .eq("organization_id", organizationId),
    supabase
      .from("documents")
      .select("title, document_category, summary")
      .eq("patient_id", patientId)
      .eq("organization_id", organizationId),
    supabase
      .from("trial_saves")
      .select("trial_name, phase, status, trial_id")
      .eq("patient_id", patientId)
      .eq("organization_id", organizationId),
  ]);

  const patient = patientResult.data;
  const logs = logsResult.data || [];
  const meds = medsResult.data || [];
  const docs = docsResult.data || [];
  const trials = trialsResult.data || [];

  // Build readable text export
  const lines: string[] = [];

  lines.push("========================================");
  lines.push("        MEDALYN PATIENT EXPORT");
  lines.push("========================================");
  lines.push(`Exported: ${new Date().toISOString()}`);
  lines.push("");

  // Patient info
  lines.push("----------------------------------------");
  lines.push("PATIENT INFORMATION");
  lines.push("----------------------------------------");
  if (patient) {
    lines.push(`Name: ${patient.name ?? "N/A"}`);
    lines.push(`Diagnosis: ${patient.custom_diagnosis ?? "N/A"}`);
  } else {
    lines.push("No patient data found.");
  }
  lines.push("");

  // Medications
  lines.push("----------------------------------------");
  lines.push("CURRENT MEDICATIONS");
  lines.push("----------------------------------------");
  if (meds.length === 0) {
    lines.push("No medications on file.");
  } else {
    for (const med of meds) {
      lines.push(`- ${med.name ?? "Unknown medication"}`);
      lines.push(`  Dose: ${med.dose ?? "N/A"}`);
      lines.push(`  Frequency: ${med.frequency ?? "N/A"}`);
    }
  }
  lines.push("");

  // Symptom logs
  lines.push("----------------------------------------");
  lines.push("SYMPTOM LOGS (Last 10)");
  lines.push("----------------------------------------");
  if (logs.length === 0) {
    lines.push("No symptom logs recorded.");
  } else {
    for (const log of logs) {
      const date = log.created_at
        ? new Date(log.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "Unknown date";
      lines.push(`Date: ${date}`);
      lines.push(`  Severity: ${log.overall_severity ?? "N/A"}`);
      lines.push(`  Symptoms: ${log.symptoms ?? "N/A"}`);
      lines.push(`  AI Summary: ${log.ai_summary ?? "N/A"}`);
      lines.push("");
    }
  }
  lines.push("");

  // Documents
  lines.push("----------------------------------------");
  lines.push("UPLOADED DOCUMENTS");
  lines.push("----------------------------------------");
  if (docs.length === 0) {
    lines.push("No documents uploaded.");
  } else {
    for (const doc of docs) {
      lines.push(`Title: ${doc.title ?? "Untitled"}`);
      lines.push(`  Category: ${doc.document_category ?? "N/A"}`);
      lines.push(`  Summary: ${doc.summary ?? "No summary available"}`);
      lines.push("");
    }
  }
  lines.push("");

  // Saved clinical trials
  lines.push("----------------------------------------");
  lines.push("SAVED CLINICAL TRIALS");
  lines.push("----------------------------------------");
  if (trials.length === 0) {
    lines.push("No saved clinical trials.");
  } else {
    for (const trial of trials) {
      lines.push(`Trial: ${trial.trial_name ?? "Unnamed trial"}`);
      lines.push(`  Phase: ${trial.phase ?? "N/A"}`);
      lines.push(`  Status: ${trial.status ?? "N/A"}`);
      lines.push("");
    }
  }

  lines.push("========================================");
  lines.push("          END OF EXPORT");
  lines.push("========================================");

  const textContent = lines.join("\n");

  // Log the export (non-blocking, safe if table doesn't exist)
  try {
    await supabase.from("anonymized_exports").insert({
      patient_id: patientId,
      fields_included: ["patient", "symptomLogs", "medications", "documents", "trials"],
      organization_id: organizationId,
    });
  } catch {
    // Silently ignore if anonymized_exports table doesn't exist
  }

  return new Response(textContent, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="medalyn-export-${Date.now()}.txt"`,
    },
  });
}
