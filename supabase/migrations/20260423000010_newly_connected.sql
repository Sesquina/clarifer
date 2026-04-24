-- Sprint 8 — newly connected 30-day onboarding checklist per patient.
-- DO NOT execute manually. Logged to SPRINT_LOG.md as MIGRATION REQUIRED.

CREATE TABLE IF NOT EXISTS public.newly_connected_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  checklist_items JSONB NOT NULL DEFAULT '[]',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.newly_connected_checklists
  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "newly_connected_org_isolation"
  ON public.newly_connected_checklists;
CREATE POLICY "newly_connected_org_isolation"
  ON public.newly_connected_checklists FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM public.users
      WHERE id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_newly_connected_patient
  ON public.newly_connected_checklists(patient_id);
