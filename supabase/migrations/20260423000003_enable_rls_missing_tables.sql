-- Sprint 6 — enable RLS on condition_templates and trial_cache.
-- DO NOT execute manually.

-- ─── condition_templates ──────────────────────────────────────────────────────
ALTER TABLE public.condition_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "condition_templates_authenticated_read" ON public.condition_templates;
CREATE POLICY "condition_templates_authenticated_read"
  ON public.condition_templates FOR SELECT
  TO authenticated USING (true);

-- ─── trial_cache ──────────────────────────────────────────────────────────────
-- Fix 2026-04-23: trial_cache was never in version-controlled migrations and
-- does not exist on fresh databases. Create it (idempotently) before enabling RLS.

CREATE TABLE IF NOT EXISTS public.trial_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  patient_id UUID REFERENCES public.patients(id),
  condition_slug TEXT,
  query_hash TEXT,
  results JSONB,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trial_cache_org
  ON public.trial_cache(organization_id);

CREATE INDEX IF NOT EXISTS idx_trial_cache_patient
  ON public.trial_cache(patient_id);

ALTER TABLE public.trial_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trial_cache_org_isolation" ON public.trial_cache;
CREATE POLICY "trial_cache_org_isolation"
  ON public.trial_cache FOR ALL
  USING (
    organization_id = (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );
