/**
 * app/api/patients/me/route.ts
 * Returns the patient record associated with the current user's session.
 * Used by all pages that need patientId after Supabase Auth removal.
 * HIPAA: auth required, organization_id filter enforced.
 */
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: NextRequest) {
  const user = await getUserFromRequest();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  const { data: patient, error } = await supabase
    .from("patients")
    .select("id, name, organization_id, created_at")
    .eq("organization_id", user.organization_id)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (error || !patient) {
    return NextResponse.json({ error: "No patient found" }, { status: 404 });
  }

  const firstName = patient.name?.split(" ")[0] ?? "your family member";

  console.log("[patients/me] served:", patient.id.slice(0, 8));
  return NextResponse.json({
    id: patient.id,
    firstName,
    organization_id: patient.organization_id,
  });
}
