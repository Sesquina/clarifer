/**
 * Sprint 8 — Carlos Rivera CCF demo seed script.
 *
 * WARNING: Only run against demo/staging environments. Never run against
 * production with real patient data.
 *
 * Usage:
 *   npx tsx scripts/seed-demo-data.ts
 *
 * Reads .env.local for SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const ORG_ID = "fa731120-304a-48ba-889a-3be6431454f3"; // Clarifer Inc.
const DEMO_EMAIL = "demo@clarifer.com";
const DEMO_PASSWORD = "ClariferdDemo2026!";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureDemoUser(): Promise<string> {
  // Look up or create auth user.
  const { data: list } = await supabase.auth.admin.listUsers();
  const existing = list?.users?.find((u) => u.email === DEMO_EMAIL);
  if (existing) return existing.id;

  const { data, error } = await supabase.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Maria Rivera" },
  });
  if (error || !data.user) throw error ?? new Error("Could not create demo user");

  await supabase.from("users").upsert({
    id: data.user.id,
    email: DEMO_EMAIL,
    full_name: "Maria Rivera",
    role: "caregiver",
    organization_id: ORG_ID,
    language: "en",
  });
  return data.user.id;
}

async function getConditionTemplateId(): Promise<string | null> {
  const { data } = await supabase
    .from("condition_templates")
    .select("id")
    .eq("slug", "cholangiocarcinoma")
    .maybeSingle();
  return data?.id ?? null;
}

async function upsertPatient(caregiverId: string, conditionId: string | null): Promise<string> {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data: existing } = await supabase
    .from("patients")
    .select("id")
    .eq("name", "Carlos Rivera")
    .eq("organization_id", ORG_ID)
    .maybeSingle();

  const payload = {
    name: "Carlos Rivera",
    dob: "1962-03-15",
    sex: "male",
    custom_diagnosis: "Cholangiocarcinoma Stage 4 (Intrahepatic)",
    condition_template_id: conditionId,
    primary_language: "en",
    organization_id: ORG_ID,
    created_by: caregiverId,
    created_at: ninetyDaysAgo,
    status: "active",
    emergency_card_enabled: true,
    blood_type: "O+",
    allergies: ["penicillin"],
    emergency_contact_name: "Maria Rivera (daughter)",
    emergency_contact_phone: "(555) 111-2233",
    emergency_notes: "Intrahepatic cholangiocarcinoma Stage IVA. FGFR2 fusion positive.",
    dpd_deficiency_screened: false,
    dpd_deficiency_status: "unknown",
  };

  if (existing) {
    await supabase.from("patients").update(payload).eq("id", existing.id);
    return existing.id;
  }
  const { data, error } = await supabase
    .from("patients")
    .insert(payload)
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("Could not insert patient");
  return data.id;
}

async function seedCareRelationship(userId: string, patientId: string) {
  await supabase.from("care_relationships").upsert({
    user_id: userId,
    patient_id: patientId,
    organization_id: ORG_ID,
    relationship_type: "daughter",
    access_level: "full",
    can_log: true,
    can_export: true,
    accepted: true,
    accepted_at: new Date().toISOString(),
  });
}

function chemoDay(dayIndex: number): boolean {
  // gemcitabine days 1 and 8 of a 21-day cycle
  const cyclePosition = dayIndex % 21;
  return cyclePosition === 0 || cyclePosition === 7;
}

async function seedSymptomLogs(userId: string, patientId: string) {
  await supabase.from("symptom_logs").delete().eq("patient_id", patientId);
  const today = new Date();
  today.setHours(20, 0, 0, 0);
  const rows: Array<Record<string, unknown>> = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const isChemoDay = chemoDay(i);
    const pain = isChemoDay ? 6 + (i % 2) : 4 + (i % 3);
    const fatigue = isChemoDay ? 8 : 5 + (i % 3);
    const nausea = isChemoDay ? 6 : 3 + (i % 3);
    const jaundice = Math.max(2, 4 - Math.floor((29 - i) / 10));
    const appetite = 3 + (i % 3);
    const moods = ["hopeful", "anxious", "exhausted"];
    const mood = moods[i % moods.length];
    const overall = Math.round((pain + fatigue + nausea) / 3);
    rows.push({
      patient_id: patientId,
      organization_id: ORG_ID,
      logged_by: userId,
      created_at: date.toISOString(),
      overall_severity: overall,
      responses: {
        pain_level: pain,
        fatigue,
        nausea,
        jaundice,
        appetite,
        mood,
        chemo_day: isChemoDay,
      },
      symptoms: {
        pain,
        fatigue,
        nausea,
        jaundice,
        appetite,
      },
      condition_context: "cholangiocarcinoma",
      ai_summary: isChemoDay
        ? "Chemo day. Nausea and fatigue higher; ondansetron effective."
        : "Off-cycle day. Pain manageable, fatigue present, appetite low.",
    });
  }
  if (rows.length > 0) {
    await supabase.from("symptom_logs").insert(rows);
  }
}

async function seedDocuments(userId: string, patientId: string) {
  await supabase.from("documents").delete().eq("patient_id", patientId);
  const base = Date.now();
  const docs = [
    {
      title: "Memorial Hospital Discharge Summary",
      document_category: "discharge_summary",
      analysis_status: "complete",
      summary:
        "Patient discharged following first cycle of gemcitabine/cisplatin. Tolerating treatment with managed nausea. CA 19-9 trending down from 450 to 380. Next cycle scheduled in 2 weeks. Follow-up imaging in 6 weeks.",
      uploaded_at: new Date(base - 60 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: "CA 19-9 and CEA Panel Results",
      document_category: "lab_report",
      analysis_status: "complete",
      summary:
        "CA 19-9: 380 U/mL (down from 450, trending positive). CEA: 8.2 ng/mL (stable). Liver enzymes slightly elevated -- consistent with biliary obstruction. CBC within normal limits. Next labs in 3 weeks.",
      uploaded_at: new Date(base - 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: "Cholangiocarcinoma Pathology Report",
      document_category: "pathology_report",
      analysis_status: "complete",
      summary:
        "Intrahepatic cholangiocarcinoma confirmed. FGFR2 fusion positive (FGFR2-BICC1). IDH1/IDH2 negative. MSI-stable. PD-L1 expression 10%. Stage IVA. Recommend discussion of pemigatinib given FGFR2 fusion status.",
      uploaded_at: new Date(base - 80 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
  for (const d of docs) {
    await supabase.from("documents").insert({
      patient_id: patientId,
      organization_id: ORG_ID,
      uploaded_by: userId,
      file_name: `${d.document_category}.pdf`,
      file_type: "application/pdf",
      mime_type: "application/pdf",
      file_path: `demo/${patientId}/${d.document_category}.pdf`,
      ...d,
      analyzed_at: d.uploaded_at,
    });
  }
}

async function seedMedications(userId: string, patientId: string) {
  await supabase.from("medications").delete().eq("patient_id", patientId);
  const meds = [
    { name: "Gemcitabine", dose: "1000", unit: "mg/m2", route: "IV", frequency: "Every 3 weeks (days 1, 8)", indication: "cholangiocarcinoma" },
    { name: "Cisplatin", dose: "25", unit: "mg/m2", route: "IV", frequency: "Every 3 weeks (days 1, 8)", indication: "cholangiocarcinoma" },
    { name: "Ondansetron", dose: "8", unit: "mg", route: "oral", frequency: "Twice daily", indication: "nausea" },
    { name: "Lorazepam", dose: "0.5", unit: "mg", route: "oral", frequency: "As needed", indication: "anxiety" },
    { name: "Omeprazole", dose: "20", unit: "mg", route: "oral", frequency: "Once daily", indication: "stomach protection" },
  ];
  for (const m of meds) {
    await supabase.from("medications").insert({
      patient_id: patientId,
      organization_id: ORG_ID,
      added_by: userId,
      is_active: true,
      start_date: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      prescriber: "Dr. Sarah Chen",
      ...m,
    });
  }
}

async function seedCareTeam(userId: string, patientId: string) {
  const { data: existing } = await supabase
    .from("care_relationships")
    .select("id, relationship_type")
    .eq("patient_id", patientId)
    .eq("organization_id", ORG_ID);
  // Keep the primary caregiver relationship; insert provider-role entries using notes in relationship_type.
  // Since care_relationships requires a user_id (a real auth user), we stash the demo team in chat_messages
  // pinned as role=system so the UI can render them without creating fake auth users.
  // This keeps multi-tenancy + RLS intact for the demo.
  const team = [
    { name: "Dr. Sarah Chen", role: "oncologist", institution: "Memorial Cancer Center", phone: "(555) 234-5678", email: "schen@memorial.org" },
    { name: "Nurse Patricia Torres", role: "oncology nurse", institution: "Memorial Cancer Center", phone: "(555) 234-5679", email: "ptorres@memorial.org" },
    { name: "Dr. James Park", role: "hepatologist", institution: "City Hospital", phone: "(555) 345-6789", email: "jpark@cityhospital.org" },
    { name: "Sandra Martinez", role: "social worker", institution: "Memorial Cancer Center", phone: "(555) 234-5680", email: "smartinez@memorial.org" },
  ];
  await supabase.from("chat_messages").insert({
    patient_id: patientId,
    organization_id: ORG_ID,
    user_id: userId,
    role: "system",
    content: `[DEMO_CARE_TEAM] ${JSON.stringify(team)}`,
  });
  // Ensure primary caregiver record exists.
  if (!existing?.some((r) => r.relationship_type === "daughter")) {
    await supabase.from("care_relationships").insert({
      user_id: userId,
      patient_id: patientId,
      organization_id: ORG_ID,
      relationship_type: "daughter",
      access_level: "full",
      can_log: true,
      can_export: true,
      accepted: true,
      accepted_at: new Date().toISOString(),
    });
  }
}

async function seedAppointments(userId: string, patientId: string) {
  await supabase.from("appointments").delete().eq("patient_id", patientId);
  const oncologyDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  oncologyDate.setHours(10, 0, 0, 0);
  const labDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  labDate.setHours(8, 0, 0, 0);

  const cholChecklist = [
    { label: "Bring the list of current symptoms, noting which have changed", done: false },
    { label: "Note any new pain, jaundice, or appetite shift this cycle", done: false },
    { label: "Bring medication list with adherence notes", done: false },
    { label: "Ask about latest CA 19-9 and CEA trend", done: false },
    { label: "Ask about FGFR2-targeted therapy eligibility (pemigatinib)", done: false },
    { label: "Ask about clinical trial options", done: false },
    { label: "Confirm next chemo cycle schedule", done: false },
  ];

  await supabase.from("appointments").insert([
    {
      patient_id: patientId,
      organization_id: ORG_ID,
      created_by: userId,
      title: "Oncology follow-up",
      provider_name: "Dr. Sarah Chen",
      provider_specialty: "oncologist",
      location: "Memorial Cancer Center",
      datetime: oncologyDate.toISOString(),
      duration_minutes: 45,
      appointment_type: "oncology",
      pre_visit_checklist: cholChecklist,
      completed: false,
    },
    {
      patient_id: patientId,
      organization_id: ORG_ID,
      created_by: userId,
      title: "Lab work",
      provider_name: "Memorial Cancer Center Lab",
      provider_specialty: "lab",
      location: "Memorial Cancer Center Lab",
      datetime: labDate.toISOString(),
      duration_minutes: 30,
      appointment_type: "lab",
      pre_visit_checklist: [
        { label: "Fast for 8 hours before", done: false },
        { label: "Bring medication list", done: false },
        { label: "Ask about CA 19-9 results", done: false },
      ],
      completed: false,
    },
  ]);
}

async function seedTrials(userId: string, patientId: string) {
  await supabase.from("trial_saves").delete().eq("patient_id", patientId);
  const trials = [
    { trial_id: "NCT04093362", trial_name: "Pemigatinib for FGFR2+ cholangiocarcinoma", phase: "3" },
    { trial_id: "NCT03111992", trial_name: "Durvalumab + gemcitabine/cisplatin", phase: "3" },
    { trial_id: "NCT05156892", trial_name: "Futibatinib for FGFR2 fusions", phase: "3" },
  ];
  for (const t of trials) {
    await supabase.from("trial_saves").insert({
      patient_id: patientId,
      organization_id: ORG_ID,
      saved_by: userId,
      status: "interested",
      location: "United States",
      match_criteria: { biomarker: "FGFR2 fusion" },
      ...t,
    });
  }
}

async function seedBiomarkers(userId: string, patientId: string) {
  await supabase.from("biomarkers").delete().eq("patient_id", patientId);
  const testedDate = new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const rows = [
    { biomarker_type: "FGFR2 fusion", status: "positive", value: "FGFR2-BICC1", notes: "Actionable; pemigatinib eligible." },
    { biomarker_type: "IDH1 mutation", status: "negative" },
    { biomarker_type: "IDH2 mutation", status: "negative" },
    { biomarker_type: "HER2 amplification", status: "negative" },
    { biomarker_type: "MSI", status: "negative", value: "MSI-stable" },
    { biomarker_type: "TMB", status: "inconclusive", value: "4 mut/Mb" },
    { biomarker_type: "PD-L1 expression", status: "positive", value: "10%" },
    { biomarker_type: "KRAS mutation", status: "negative" },
    { biomarker_type: "BRAF V600E", status: "negative" },
    { biomarker_type: "NTRK fusion", status: "not_tested" },
    { biomarker_type: "CA 19-9", status: "positive", value: "380 U/mL" },
    { biomarker_type: "CEA", status: "positive", value: "8.2 ng/mL" },
  ];
  for (const r of rows) {
    await supabase.from("biomarkers").insert({
      patient_id: patientId,
      organization_id: ORG_ID,
      created_by: userId,
      tested_date: testedDate,
      lab_name: "Memorial Cancer Center Molecular Lab",
      ...r,
    });
  }
}

async function seedFamilyUpdate(userId: string, patientId: string) {
  const labDateStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();
  const oncDateStr = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString();

  const english =
`Hi family,

Carlos had his second chemotherapy session last week. He is handling treatment better than expected.

Recent changes:
- Tumor marker CA 19-9 dropped from 450 to 380 -- a positive sign the treatment is working
- Nausea has been manageable with medication
- Fatigue is his biggest challenge right now

What is helping:
- The anti-nausea medication is working well
- Short walks in the morning are improving his mood

What to watch for:
- Appetite is low -- high-protein, small meals help
- Resting is important on chemo days

Next steps:
- Lab work on ${labDateStr}
- Oncology appointment with Dr. Chen on ${oncDateStr}

Thank you for all your love and support. It means everything to Carlos and to our whole family.`;

  const spanish =
`Hola familia,

Carlos tuvo su segunda sesion de quimioterapia la semana pasada. Esta sobrellevando el tratamiento mejor de lo esperado.

Cambios recientes:
- El marcador tumoral CA 19-9 bajo de 450 a 380 -- una senal positiva de que el tratamiento esta funcionando
- La nausea se ha podido manejar con medicamentos
- El cansancio es actualmente su mayor reto

Lo que esta ayudando:
- El medicamento contra la nausea esta funcionando bien
- Caminatas cortas por la manana estan mejorando su animo

A que estar atentos:
- El apetito esta bajo -- comidas pequenas y ricas en proteina ayudan
- El descanso es importante en los dias de quimio

Proximos pasos:
- Analisis de laboratorio el ${labDateStr}
- Cita con la oncologa Dra. Chen el ${oncDateStr}

Gracias por todo su amor y apoyo. Significa todo para Carlos y para toda nuestra familia.`;

  // Remove any existing demo family updates.
  await supabase
    .from("chat_messages")
    .delete()
    .eq("patient_id", patientId)
    .like("content", "[DEMO_FAMILY_UPDATE%");

  await supabase.from("chat_messages").insert([
    {
      patient_id: patientId,
      organization_id: ORG_ID,
      user_id: userId,
      role: "assistant",
      content: `[DEMO_FAMILY_UPDATE_EN] ${english}`,
    },
    {
      patient_id: patientId,
      organization_id: ORG_ID,
      user_id: userId,
      role: "assistant",
      content: `[DEMO_FAMILY_UPDATE_ES] ${spanish}`,
    },
  ]);
}

async function seedNewlyConnected(patientId: string) {
  await supabase.from("newly_connected_checklists").delete().eq("patient_id", patientId);
  const items = (await import("../lib/ccf/newly-connected-template")).buildChecklist();
  await supabase.from("newly_connected_checklists").insert({
    patient_id: patientId,
    organization_id: ORG_ID,
    checklist_items: items,
  });
}

async function main() {
  console.log("Seeding Carlos Rivera demo environment...");
  const caregiverId = await ensureDemoUser();
  console.log("  caregiver:", caregiverId);
  const conditionId = await getConditionTemplateId();
  const patientId = await upsertPatient(caregiverId, conditionId);
  console.log("  patient :", patientId);
  await seedCareRelationship(caregiverId, patientId);
  await seedSymptomLogs(caregiverId, patientId);
  await seedDocuments(caregiverId, patientId);
  await seedMedications(caregiverId, patientId);
  await seedCareTeam(caregiverId, patientId);
  await seedAppointments(caregiverId, patientId);
  await seedTrials(caregiverId, patientId);
  try {
    await seedBiomarkers(caregiverId, patientId);
  } catch (err) {
    console.warn("  biomarkers seed skipped (table missing?):", err);
  }
  await seedFamilyUpdate(caregiverId, patientId);
  try {
    await seedNewlyConnected(patientId);
  } catch (err) {
    console.warn("  newly_connected seed skipped (table missing?):", err);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
