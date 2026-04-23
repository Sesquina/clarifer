import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";

export const runtime = "nodejs";

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
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!userRecord?.organization_id) {
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

  return NextResponse.json({ summary: summary ?? null });
}
