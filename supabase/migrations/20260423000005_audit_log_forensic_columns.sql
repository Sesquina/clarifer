-- Sprint 6 — extend audit_log with forensic columns (ip_address, user_agent, status)
-- used by the new audit write pattern. DO NOT execute manually.

ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT;
