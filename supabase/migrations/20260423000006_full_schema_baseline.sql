-- Sprint 7 — full schema baseline.
-- Captures the "pre-existing" tables that were never committed to migration
-- history, so fresh databases can be provisioned reproducibly. All statements
-- are idempotent (IF NOT EXISTS / DROP POLICY IF EXISTS) so this is safe to
-- re-run against production — it will be a no-op for tables that exist.
-- DO NOT EXECUTE manually.

-- ─── users ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  language TEXT,
  organization_id UUID REFERENCES public.organizations(id),
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON public.users(organization_id);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_self_select" ON public.users;
CREATE POLICY "users_self_select" ON public.users FOR SELECT TO authenticated
  USING (id = auth.uid() OR organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));
DROP POLICY IF EXISTS "users_self_update" ON public.users;
CREATE POLICY "users_self_update" ON public.users FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- ─── patients ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  dob DATE,
  sex TEXT,
  condition_template_id UUID REFERENCES public.condition_templates(id),
  custom_diagnosis TEXT,
  diagnosis_date DATE,
  primary_language TEXT,
  photo_url TEXT,
  status TEXT,
  notes TEXT,
  organization_id UUID REFERENCES public.organizations(id),
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_patients_organization_id ON public.patients(organization_id);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "patients_org_isolation" ON public.patients;
CREATE POLICY "patients_org_isolation" ON public.patients FOR ALL TO authenticated
  USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));

-- ─── care_relationships ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.care_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  patient_id UUID REFERENCES public.patients(id),
  relationship_type TEXT,
  access_level TEXT,
  can_log BOOLEAN DEFAULT true,
  can_export BOOLEAN DEFAULT false,
  invited_by UUID REFERENCES public.users(id),
  invited_at TIMESTAMPTZ,
  accepted BOOLEAN DEFAULT false,
  accepted_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  organization_id UUID REFERENCES public.organizations(id)
);
CREATE INDEX IF NOT EXISTS idx_care_relationships_organization_id ON public.care_relationships(organization_id);
CREATE INDEX IF NOT EXISTS idx_care_relationships_patient_id ON public.care_relationships(patient_id);
ALTER TABLE public.care_relationships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "care_relationships_org_isolation" ON public.care_relationships;
CREATE POLICY "care_relationships_org_isolation" ON public.care_relationships FOR ALL TO authenticated
  USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));

-- ─── documents ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id),
  uploaded_by UUID REFERENCES public.users(id),
  title TEXT,
  file_name TEXT,
  file_path TEXT,
  file_type TEXT,
  file_url TEXT,
  mime_type TEXT,
  document_category TEXT,
  analysis_status TEXT,
  analyzed_at TIMESTAMPTZ,
  summary TEXT,
  key_findings JSONB,
  flagged BOOLEAN DEFAULT false,
  share_with_care_team BOOLEAN DEFAULT false,
  share_research BOOLEAN DEFAULT false,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  exported_at TIMESTAMPTZ,
  organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_documents_organization_id ON public.documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_patient_id ON public.documents(patient_id);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "documents_org_isolation" ON public.documents;
CREATE POLICY "documents_org_isolation" ON public.documents FOR ALL TO authenticated
  USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));

-- ─── chat_messages ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id),
  user_id UUID REFERENCES public.users(id),
  document_id UUID REFERENCES public.documents(id),
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_organization_id ON public.chat_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_patient_id ON public.chat_messages(patient_id);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chat_messages_org_isolation" ON public.chat_messages;
CREATE POLICY "chat_messages_org_isolation" ON public.chat_messages FOR ALL TO authenticated
  USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));

-- ─── symptom_logs ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.symptom_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id),
  logged_by UUID REFERENCES public.users(id),
  symptoms JSONB,
  responses JSONB,
  overall_severity INTEGER,
  ai_summary TEXT,
  doctor_statement TEXT,
  condition_context TEXT,
  flagged BOOLEAN DEFAULT false,
  organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_symptom_logs_organization_id ON public.symptom_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_symptom_logs_patient_id ON public.symptom_logs(patient_id);
ALTER TABLE public.symptom_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "symptom_logs_org_isolation" ON public.symptom_logs;
CREATE POLICY "symptom_logs_org_isolation" ON public.symptom_logs FOR ALL TO authenticated
  USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));

-- ─── symptom_alerts ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.symptom_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id),
  alert_type TEXT,
  severity TEXT,
  message TEXT,
  data JSONB,
  triggered_at TIMESTAMPTZ DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES public.users(id),
  organization_id UUID REFERENCES public.organizations(id)
);
CREATE INDEX IF NOT EXISTS idx_symptom_alerts_organization_id ON public.symptom_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_symptom_alerts_patient_id ON public.symptom_alerts(patient_id);
ALTER TABLE public.symptom_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "symptom_alerts_org_isolation" ON public.symptom_alerts;
CREATE POLICY "symptom_alerts_org_isolation" ON public.symptom_alerts FOR ALL TO authenticated
  USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));

-- ─── medications ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id),
  added_by UUID REFERENCES public.users(id),
  name TEXT NOT NULL,
  generic_name TEXT,
  dose TEXT,
  unit TEXT,
  frequency TEXT,
  route TEXT,
  indication TEXT,
  prescriber TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_medications_organization_id ON public.medications(organization_id);
CREATE INDEX IF NOT EXISTS idx_medications_patient_id ON public.medications(patient_id);
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "medications_org_isolation" ON public.medications;
CREATE POLICY "medications_org_isolation" ON public.medications FOR ALL TO authenticated
  USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));

-- ─── appointments ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id),
  created_by UUID REFERENCES public.users(id),
  title TEXT,
  datetime TIMESTAMPTZ,
  duration_minutes INTEGER,
  provider_name TEXT,
  provider_specialty TEXT,
  location TEXT,
  notes TEXT,
  prep_summary TEXT,
  source TEXT,
  completed BOOLEAN DEFAULT false,
  organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_appointments_organization_id ON public.appointments(organization_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "appointments_org_isolation" ON public.appointments;
CREATE POLICY "appointments_org_isolation" ON public.appointments FOR ALL TO authenticated
  USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));

-- ─── trial_saves ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trial_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id),
  saved_by UUID REFERENCES public.users(id),
  trial_id TEXT,
  trial_name TEXT,
  phase TEXT,
  status TEXT,
  location TEXT,
  distance_miles NUMERIC,
  match_criteria JSONB,
  saved_at TIMESTAMPTZ DEFAULT now(),
  organization_id UUID REFERENCES public.organizations(id)
);
CREATE INDEX IF NOT EXISTS idx_trial_saves_organization_id ON public.trial_saves(organization_id);
CREATE INDEX IF NOT EXISTS idx_trial_saves_patient_id ON public.trial_saves(patient_id);
ALTER TABLE public.trial_saves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "trial_saves_org_isolation" ON public.trial_saves;
CREATE POLICY "trial_saves_org_isolation" ON public.trial_saves FOR ALL TO authenticated
  USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));

-- ─── research_consent ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.research_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  patient_id UUID REFERENCES public.patients(id),
  opted_in BOOLEAN DEFAULT false,
  consent_version TEXT,
  consented_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  share_labs BOOLEAN DEFAULT false,
  share_docs BOOLEAN DEFAULT false,
  share_symptoms BOOLEAN DEFAULT false,
  share_medications BOOLEAN DEFAULT false,
  organization_id UUID REFERENCES public.organizations(id)
);
CREATE INDEX IF NOT EXISTS idx_research_consent_organization_id ON public.research_consent(organization_id);
CREATE INDEX IF NOT EXISTS idx_research_consent_patient_id ON public.research_consent(patient_id);
ALTER TABLE public.research_consent ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "research_consent_org_isolation" ON public.research_consent;
CREATE POLICY "research_consent_org_isolation" ON public.research_consent FOR ALL TO authenticated
  USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));

-- ─── anonymized_exports ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.anonymized_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id),
  condition_category TEXT,
  dataset_version TEXT,
  fields_included JSONB,
  exported_at TIMESTAMPTZ DEFAULT now(),
  organization_id UUID REFERENCES public.organizations(id)
);
CREATE INDEX IF NOT EXISTS idx_anonymized_exports_organization_id ON public.anonymized_exports(organization_id);
CREATE INDEX IF NOT EXISTS idx_anonymized_exports_patient_id ON public.anonymized_exports(patient_id);
ALTER TABLE public.anonymized_exports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anonymized_exports_org_isolation" ON public.anonymized_exports;
CREATE POLICY "anonymized_exports_org_isolation" ON public.anonymized_exports FOR ALL TO authenticated
  USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));

-- ─── notifications ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  patient_id UUID REFERENCES public.patients(id),
  title TEXT,
  message TEXT,
  type TEXT,
  action_url TEXT,
  read BOOLEAN DEFAULT false,
  organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_organization_id ON public.notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_patient_id ON public.notifications(patient_id);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_user_scope" ON public.notifications;
CREATE POLICY "notifications_user_scope" ON public.notifications FOR ALL TO authenticated
  USING (user_id = auth.uid() OR organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));

-- ─── calendar_connections ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  provider TEXT,
  access_token TEXT,
  refresh_token TEXT,
  connected_at TIMESTAMPTZ DEFAULT now(),
  last_synced_at TIMESTAMPTZ,
  organization_id UUID REFERENCES public.organizations(id)
);
CREATE INDEX IF NOT EXISTS idx_calendar_connections_organization_id ON public.calendar_connections(organization_id);
ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "calendar_connections_self_only" ON public.calendar_connections;
CREATE POLICY "calendar_connections_self_only" ON public.calendar_connections FOR ALL TO authenticated
  USING (user_id = auth.uid());
