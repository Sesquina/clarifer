-- Sprint 11 -- Appointment tracker: structured post-visit action items.
-- post_visit_notes is free-text and stays as the caregiver's narrative
-- recap. post_visit_action_items is a structured JSONB list of items
-- with a `text` and `done` boolean so the caregiver can tick them off
-- between visits without losing the narrative notes.
-- DO NOT execute manually -- Samira applies via supabase db push.

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS post_visit_action_items JSONB;

-- Index supports the upcoming-appointments dashboard query.
CREATE INDEX IF NOT EXISTS idx_appointments_patient_datetime
  ON public.appointments (patient_id, datetime);
