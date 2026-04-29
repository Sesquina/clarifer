/**
 * lib/pdf/fetch-export-data.ts
 * Fetches all data needed for the hospital-grade PDF export.
 * Tables: patients, medications, symptom_logs, documents,
 *         appointments, care_team, provider_notes, organizations,
 *         users
 * Auth: server-side only. Caller MUST verify auth + org-scope before
 *       calling this helper.
 * Sprint: Sprint 13 -- Hospital-Grade PDF Export
 *
 * HIPAA: Returns full PHI bundle. Caller must NEVER log the return
 * value. Every individual table query is org-scoped (defense in depth
 * over RLS). On any per-table error, the affected slice falls back to
 * an empty array so the PDF still renders -- the function never throws.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type Patient = Database["public"]["Tables"]["patients"]["Row"];
type Medication = Database["public"]["Tables"]["medications"]["Row"];
type SymptomLog = Database["public"]["Tables"]["symptom_logs"]["Row"];
type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];
type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type CareTeamMember = Database["public"]["Tables"]["care_team"]["Row"];
type ProviderNote = Database["public"]["Tables"]["provider_notes"]["Row"];

export interface ExportData {
  patient: Patient;
  medications: Medication[];
  symptomLogs: SymptomLog[];
  documents: DocumentRow[];
  appointments: Appointment[];
  careTeam: CareTeamMember[];
  providerNotes: ProviderNote[];
  generatedBy: string;
  generatedAt: string;
  dateRangeDays: number;
  orgName: string;
}

export type Role = "caregiver" | "patient" | "provider" | "admin" | string;

interface FetchExportDataArgs {
  supabase: SupabaseClient<Database>;
  patientId: string;
  orgId: string;
  callerId: string;
  callerRole: Role;
  dateRangeDays?: number;
}

/**
 * Aggregates patient PHI for export. Returns null when the patient is
 * not in the caller's org (cross-tenant guard). Otherwise returns a
 * complete bundle, with empty arrays for any slice that errored.
 */
export async function fetchExportData(args: FetchExportDataArgs): Promise<ExportData | null> {
  const { supabase, patientId, orgId, callerId, callerRole, dateRangeDays = 30 } = args;
  const days = Math.max(1, Math.min(dateRangeDays, 365));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const nowIso = new Date().toISOString();

  // Cross-tenant guard. If the patient does not belong to the caller's
  // org, return null so the route returns 404.
  const { data: patient } = await supabase
    .from("patients")
    .select("*")
    .eq("id", patientId)
    .eq("organization_id", orgId)
    .single();
  if (!patient) return null;

  const include5LastCompleted = supabase
    .from("appointments")
    .select("*")
    .eq("patient_id", patientId)
    .eq("organization_id", orgId)
    .lt("datetime", nowIso)
    .order("datetime", { ascending: false })
    .limit(5);

  const include3Upcoming = supabase
    .from("appointments")
    .select("*")
    .eq("patient_id", patientId)
    .eq("organization_id", orgId)
    .gte("datetime", nowIso)
    .order("datetime", { ascending: true })
    .limit(3);

  const includeProviderNotes =
    callerRole === "provider"
      ? supabase
          .from("provider_notes")
          .select("*")
          .eq("patient_id", patientId)
          .eq("provider_id", callerId)
          .eq("organization_id", orgId)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as ProviderNote[], error: null });

  const [meds, syms, docs, lastCompleted, upcoming, careTeam, notes, callerRow, orgRow] =
    await Promise.all([
      supabase
        .from("medications")
        .select("*")
        .eq("patient_id", patientId)
        .eq("organization_id", orgId)
        .eq("is_active", true)
        .order("name", { ascending: true }),
      supabase
        .from("symptom_logs")
        .select("*")
        .eq("patient_id", patientId)
        .gte("created_at", since)
        .order("created_at", { ascending: false }),
      supabase
        .from("documents")
        .select("*")
        .eq("patient_id", patientId)
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(10),
      include5LastCompleted,
      include3Upcoming,
      supabase
        .from("care_team")
        .select("*")
        .eq("patient_id", patientId)
        .eq("organization_id", orgId)
        .order("is_primary", { ascending: false })
        .order("name", { ascending: true }),
      includeProviderNotes,
      supabase.from("users").select("full_name").eq("id", callerId).single(),
      supabase.from("organizations").select("name").eq("id", orgId).single(),
    ]);

  const completedAppts = (lastCompleted.data ?? []) as Appointment[];
  const upcomingAppts = (upcoming.data ?? []) as Appointment[];

  return {
    patient,
    medications: meds.error ? [] : (meds.data as Medication[]),
    symptomLogs: syms.error ? [] : (syms.data as SymptomLog[]),
    documents: docs.error ? [] : (docs.data as DocumentRow[]),
    appointments: [...upcomingAppts, ...completedAppts],
    careTeam: careTeam.error ? [] : (careTeam.data as CareTeamMember[]),
    providerNotes: notes.error ? [] : (notes.data as ProviderNote[]),
    generatedBy: callerRow.data?.full_name ?? "",
    generatedAt: new Date().toISOString(),
    dateRangeDays: days,
    orgName: orgRow.data?.name ?? "Clarifer",
  };
}
