-- Trial search cache (24-hour TTL)
CREATE TABLE IF NOT EXISTS public.trial_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('clinicaltrials.gov', 'who_ictrp', 'merged')),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);
ALTER TABLE public.trial_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trial_cache_service_only" ON public.trial_cache FOR ALL USING (false);
CREATE INDEX IF NOT EXISTS idx_trial_cache_key ON public.trial_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_trial_cache_expires ON public.trial_cache(expires_at);

-- Family updates (generated and edited care updates)
CREATE TABLE IF NOT EXISTS public.family_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  generated_by UUID NOT NULL REFERENCES public.users(id),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  language TEXT NOT NULL CHECK (language IN ('en', 'es')),
  date_range_days INT NOT NULL,
  update_text TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT now(),
  edited_at TIMESTAMPTZ,
  edited_text TEXT
);
ALTER TABLE public.family_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_updates_org_isolation" ON public.family_updates
  FOR ALL USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_family_updates_patient ON public.family_updates(patient_id, generated_at DESC);

-- Patient location (city, state, country) for trial search prefilter
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'United States';
