import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserFromRequest } from '@/lib/auth/get-user';
import { checkOrigin } from "@/lib/cors";
import { generateSignedUrl, deleteFromStorage } from "@/lib/documents/storage";

export const runtime = "nodejs";

const ROUTE = 'api/documents/[id]';

const GET_ROLES = ["caregiver", "provider", "admin"];
const DELETE_ROLES = ["caregiver", "provider"];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  try {
    const { id } = await params;
    const supabase = await createClient();
    const user = await getUserFromRequest();

    if (!user) {
      console.warn(JSON.stringify({
        route: ROUTE,
        method: request.method,
        event: 'unauthorized',
        userId: 'none',
        timestamp: new Date().toISOString(),
      }));
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!GET_ROLES.includes(user.role)) {
      console.warn(JSON.stringify({
        route: ROUTE,
        method: request.method,
        event: 'unauthorized',
        userId: user.id,
        timestamp: new Date().toISOString(),
      }));
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const organizationId = user.organization_id;

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

    let signedUrl: string;
    try {
      signedUrl = await generateSignedUrl(document.file_path);
    } catch (error: any) {
      console.error(JSON.stringify({
        route: ROUTE,
        method: request.method,
        error: error?.message ?? String(error),
        code: error?.code ?? null,
        stack: error?.stack?.split('\n').slice(0, 3).join(' | ') ?? null,
        userId: user.id,
        timestamp: new Date().toISOString(),
        step: 'generate_signed_url',
      }));
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

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
  } catch (error: any) {
    console.error(JSON.stringify({
      route: ROUTE,
      method: request.method,
      error: error?.message ?? String(error),
      code: error?.code ?? null,
      stack: error?.stack?.split('\n').slice(0, 3).join(' | ') ?? null,
      userId: null,
      timestamp: new Date().toISOString(),
      step: 'get_handler',
    }));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  try {
    const { id } = await params;
    const supabase = await createClient();
    const user = await getUserFromRequest();

    if (!user) {
      console.warn(JSON.stringify({
        route: ROUTE,
        method: request.method,
        event: 'unauthorized',
        userId: 'none',
        timestamp: new Date().toISOString(),
      }));
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!DELETE_ROLES.includes(user.role)) {
      console.warn(JSON.stringify({
        route: ROUTE,
        method: request.method,
        event: 'unauthorized',
        userId: user.id,
        timestamp: new Date().toISOString(),
      }));
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const organizationId = user.organization_id;

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
      console.warn(JSON.stringify({
        route: ROUTE,
        method: request.method,
        event: 'unauthorized',
        userId: user.id,
        timestamp: new Date().toISOString(),
      }));
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (doc.file_url) {
      try {
        await deleteFromStorage(doc.file_url as string);
      } catch {
        // Non-fatal: storage deletion failure should not block metadata removal
      }
    }

    const { error } = await supabase.from("documents").delete().eq("id", id);

    if (error) {
      console.error(JSON.stringify({
        route: ROUTE,
        method: request.method,
        error: error.message,
        code: (error as any)?.code ?? null,
        stack: null,
        userId: user.id,
        timestamp: new Date().toISOString(),
        step: 'delete_document_row',
      }));
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
  } catch (error: any) {
    console.error(JSON.stringify({
      route: ROUTE,
      method: request.method,
      error: error?.message ?? String(error),
      code: error?.code ?? null,
      stack: error?.stack?.split('\n').slice(0, 3).join(' | ') ?? null,
      userId: null,
      timestamp: new Date().toISOString(),
      step: 'delete_handler',
    }));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
