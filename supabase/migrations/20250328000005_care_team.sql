CREATE TABLE IF NOT EXISTS public.care_team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id),
  name text NOT NULL,
  role text,
  phone text,
  email text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.care_team ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.care_team TO authenticated;

CREATE POLICY "care_team_select" ON public.care_team
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.patients WHERE patients.id = care_team.patient_id AND patients.created_by = auth.uid())
  );
CREATE POLICY "care_team_insert" ON public.care_team
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.patients WHERE patients.id = care_team.patient_id AND patients.created_by = auth.uid())
  );
CREATE POLICY "care_team_update" ON public.care_team
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.patients WHERE patients.id = care_team.patient_id AND patients.created_by = auth.uid())
  );
CREATE POLICY "care_team_delete" ON public.care_team
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.patients WHERE patients.id = care_team.patient_id AND patients.created_by = auth.uid())
  );
