/**
 * POST /api/patients/create
 * Creates a new patient scoped to the caller's organization.
 * Auth → role check (caregiver/provider) → insert → audit.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkOrigin } from "@/lib/cors";

export const runtime = "nodejs";

const ROUTE = 'api/patients/create';

const ALLOWED_ROLES = ["caregiver", "provider"];

export async function POST(request: Request) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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

  let { data: userRecord } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!userRecord?.organization_id) {
    // Self-heal: the handle_new_user trigger may not have run (migration not applied
    // or user predates the trigger). Provision org and users row with service-role
    // client so this request can succeed without blocking the user.
    console.error(JSON.stringify({
      route: ROUTE,
      method: request.method,
      error: 'users row missing organization_id; attempting self-heal',
      code: null,
      stack: null,
      userId: user.id,
      timestamp: new Date().toISOString(),
      step: 'self_heal_triggered',
    }));
    try {
      const admin = createAdminClient();
      const { data: newOrg, error: orgError } = await admin
        .from("organizations")
        .insert({ name: "Personal" })
        .select("id")
        .single();
      if (orgError || !newOrg) throw orgError ?? new Error("org insert failed");
      const { error: userError } = await admin
        .from("users")
        .upsert(
          { id: user.id, email: user.email ?? "", organization_id: newOrg.id, role: "caregiver" },
          { onConflict: "id" }
        );
      if (userError) throw userError;
      const { data: healed } = await supabase
        .from("users")
        .select("role, organization_id")
        .eq("id", user.id)
        .single();
      userRecord = healed;
    } catch (err: any) {
      console.error(JSON.stringify({
        route: ROUTE,
        method: request.method,
        error: err?.message ?? String(err),
        code: err?.code ?? null,
        stack: err?.stack?.split('\n').slice(0, 3).join(' | ') ?? null,
        userId: user.id,
        timestamp: new Date().toISOString(),
        step: 'self_heal_failed',
      }));
    }
  }

  if (!userRecord?.organization_id) {
    console.warn(JSON.stringify({
      route: ROUTE,
      method: request.method,
      event: 'unauthorized',
      userId: user.id,
      timestamp: new Date().toISOString(),
    }));
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!ALLOWED_ROLES.includes(userRecord.role ?? "")) {
    console.warn(JSON.stringify({
      route: ROUTE,
      method: request.method,
      event: 'unauthorized',
      userId: user.id,
      timestamp: new Date().toISOString(),
    }));
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const organizationId = userRecord.organization_id;

  let body: {
    // Standard fields
    full_name?: string;
    date_of_birth?: string;
    diagnosis?: string;
    condition_template_id?: string;
    primary_language?: string;
    // Onboarding aliases (app/onboarding/page.tsx)
    first_name?: string;
    name?: string;
    dob?: string;
    custom_diagnosis?: string;
    // Additional onboarding fields
    sex?: string;
    diagnosis_date?: string;
    city?: string;
    state?: string;
    language_preference?: string;
    status?: string;
  };
  try {
    body = await request.json();
  } catch (error: any) {
    console.error(JSON.stringify({
      route: ROUTE,
      method: request.method,
      error: error?.message ?? String(error),
      code: error?.code ?? null,
      stack: error?.stack?.split('\n').slice(0, 3).join(' | ') ?? null,
      userId: user.id,
      timestamp: new Date().toISOString(),
      step: 'parse_request_body',
    }));
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Accept all naming conventions: first_name (new onboarding), full_name (API callers), name (legacy onboarding)
  const fullName = (body.first_name ?? body.full_name ?? body.name ?? "").trim();
  if (!fullName) {
    return NextResponse.json(
      { error: "Please enter the patient's full name." },
      { status: 400 }
    );
  }
  if (fullName.length > 200) {
    return NextResponse.json(
      { error: "Name is too long. Please use 200 characters or fewer." },
      { status: 400 }
    );
  }

  // Input validation: date format, enums, and length caps. Anything that
  // would otherwise reach Postgres and return a 500 is rejected here with
  // a warm 400 message. See S18 audit notes in SPRINT_LOG.md.
  const dobRaw = body.date_of_birth ?? body.dob ?? null;
  const diagnosisDateRaw = body.diagnosis_date ?? null;
  const diagnosisRaw = body.diagnosis ?? body.custom_diagnosis ?? null;
  const cityRaw = body.city ?? null;
  const stateRaw = body.state ?? null;
  const sexRaw = body.sex ?? null;
  const statusRaw = body.status ?? "active";
  const languageRaw = body.language_preference ?? body.primary_language ?? "en";

  const isIsoDateOrEmpty = (v: unknown): v is string | null =>
    v == null || v === "" || (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v));

  if (!isIsoDateOrEmpty(dobRaw)) {
    return NextResponse.json(
      { error: "Date of birth must be in YYYY-MM-DD format." },
      { status: 400 }
    );
  }
  if (!isIsoDateOrEmpty(diagnosisDateRaw)) {
    return NextResponse.json(
      { error: "Diagnosis date must be in YYYY-MM-DD format." },
      { status: 400 }
    );
  }

  const ALLOWED_SEX = ["female", "male", "other", "", null] as const;
  if (sexRaw != null && !ALLOWED_SEX.includes(sexRaw as (typeof ALLOWED_SEX)[number])) {
    return NextResponse.json(
      { error: "Please choose female, male, or other." },
      { status: 400 }
    );
  }

  const ALLOWED_LANGUAGE = ["en", "es"] as const;
  if (!ALLOWED_LANGUAGE.includes(languageRaw as (typeof ALLOWED_LANGUAGE)[number])) {
    return NextResponse.json(
      { error: "Language must be 'en' or 'es'." },
      { status: 400 }
    );
  }

  const ALLOWED_STATUS = ["active", "inactive"] as const;
  if (!ALLOWED_STATUS.includes(statusRaw as (typeof ALLOWED_STATUS)[number])) {
    return NextResponse.json(
      { error: "Status must be 'active' or 'inactive'." },
      { status: 400 }
    );
  }

  if (typeof diagnosisRaw === "string" && diagnosisRaw.length > 500) {
    return NextResponse.json(
      { error: "Diagnosis description is too long. Please use 500 characters or fewer." },
      { status: 400 }
    );
  }
  if (typeof cityRaw === "string" && cityRaw.length > 100) {
    return NextResponse.json(
      { error: "City is too long. Please use 100 characters or fewer." },
      { status: 400 }
    );
  }
  if (typeof stateRaw === "string" && stateRaw.length > 100) {
    return NextResponse.json(
      { error: "State is too long. Please use 100 characters or fewer." },
      { status: 400 }
    );
  }

  const { data: inserted, error: insertError } = await supabase
    .from("patients")
    .insert({
      name: fullName,
      dob: dobRaw || null,
      sex: sexRaw || null,
      custom_diagnosis: diagnosisRaw || null,
      diagnosis_date: diagnosisDateRaw || null,
      city: cityRaw || null,
      state: stateRaw || null,
      condition_template_id: body.condition_template_id ?? null,
      language_preference: languageRaw,
      organization_id: organizationId,
      created_by: user.id,
      status: statusRaw,
    })
    .select("id, name, condition_template_id")
    .single();

  if (insertError || !inserted) {
    console.error(JSON.stringify({
      route: ROUTE,
      method: request.method,
      error: insertError?.message ?? 'insert returned no data',
      code: (insertError as any)?.code ?? null,
      stack: null,
      userId: user.id,
      timestamp: new Date().toISOString(),
      step: 'insert_patient',
    }));
    return NextResponse.json(
      { error: "We could not save this patient. Please try again." },
      { status: 500 }
    );
  }

  await supabase.from("audit_log").insert({
    user_id: user.id,
    patient_id: inserted.id,
    action: "INSERT",
    resource_type: "patients",
    resource_id: inserted.id,
    organization_id: organizationId,
    ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
    user_agent: request.headers.get("user-agent"),
    status: "success",
  });

  // Ensure users row has organization_id + role set server-side.
  // This is the authoritative write: if the handle_new_user trigger hasn't run
  // or the client-side fallback in onboarding failed silently, this guarantees
  // routePostAuth() won't loop the user back to /onboarding on their next sign-in.
  await supabase
    .from("users")
    .update({ organization_id: organizationId, role: userRecord.role ?? "caregiver" })
    .eq("id", user.id)
    .then(() => undefined, () => undefined);

  return NextResponse.json(
    { id: inserted.id, full_name: inserted.name, condition_template_id: inserted.condition_template_id },
    { status: 201 }
  );
}
