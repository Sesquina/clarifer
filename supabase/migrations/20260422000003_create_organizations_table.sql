-- ============================================================
-- Sprint 3: Organizations table — add missing white-label columns
-- ============================================================
-- NOTE: The organizations table already exists with:
--   id, name, max_patients, subscription_status, subscription_tier, type, created_at
-- This migration adds the columns required for white-label multi-tenancy.
-- Safe to run multiple times (idempotent via IF NOT EXISTS).
-- DO NOT RUN — Samira runs manually in Supabase dashboard.
-- ============================================================

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS slug          text UNIQUE,
  ADD COLUMN IF NOT EXISTS logo_url      text,
  ADD COLUMN IF NOT EXISTS primary_color text,
  ADD COLUMN IF NOT EXISTS updated_at    timestamptz DEFAULT now();

-- Index for slug lookup (used by subdomain routing)
CREATE UNIQUE INDEX IF NOT EXISTS organizations_slug_idx ON public.organizations (slug);

-- Enable RLS (may already be enabled; IF EXISTS guard)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Grant read access so authenticated users can resolve their own org
GRANT SELECT ON public.organizations TO authenticated;

-- RLS: users can read only their own organization
DROP POLICY IF EXISTS "organizations_select_own" ON public.organizations;
CREATE POLICY "organizations_select_own" ON public.organizations
  FOR SELECT USING (
    id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );
