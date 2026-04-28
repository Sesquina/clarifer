-- Sprint 10 -- WHO ICTRP local mirror table.
-- Source: weekly XML / CSV bulk export from WHO ICTRP search portal
-- (https://www.who.int/tools/clinical-trials-registry-platform/network/
--  who-data-set/downloading-records-from-the-ictrp-database).
-- Ingested by app/api/admin/who-ictrp-ingest at admin discretion.
-- DO NOT execute manually -- Samira applies via supabase db push.

CREATE TABLE IF NOT EXISTS public.who_ictrp_trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  condition TEXT,
  phase TEXT,
  countries TEXT[],
  status TEXT,
  sponsor TEXT,
  primary_sponsor TEXT,
  date_registration TIMESTAMPTZ,
  url TEXT,
  raw JSONB,
  ingested_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.who_ictrp_trials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "who_ictrp_service_only"
  ON public.who_ictrp_trials FOR ALL USING (false);
CREATE INDEX IF NOT EXISTS idx_who_ictrp_condition
  ON public.who_ictrp_trials
  USING gin(to_tsvector('english', coalesce(condition,'')));
CREATE INDEX IF NOT EXISTS idx_who_ictrp_countries
  ON public.who_ictrp_trials USING gin(countries);
