-- Add language preference to patients table
-- city and state columns already exist from migration 20260424000006_trials_family.sql
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS language_preference text DEFAULT 'en';

COMMENT ON COLUMN public.patients.language_preference IS
  'Preferred language for AI-generated content. Values: en, es.';
