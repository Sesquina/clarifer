-- Add emergency_token to patients for shareable public emergency card links.
-- Each patient gets a unique opaque token that allows unauthenticated read
-- of their emergency card without exposing the patient UUID in the URL.
-- Run in Supabase SQL Editor before testing feat/emergency-card-public.

ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS emergency_token TEXT
    DEFAULT gen_random_uuid()::text UNIQUE;

UPDATE patients SET emergency_token = gen_random_uuid()::text
  WHERE emergency_token IS NULL;
