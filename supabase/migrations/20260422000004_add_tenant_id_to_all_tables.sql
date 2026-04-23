-- ============================================================
-- Sprint 3: Add organization_id to all user-facing tables
-- ============================================================
-- PREREQUISITE: Migration 20260422000003 must run first.
-- BEFORE RUNNING: Samira must provide DEFAULT_ORG_UUID —
--   the UUID of the seed organization for existing rows.
--   Replace all occurrences of 'SAMIRA_DEFAULT_ORG_UUID' below
--   with the actual UUID from the organizations table.
-- Safe to run multiple times (ADD COLUMN IF NOT EXISTS).
-- DO NOT RUN — Samira runs manually in Supabase dashboard.
-- ============================================================

-- NOTE: Tables already having organization_id (no action needed):
--   users, care_relationships, organization_patients
--
-- NOTE: Tables in spec that do not exist in schema (skipped):
--   trial_cache, medical_disclaimer_acceptances, ai_analysis_consents
--   Action required: create these tables separately if needed.

-- ─── 1. ADD COLUMNS (nullable for safe migration) ───────────────────────────

ALTER TABLE public.patients             ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.appointments         ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.documents            ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.chat_messages        ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.symptom_logs         ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.medications          ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.trial_saves          ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.audit_log            ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.research_consent     ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.notifications        ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.calendar_connections ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.symptom_alerts       ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.anonymized_exports   ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- ─── 2. BACKFILL: set all existing rows to default organization ──────────────
-- Replace 'SAMIRA_DEFAULT_ORG_UUID' with the actual org UUID before running.

UPDATE public.patients             SET organization_id = 'SAMIRA_DEFAULT_ORG_UUID' WHERE organization_id IS NULL;
UPDATE public.appointments         SET organization_id = 'SAMIRA_DEFAULT_ORG_UUID' WHERE organization_id IS NULL;
UPDATE public.documents            SET organization_id = 'SAMIRA_DEFAULT_ORG_UUID' WHERE organization_id IS NULL;
UPDATE public.chat_messages        SET organization_id = 'SAMIRA_DEFAULT_ORG_UUID' WHERE organization_id IS NULL;
UPDATE public.symptom_logs         SET organization_id = 'SAMIRA_DEFAULT_ORG_UUID' WHERE organization_id IS NULL;
UPDATE public.medications          SET organization_id = 'SAMIRA_DEFAULT_ORG_UUID' WHERE organization_id IS NULL;
UPDATE public.trial_saves          SET organization_id = 'SAMIRA_DEFAULT_ORG_UUID' WHERE organization_id IS NULL;
UPDATE public.audit_log            SET organization_id = 'SAMIRA_DEFAULT_ORG_UUID' WHERE organization_id IS NULL;
UPDATE public.research_consent     SET organization_id = 'SAMIRA_DEFAULT_ORG_UUID' WHERE organization_id IS NULL;
UPDATE public.notifications        SET organization_id = 'SAMIRA_DEFAULT_ORG_UUID' WHERE organization_id IS NULL;
UPDATE public.calendar_connections SET organization_id = 'SAMIRA_DEFAULT_ORG_UUID' WHERE organization_id IS NULL;
UPDATE public.symptom_alerts       SET organization_id = 'SAMIRA_DEFAULT_ORG_UUID' WHERE organization_id IS NULL;
UPDATE public.anonymized_exports   SET organization_id = 'SAMIRA_DEFAULT_ORG_UUID' WHERE organization_id IS NULL;

-- ─── 3. ENFORCE NOT NULL after backfill ─────────────────────────────────────

ALTER TABLE public.patients             ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.appointments         ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.documents            ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.chat_messages        ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.symptom_logs         ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.medications          ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.trial_saves          ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.audit_log            ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.research_consent     ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.notifications        ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.calendar_connections ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.symptom_alerts       ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.anonymized_exports   ALTER COLUMN organization_id SET NOT NULL;

-- ─── 4. INDEXES for performance ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS patients_organization_id_idx             ON public.patients             (organization_id);
CREATE INDEX IF NOT EXISTS appointments_organization_id_idx         ON public.appointments         (organization_id);
CREATE INDEX IF NOT EXISTS documents_organization_id_idx            ON public.documents            (organization_id);
CREATE INDEX IF NOT EXISTS chat_messages_organization_id_idx        ON public.chat_messages        (organization_id);
CREATE INDEX IF NOT EXISTS symptom_logs_organization_id_idx         ON public.symptom_logs         (organization_id);
CREATE INDEX IF NOT EXISTS medications_organization_id_idx          ON public.medications          (organization_id);
CREATE INDEX IF NOT EXISTS trial_saves_organization_id_idx          ON public.trial_saves          (organization_id);
CREATE INDEX IF NOT EXISTS audit_log_organization_id_idx            ON public.audit_log            (organization_id);
CREATE INDEX IF NOT EXISTS research_consent_organization_id_idx     ON public.research_consent     (organization_id);
CREATE INDEX IF NOT EXISTS notifications_organization_id_idx        ON public.notifications        (organization_id);
CREATE INDEX IF NOT EXISTS calendar_connections_organization_id_idx ON public.calendar_connections (organization_id);
CREATE INDEX IF NOT EXISTS symptom_alerts_organization_id_idx       ON public.symptom_alerts       (organization_id);
CREATE INDEX IF NOT EXISTS anonymized_exports_organization_id_idx   ON public.anonymized_exports   (organization_id);

-- ─── 5. GRANT permissions on new columns ────────────────────────────────────

GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients             TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.symptom_logs         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medications          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trial_saves          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_log            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.research_consent     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_connections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.symptom_alerts       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anonymized_exports   TO authenticated;
