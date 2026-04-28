-- Sprint 9 Rescue -- record the timestamp of ToS + Privacy Policy acceptance at signup.
-- Captured by app/signup/page.tsx after the user checks the agree boxes (line 67 gates submit).
-- Idempotent: ADD COLUMN IF NOT EXISTS is safe to re-run.
-- DO NOT execute manually; Samira applies via supabase db push.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
