-- Migration: account deletion cascade
-- Purpose: ensure all user and patient data is removed on account deletion
-- Tables covered:
--   care_relationships, symptom_alerts, research_consent, anonymized_exports,
--   notifications, calendar_connections, family_updates, medical_disclaimer_acceptances,
--   newly_connected_checklists, ai_analysis_consents, provider_notes,
--   care_team_message_templates
-- MIGRATION REQUIRED: run manually in Supabase SQL Editor
-- Do NOT execute automatically

-- ─── care_relationships ──────────────────────────────────────────────────────
-- user_id: caregiver user being deleted → cascade their relationships.
-- patient_id: patient being deleted → cascade all relationships for that patient.
ALTER TABLE public.care_relationships
  DROP CONSTRAINT IF EXISTS care_relationships_user_id_fkey,
  ADD CONSTRAINT care_relationships_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.care_relationships
  DROP CONSTRAINT IF EXISTS care_relationships_patient_id_fkey,
  ADD CONSTRAINT care_relationships_patient_id_fkey
    FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;

-- ─── symptom_alerts ──────────────────────────────────────────────────────────
-- patient_id: alert belongs to the patient → cascade on patient deletion.
-- acknowledged_by: nullable user reference; SET NULL to preserve the alert
--   record (clinical audit value) while removing the user pointer.
ALTER TABLE public.symptom_alerts
  DROP CONSTRAINT IF EXISTS symptom_alerts_patient_id_fkey,
  ADD CONSTRAINT symptom_alerts_patient_id_fkey
    FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;

ALTER TABLE public.symptom_alerts
  DROP CONSTRAINT IF EXISTS symptom_alerts_acknowledged_by_fkey,
  ADD CONSTRAINT symptom_alerts_acknowledged_by_fkey
    FOREIGN KEY (acknowledged_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- ─── research_consent ────────────────────────────────────────────────────────
ALTER TABLE public.research_consent
  DROP CONSTRAINT IF EXISTS research_consent_user_id_fkey,
  ADD CONSTRAINT research_consent_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.research_consent
  DROP CONSTRAINT IF EXISTS research_consent_patient_id_fkey,
  ADD CONSTRAINT research_consent_patient_id_fkey
    FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;

-- ─── anonymized_exports ──────────────────────────────────────────────────────
ALTER TABLE public.anonymized_exports
  DROP CONSTRAINT IF EXISTS anonymized_exports_patient_id_fkey,
  ADD CONSTRAINT anonymized_exports_patient_id_fkey
    FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;

-- ─── notifications ───────────────────────────────────────────────────────────
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_user_id_fkey,
  ADD CONSTRAINT notifications_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_patient_id_fkey,
  ADD CONSTRAINT notifications_patient_id_fkey
    FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;

-- ─── calendar_connections ────────────────────────────────────────────────────
ALTER TABLE public.calendar_connections
  DROP CONSTRAINT IF EXISTS calendar_connections_user_id_fkey,
  ADD CONSTRAINT calendar_connections_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- ─── ai_analysis_consents ────────────────────────────────────────────────────
ALTER TABLE public.ai_analysis_consents
  DROP CONSTRAINT IF EXISTS ai_analysis_consents_user_id_fkey,
  ADD CONSTRAINT ai_analysis_consents_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.ai_analysis_consents
  DROP CONSTRAINT IF EXISTS ai_analysis_consents_patient_id_fkey,
  ADD CONSTRAINT ai_analysis_consents_patient_id_fkey
    FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;

-- ─── provider_notes ──────────────────────────────────────────────────────────
-- patient_id already has ON DELETE CASCADE (20260428000006_provider_portal.sql).
-- provider_id does not: if the provider deletes their account, their notes
-- would become orphaned. CASCADE removes them.
ALTER TABLE public.provider_notes
  DROP CONSTRAINT IF EXISTS provider_notes_provider_id_fkey,
  ADD CONSTRAINT provider_notes_provider_id_fkey
    FOREIGN KEY (provider_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- ─── Already covered by existing CASCADE (no changes needed) ─────────────────
-- family_updates.patient_id              ON DELETE CASCADE (20260424000006_trials_family.sql)
-- medical_disclaimer_acceptances.user_id ON DELETE CASCADE (20260422000006_add_roles_table.sql)
-- newly_connected_checklists.patient_id  ON DELETE CASCADE (20260423000010_newly_connected.sql)
-- provider_notes.patient_id              ON DELETE CASCADE (20260428000006_provider_portal.sql)
-- care_team_message_templates.care_team_member_id ON DELETE CASCADE (20260428000004_care_team_directory.sql)
