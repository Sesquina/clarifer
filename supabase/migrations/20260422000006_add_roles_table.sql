-- ============================================================
-- Sprint 4: Add role enum, medical_disclaimer_acceptances table
-- ============================================================
-- DO NOT RUN — Samira runs manually in Supabase dashboard.
-- ============================================================

-- ─── Role enum (used in users.role column) ───────────────────────────────────

DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('caregiver', 'patient', 'provider', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ─── medical_disclaimer_acceptances ──────────────────────────────────────────
-- Tracks which users have accepted the HIPAA medical disclaimer and at what version.
-- If disclaimer_version changes, the modal is shown again on next app load.

CREATE TABLE IF NOT EXISTS public.medical_disclaimer_acceptances (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id    uuid REFERENCES public.organizations(id),
  accepted_at        timestamptz NOT NULL DEFAULT now(),
  disclaimer_version text NOT NULL DEFAULT '1.0',
  user_agent         text,
  platform           text -- 'ios' | 'android' | 'web'
);

CREATE INDEX IF NOT EXISTS disclaimer_acceptances_user_id_idx
  ON public.medical_disclaimer_acceptances (user_id);

CREATE INDEX IF NOT EXISTS disclaimer_acceptances_org_id_idx
  ON public.medical_disclaimer_acceptances (organization_id);

-- ─── RLS for medical_disclaimer_acceptances ───────────────────────────────────

ALTER TABLE public.medical_disclaimer_acceptances ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.medical_disclaimer_acceptances TO authenticated;

-- Users can only read and write their own disclaimer records
CREATE POLICY "disclaimer_select_own" ON public.medical_disclaimer_acceptances
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "disclaimer_insert_own" ON public.medical_disclaimer_acceptances
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ─── users: ensure role column accepts the enum values ───────────────────────
-- The role column already exists (text). This documents the valid values.
-- If role column needs to be converted to enum type, run separately after data migration.
-- For now, a check constraint enforces the valid set:

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('caregiver', 'patient', 'provider', 'admin'));

-- ─── Indexes on users for role-based queries ─────────────────────────────────

CREATE INDEX IF NOT EXISTS users_role_idx ON public.users (role);
CREATE INDEX IF NOT EXISTS users_org_role_idx ON public.users (organization_id, role);
