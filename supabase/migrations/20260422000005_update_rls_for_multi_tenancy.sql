-- ============================================================
-- Sprint 3: Replace all RLS policies with org-scoped versions
-- ============================================================
-- PREREQUISITE: Migration 20260422000004 must run first (organization_id columns exist).
-- All existing policies are dropped and replaced with organization_id-scoped ones.
-- The subquery (SELECT organization_id FROM users WHERE id = auth.uid()) is the
-- tenancy anchor — every policy uses it to resolve the caller's org.
-- DO NOT RUN — Samira runs manually in Supabase dashboard.
-- ============================================================

-- ─── Helper: single reusable org resolution ─────────────────────────────────
-- Used inline in each policy to keep policies readable.
-- auth.uid() resolves the Supabase auth user; we look up their org.

-- ─── Drop all existing policies cleanly ─────────────────────────────────────

DO $$
DECLARE
  _tbl  text;
  _pol  record;
BEGIN
  FOR _tbl IN SELECT unnest(ARRAY[
    'patients','appointments','documents','chat_messages','symptom_logs',
    'medications','trial_saves','audit_log','research_consent','notifications',
    'calendar_connections','symptom_alerts','anonymized_exports',
    'users','care_relationships','organizations'
  ])
  LOOP
    FOR _pol IN
      SELECT policyname FROM pg_policies WHERE tablename = _tbl AND schemaname = 'public'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', _pol.policyname, _tbl);
    END LOOP;
  END LOOP;
END $$;

-- ─── Enable RLS on all tables (idempotent) ───────────────────────────────────

ALTER TABLE public.patients             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trial_saves          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_consent     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_alerts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymized_exports   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_relationships   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations        ENABLE ROW LEVEL SECURITY;

-- ─── users ───────────────────────────────────────────────────────────────────
-- Users can read all users in their org (needed for provider listings).
-- Users can only update their own row.

CREATE POLICY "users_select_same_org" ON public.users
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- ─── organizations ───────────────────────────────────────────────────────────

CREATE POLICY "organizations_select_own" ON public.organizations
  FOR SELECT USING (
    id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );

-- ─── patients ────────────────────────────────────────────────────────────────

CREATE POLICY "patients_select_same_org" ON public.patients
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY "patients_insert_same_org" ON public.patients
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY "patients_update_same_org" ON public.patients
  FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY "patients_delete_same_org" ON public.patients
  FOR DELETE USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );

-- ─── appointments ─────────────────────────────────────────────────────────────

CREATE POLICY "appointments_select_same_org" ON public.appointments
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY "appointments_insert_same_org" ON public.appointments
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY "appointments_update_same_org" ON public.appointments
  FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY "appointments_delete_same_org" ON public.appointments
  FOR DELETE USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );

-- ─── documents ───────────────────────────────────────────────────────────────

CREATE POLICY "documents_select_same_org" ON public.documents
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY "documents_insert_same_org" ON public.documents
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY "documents_update_same_org" ON public.documents
  FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY "documents_delete_same_org" ON public.documents
  FOR DELETE USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );

-- ─── chat_messages ───────────────────────────────────────────────────────────

CREATE POLICY "chat_messages_select_same_org" ON public.chat_messages
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY "chat_messages_insert_same_org" ON public.chat_messages
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );

-- ─── symptom_logs ────────────────────────────────────────────────────────────

CREATE POLICY "symptom_logs_select_same_org" ON public.symptom_logs
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY "symptom_logs_insert_same_org" ON public.symptom_logs
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );

-- ─── medications ─────────────────────────────────────────────────────────────

CREATE POLICY "medications_select_same_org" ON public.medications
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY "medications_insert_same_org" ON public.medications
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY "medications_update_same_org" ON public.medications
  FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );

-- ─── trial_saves ─────────────────────────────────────────────────────────────

CREATE POLICY "trial_saves_select_same_org" ON public.trial_saves
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY "trial_saves_insert_same_org" ON public.trial_saves
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY "trial_saves_delete_same_org" ON public.trial_saves
  FOR DELETE USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );

-- ─── audit_log ───────────────────────────────────────────────────────────────
-- audit_log is write-only from authenticated users within their org.
-- No SELECT for regular users — admin-only reads enforced at app layer.

CREATE POLICY "audit_log_insert_same_org" ON public.audit_log
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );

-- ─── research_consent ────────────────────────────────────────────────────────

CREATE POLICY "research_consent_select_same_org" ON public.research_consent
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY "research_consent_insert_same_org" ON public.research_consent
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY "research_consent_update_same_org" ON public.research_consent
  FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );

-- ─── notifications ───────────────────────────────────────────────────────────

CREATE POLICY "notifications_select_same_org" ON public.notifications
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
    AND user_id = auth.uid()
  );
CREATE POLICY "notifications_update_same_org" ON public.notifications
  FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
    AND user_id = auth.uid()
  );

-- ─── calendar_connections ────────────────────────────────────────────────────

CREATE POLICY "calendar_connections_select_same_org" ON public.calendar_connections
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY "calendar_connections_insert_same_org" ON public.calendar_connections
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY "calendar_connections_update_same_org" ON public.calendar_connections
  FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY "calendar_connections_delete_same_org" ON public.calendar_connections
  FOR DELETE USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );

-- ─── symptom_alerts ──────────────────────────────────────────────────────────

CREATE POLICY "symptom_alerts_select_same_org" ON public.symptom_alerts
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY "symptom_alerts_insert_same_org" ON public.symptom_alerts
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );

-- ─── anonymized_exports ──────────────────────────────────────────────────────

CREATE POLICY "anonymized_exports_select_same_org" ON public.anonymized_exports
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY "anonymized_exports_insert_same_org" ON public.anonymized_exports
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );

-- ─── care_relationships ──────────────────────────────────────────────────────

CREATE POLICY "care_relationships_select_same_org" ON public.care_relationships
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY "care_relationships_insert_same_org" ON public.care_relationships
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY "care_relationships_update_same_org" ON public.care_relationships
  FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY "care_relationships_delete_same_org" ON public.care_relationships
  FOR DELETE USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );
