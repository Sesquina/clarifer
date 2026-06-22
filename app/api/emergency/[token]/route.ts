/**
 * app/api/emergency/[token]/route.ts
 * GET /api/emergency/[token] — public, no auth required.
 * Returns emergency card payload for the patient identified by emergency_token.
 * Tables: patients (read), medications (read), care_team (read)
 * Auth: Public (token-gated — no user session required)
 * HIPAA: Returns only first name, active medications, and care team contacts.
 *        No diagnosis, DOB, SSN, or full name exposed.
 */
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token || token.length < 8) {
    return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: patient, error } = await supabase
    .from("patients")
    .select("id, name, organization_id, emergency_token")
    .eq("emergency_token", token)
    .single();

  if (error || !patient) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const { data: medications } = await supabase
    .from("medications")
    .select("name, dose, unit, frequency, route")
    .eq("patient_id", patient.id)
    .eq("organization_id", patient.organization_id)
    .eq("is_active", true)
    .order("name");

  const { data: careTeam } = await supabase
    .from("care_team")
    .select("name, role, phone, email")
    .eq("patient_id", patient.id)
    .eq("organization_id", patient.organization_id)
    .order("role");

  const firstName = patient.name?.split(" ")[0] ?? "the patient";

  return NextResponse.json({
    firstName,
    medications: medications ?? [],
    careTeam: careTeam ?? [],
    generatedAt: new Date().toISOString(),
  });
}
