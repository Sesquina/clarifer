-- Sprint 12 -- Provider Portal schema additions.
-- Extends care_relationships with org / access_level / granted_at /
-- granted_by columns so the provider portal knows which patients a
-- provider may view and at what access level. Adds provider_notes
-- table for clinical notes that are separate from caregiver-facing
-- notes (kept private per provider).
-- DO NOT execute manually -- Samira applies via supabase db push.

ALTER TABLE public.care_relationships
  ADD COLUMN IF NOT EXISTS organization_id UUID
    REFERENCES public.organizations(id),
  ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'read'
    CHECK (access_level IN ('read', 'full')),
  ADD COLUMN IF NOT EXISTS granted_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS granted_by UUID
    REFERENCES public.users(id);

-- Provider notes on a patient (separate from caregiver notes).
-- Each row is owned by the (provider_id, patient_id) pair; visible
-- only to that provider and any admin in the same organization.
CREATE TABLE IF NOT EXISTS public.provider_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL
    REFERENCES public.patients(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL
    REFERENCES public.users(id),
  organization_id UUID NOT NULL
    REFERENCES public.organizations(id),
  note_text TEXT NOT NULL,
  note_type TEXT DEFAULT 'general'
    CHECK (note_type IN ('general', 'visit', 'alert', 'follow_up')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.provider_notes ENABLE ROW LEVEL SECURITY;

-- Org isolation: a row is visible only to users in the same
-- organization. The route layer narrows further to "this provider's
-- own notes" so a provider cannot see another provider's clinical
-- notes -- the org-isolation policy is the safety net.
CREATE POLICY "provider_notes_org_isolation"
  ON public.provider_notes FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM public.users
      WHERE id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_provider_notes_patient
  ON public.provider_notes (patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_notes_provider
  ON public.provider_notes (provider_id);
