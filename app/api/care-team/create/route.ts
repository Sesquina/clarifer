/**
 * POST /api/care-team/create — add a care team member (stored on care_relationships).
 * Name/role/phone/email/hospital/notes are held in the relationship_type and
 * access_level fields plus a JSON notes blob on the caregiver's notes column.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";

export const runtime = "nodejs";

const ALLOWED_ROLES = ["caregiver"];

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
  if (!ALLOWED_ROLES.includes(userRecord.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const organizationId = userRecord.organization_id;

  let body: {
    patient_id?: string;
    name?: string;
    role?: string;
    phone?: string;
    email?: string;
    hospital?: string;
    notes?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.patient_id || !body.name?.trim() || !body.role?.trim()) {
    return NextResponse.json(
      { error: "Please include at least a name and a role." },
      { status: 400 }
    );
  }

  const { data: created, error: insertError } = await supabase
    .from("care_relationships")
    .insert({
      patient_id: body.patient_id,
      invited_by: user.id,
      relationship_type: body.role.trim(),
      access_level: JSON.stringify({
        name: body.name.trim(),
        phone: body.phone ?? null,
        email: body.email ?? null,
        hospital: body.hospital ?? null,
        notes: body.notes ?? null,
      }),
      organization_id: organizationId,
      invited_at: new Date().toISOString(),
    })
    .select("id, relationship_type")
    .single();

  if (insertError || !created) {
    return NextResponse.json(
      { error: "We could not add this care team member. Please try again." },
      { status: 500 }
    );
  }

  await supabase.from("audit_log").insert({
    user_id: user.id,
    patient_id: body.patient_id,
    action: "INSERT",
    resource_type: "care_team",
    resource_id: created.id,
    organization_id: organizationId,
    ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
    user_agent: request.headers.get("user-agent"),
    status: "success",
  });

  return NextResponse.json({ id: created.id, role: created.relationship_type }, { status: 201 });
}
