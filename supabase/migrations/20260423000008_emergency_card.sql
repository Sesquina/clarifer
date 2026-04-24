-- Sprint 8 — emergency card + DPD screening columns on patients.
-- DO NOT execute manually. Logged to SPRINT_LOG.md as MIGRATION REQUIRED.

ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS emergency_card_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS blood_type TEXT,
  ADD COLUMN IF NOT EXISTS allergies TEXT[],
  ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS emergency_notes TEXT,
  ADD COLUMN IF NOT EXISTS dpd_deficiency_screened BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS dpd_deficiency_status TEXT;
