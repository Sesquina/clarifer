-- Sprint 10 -- Care team directory schema additions.
-- Existing care_team table (created 20250328000005_care_team.sql) is
-- extended with provider-directory fields. New care_team_message_templates
-- table holds short message presets (refill request, appointment ask, etc.)
-- that the caregiver can copy to clipboard from the directory screen.
-- DO NOT execute manually -- Samira applies via supabase db push.

ALTER TABLE public.care_team
  ADD COLUMN IF NOT EXISTS role TEXT,
  ADD COLUMN IF NOT EXISTS specialty TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS fax TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS npi TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS organization_id UUID
    REFERENCES public.organizations(id),
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS public.care_team_message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_team_member_id UUID NOT NULL
    REFERENCES public.care_team(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.care_team_message_templates
  ENABLE ROW LEVEL SECURITY;
CREATE POLICY "message_templates_org_isolation"
  ON public.care_team_message_templates
  FOR ALL USING (
    care_team_member_id IN (
      SELECT id FROM public.care_team
      WHERE organization_id = (
        SELECT organization_id FROM public.users
        WHERE id = auth.uid()
      )
    )
  );
