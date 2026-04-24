-- Sprint 8 — biomarkers table for condition-specific molecular profiling.
-- DO NOT execute manually. Logged to SPRINT_LOG.md as MIGRATION REQUIRED.

CREATE TABLE IF NOT EXISTS public.biomarkers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  biomarker_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN (
    'positive', 'negative', 'not_tested',
    'pending', 'inconclusive'
  )),
  value TEXT,
  tested_date DATE,
  lab_name TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.biomarkers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "biomarkers_org_isolation"
  ON public.biomarkers;
CREATE POLICY "biomarkers_org_isolation"
  ON public.biomarkers FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM public.users
      WHERE id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_biomarkers_patient
  ON public.biomarkers(patient_id);
CREATE INDEX IF NOT EXISTS idx_biomarkers_org
  ON public.biomarkers(organization_id);
