-- 20260530000001_waitlist_fields.sql
-- Adds extended fields to the waitlist table to support the new form.
-- MIGRATION REQUIRED: run in Supabase SQL Editor on project lrhwgswbsctfqtvdjntr.
-- DO NOT EXECUTE automatically.

ALTER TABLE public.waitlist
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS caring_for TEXT,
  ADD COLUMN IF NOT EXISTS challenges TEXT[],
  ADD COLUMN IF NOT EXISTS why_clarifer TEXT,
  ADD COLUMN IF NOT EXISTS marketing_optin BOOLEAN DEFAULT FALSE;
