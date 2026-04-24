-- Sprint 7 — add pre/post-visit fields to appointments.
-- DO NOT execute manually.

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS pre_visit_checklist JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS post_visit_notes TEXT,
  ADD COLUMN IF NOT EXISTS appointment_type TEXT DEFAULT 'other';
