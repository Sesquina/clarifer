import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";

export const runtime = "nodejs";

const ALLOWED_ROLES = ["caregiver", "provider"];

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
  if (!ALLOWED_ROLES.includes(userRecord.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const organizationId = userRecord.organization_id;

  const { data: document } = await supabase
    .from("documents")
    .select("id, patient_id")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const { data: summary } = await supabase
    .from("chat_messages")
    .select("id, content, created_at, role")
    .eq("document_id", id)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  await supabase.from("audit_log").insert({
    user_id: user.id,
    patient_id: document.patient_id,
    action: "SELECT",
    resource_type: "document_summaries",
    resource_id: id,
    organization_id: organizationId,
    ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
    user_agent: request.headers.get("user-agent"),
    status: "success",
  });

  return NextResponse.json({ summary: summary ?? null });
}
