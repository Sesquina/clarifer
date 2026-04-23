import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";

export async function POST(request: Request) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  try {
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

    const body = await request.json();
    const { patientId, title, datetime, providerName, providerSpecialty, location, notes } = body;

    if (!patientId || !title) {
      return NextResponse.json({ error: "Missing required fields: patientId, title" }, { status: 400 });
    }

    const { data: appointment, error: insertError } = await supabase
      .from("appointments")
      .insert({
        patient_id: patientId,
        created_by: user.id,
        title,
        datetime: datetime || null,
        provider_name: providerName || null,
        provider_specialty: providerSpecialty || null,
        location: location || null,
        notes: notes || null,
        source: "manual",
        organization_id: organizationId,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    await supabase.from("audit_log").insert({
      user_id: user.id,
      patient_id: patientId,
      action: "create_appointment",
      resource_type: "appointments",
      resource_id: appointment.id,
      organization_id: organizationId,
    });

    return NextResponse.json({ id: appointment.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 });
  }
}
