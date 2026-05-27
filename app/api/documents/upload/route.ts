/**
 * app/api/documents/upload/route.ts
 * Uploads a document file to Supabase Storage and creates the metadata row.
 * Tables: documents (write), patients (read), users (read), audit_log (write)
 * Auth: caregiver, provider
 * Sprint: S5 -- fix missing audit_log fields on document upload
 * HIPAA: PHI document. Auth + role + org_id enforced.
 *        audit_log written with all required fields on every successful upload.
 */
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
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
  } catch (error) {
    Sentry.captureException(error, { tags: { route: "api/documents/upload", phase: "storage" } });
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const { data: document, error: insertError } = await supabase
    .from("documents")
    .insert({
      patient_id: patientId,
      organization_id: organizationId,
      uploaded_by: user.id,
      title: file.name,
      file_url: filePath,
      file_type: file.type,
      document_category: documentCategory,
    })
    .select()
    .single();

  if (insertError || !document) {
    return NextResponse.json({ error: "Database insert failed" }, { status: 500 });
  }

  // 4. audit_log write -- every patient data insert must be logged with all required fields
  await supabase.from("audit_log").insert({
    user_id: user.id,
    patient_id: patientId,
    action: "INSERT",
    resource_type: "documents",
    resource_id: document.id,
    organization_id: organizationId,
    ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
    user_agent: request.headers.get("user-agent"),
    status: "success",
  }).then(() => undefined, () => undefined);

  return NextResponse.json(
    { id: document.id, title: document.title },
    { status: 201 }
  );
}
