-- Sprint 6 — enable RLS on condition_templates and trial_cache.
-- DO NOT execute manually.

ALTER TABLE public.condition_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "condition_templates_authenticated_read" ON public.condition_templates;
CREATE POLICY "condition_templates_authenticated_read"
  ON public.condition_templates FOR SELECT
  TO authenticated USING (true);

ALTER TABLE public.trial_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trial_cache_org_isolation" ON public.trial_cache;
CREATE POLICY "trial_cache_org_isolation"
  ON public.trial_cache FOR ALL
  USING (
    organization_id = (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );
