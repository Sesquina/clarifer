import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateFile } from "@/lib/documents/validate";
import { uploadToStorage } from "@/lib/documents/storage";
import { checkOrigin } from "@/lib/cors";

export const runtime = "nodejs";

const ALLOWED_ROLES = ["caregiver", "provider"];

export async function POST(request: Request) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: userRecord } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!userRecord?.organization_id || !ALLOWED_ROLES.includes(userRecord.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const organizationId = userRecord.organization_id;
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const patientId = formData.get("patientId") as string | null;
  const documentCategory = (formData.get("documentCategory") as string) ?? "other";

  if (!file || !patientId) {
    return NextResponse.json({ error: "Missing file or patientId" }, { status: 400 });
  }

  const validation = validateFile(file);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // Verify patient belongs to same org
  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("id", patientId)
    .eq("organization_id", organizationId)
    .single();

  if (!patient) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let filePath: string;
  try {
    filePath = await uploadToStorage(file, organizationId, patientId);
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const { data: document, error: insertError } = await supabase
    .from("documents")
    .insert({
      patient_id: patientId,
      organization_id: organizationId,
      uploaded_by: user.id,
      file_name: file.name,
      file_path: filePath,
      mime_type: file.type,
      document_category: documentCategory,
      analysis_status: "pending",
    })
    .select()
    .single();

  if (insertError || !document) {
    return NextResponse.json({ error: "Database insert failed" }, { status: 500 });
  }

  await supabase.from("audit_log").insert({
    user_id: user.id,
    patient_id: patientId,
    action: "UPLOAD_DOCUMENT",
    resource_type: "documents",
    resource_id: document.id,
    organization_id: organizationId,
  });

  return NextResponse.json(
    { id: document.id, file_name: document.file_name, analysis_status: "pending" },
    { status: 201 }
  );
}
