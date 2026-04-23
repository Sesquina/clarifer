-- Sprint 6 — add ai_analysis_consents table (required before AI touches PHI).
-- DO NOT execute manually; run via Supabase migration pipeline.

CREATE TABLE IF NOT EXISTS public.ai_analysis_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  consent_type TEXT NOT NULL DEFAULT 'document_analysis',
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  disclaimer_version TEXT NOT NULL DEFAULT '1.0',
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ai_analysis_consents ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ai_consents_patient
  ON public.ai_analysis_consents(patient_id);
CREATE INDEX IF NOT EXISTS idx_ai_consents_org
  ON public.ai_analysis_consents(organization_id);

DROP POLICY IF EXISTS "ai_consents_org_isolation" ON public.ai_analysis_consents;
CREATE POLICY "ai_consents_org_isolation"
  ON public.ai_analysis_consents
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );
