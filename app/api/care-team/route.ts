/**
 * app/api/care-team/route.ts
 * List and create care team members for a patient.
 * Tables: care_team (read/write), patients (read), users (read), audit_log (write)
 * Auth: caregiver, patient (read only), provider (read only), admin
 * Sprint: Sprint 10 -- Care Team Directory
 *
 * HIPAA: Contains provider contact info. Org-scoped on every read and write.
 * Audit logged on read (SELECT) and create (INSERT). No PHI in error responses.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";
import type { Database } from "@/lib/supabase/types";

export const runtime = "nodejs";

const READ_ROLES = ["caregiver", "patient", "provider", "admin"];
const WRITE_ROLES = ["caregiver", "admin"];

type CareTeamInsert = Database["public"]["Tables"]["care_team"]["Insert"];

function forensicColumns(request: Request) {
  return {
    ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
    user_agent: request.headers.get("user-agent"),
    status: "success",
  };
}

export async function GET(request: Request) {
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
  if (!userRecord?.organization_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!READ_ROLES.includes(userRecord.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const orgId = userRecord.organization_id;

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patient_id");
  if (!patientId) {
    return NextResponse.json({ error: "patient_id required" }, { status: 400 });
  }

  const { data: patient } = await supabase
    .from("patients")
    .select("organization_id")
    .eq("id", patientId)
    .single();
  if (!patient || patient.organization_id !== orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("care_team")
    .select("*")
    .eq("patient_id", patientId)
    .eq("organization_id", orgId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase
    .from("audit_log")
    .insert({
      user_id: user.id,
      organization_id: orgId,
      action: "SELECT",
      resource_type: "care_team",
      patient_id: patientId,
      ...forensicColumns(request),
    })
    .then(() => undefined, () => undefined);

  return NextResponse.json({ members: data ?? [] });
}

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
  if (!userRecord?.organization_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!WRITE_ROLES.includes(userRecord.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const orgId = userRecord.organization_id;

  const body = (await request.json().catch(() => null)) as Partial<CareTeamInsert> | null;
  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  if (!body.patient_id || typeof body.patient_id !== "string") {
    return NextResponse.json({ error: "patient_id required" }, { status: 400 });
  }

  const { data: patient } = await supabase
    .from("patients")
    .select("organization_id")
    .eq("id", body.patient_id)
    .single();
  if (!patient || patient.organization_id !== orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const insertRow: CareTeamInsert = {
    patient_id: body.patient_id,
    organization_id: orgId,
    name: body.name.trim(),
    role: typeof body.role === "string" ? body.role : null,
    specialty: typeof body.specialty === "string" ? body.specialty : null,
    phone: typeof body.phone === "string" ? body.phone : null,
    email: typeof body.email === "string" ? body.email : null,
    fax: typeof body.fax === "string" ? body.fax : null,
    address: typeof body.address === "string" ? body.address : null,
    npi: typeof body.npi === "string" ? body.npi : null,
    notes: typeof body.notes === "string" ? body.notes : null,
    is_primary: typeof body.is_primary === "boolean" ? body.is_primary : false,
  };

  const { data, error } = await supabase
    .from("care_team")
    .insert(insertRow)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase
    .from("audit_log")
    .insert({
      user_id: user.id,
      organization_id: orgId,
      action: "INSERT",
      resource_type: "care_team",
      resource_id: data.id,
      patient_id: body.patient_id,
      ...forensicColumns(request),
    })
    .then(() => undefined, () => undefined);

  return NextResponse.json({ member: data }, { status: 201 });
}
