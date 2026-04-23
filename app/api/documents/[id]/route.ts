import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { checkOrigin } from "@/lib/cors";
import { generateSignedUrl } from "@/lib/documents/storage";

export const runtime = "nodejs";

const GET_ROLES = ["caregiver", "provider", "admin"];
const DELETE_ROLES = ["caregiver", "provider"];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: userRecord } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!userRecord?.organization_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!GET_ROLES.includes(userRecord.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const organizationId = userRecord.organization_id;

  const { data: document } = await supabase
    .from("documents")
    .select("id, file_name, file_path, mime_type, document_category, analysis_status, patient_id, created_at")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (!document.file_path) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const signedUrl = await generateSignedUrl(document.file_path);

  const ipAddress = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip");
  const userAgent = request.headers.get("user-agent");

  await supabase.from("audit_log").insert({
    user_id: user.id,
    patient_id: document.patient_id,
    action: "SELECT",
    resource_type: "documents",
    resource_id: id,
    organization_id: organizationId,
    ip_address: ipAddress,
    user_agent: userAgent,
    status: "success",
  });
  await supabase.from("audit_log").insert({
    user_id: user.id,
    patient_id: document.patient_id,
    action: "DOWNLOAD",
    resource_type: "documents",
    resource_id: id,
    organization_id: organizationId,
    ip_address: ipAddress,
    user_agent: userAgent,
    status: "success",
  });

  return NextResponse.json({ document, signedUrl });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: userRecord } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!userRecord?.organization_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!DELETE_ROLES.includes(userRecord.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const organizationId = userRecord.organization_id;

  const { data: doc } = await supabase
    .from("documents")
    .select("id, file_url, uploaded_by, patient_id")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (doc.uploaded_by !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (doc.file_url) {
    const url = doc.file_url as string;
    const match = url.match(/\/documents\/(.+?)(?:\?|$)/);
    if (match) {
      const storagePath = decodeURIComponent(match[1]);
      await serviceClient.storage.from("documents").remove([storagePath]);
    }
  }

  const { error } = await supabase.from("documents").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("audit_log").insert({
    user_id: user.id,
    patient_id: doc.patient_id,
    action: "DELETE",
    resource_type: "documents",
    resource_id: id,
    organization_id: organizationId,
    ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
    user_agent: request.headers.get("user-agent"),
    status: "success",
  });

  return NextResponse.json({ success: true });
}
