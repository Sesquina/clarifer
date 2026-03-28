import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { patientId } = await request.json();

  if (!patientId) {
    return NextResponse.json({ error: "Missing patientId" }, { status: 400 });
  }

  const [patientResult, logsResult, medsResult, docsResult, apptsResult] = await Promise.all([
    supabase.from("patients").select("*").eq("id", patientId).single(),
    supabase.from("symptom_logs").select("*").eq("patient_id", patientId).order("created_at", { ascending: false }),
    supabase.from("medications").select("*").eq("patient_id", patientId),
    supabase.from("documents").select("title, summary, document_category, uploaded_at").eq("patient_id", patientId),
    supabase.from("appointments").select("*").eq("patient_id", patientId).order("datetime", { ascending: false }),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    patient: patientResult.data,
    symptomLogs: logsResult.data || [],
    medications: medsResult.data || [],
    documents: docsResult.data || [],
    appointments: apptsResult.data || [],
  };

  // Log the export
  await supabase.from("anonymized_exports").insert({
    patient_id: patientId,
    fields_included: ["patient", "symptomLogs", "medications", "documents", "appointments"],
  });

  return NextResponse.json(exportData);
}
