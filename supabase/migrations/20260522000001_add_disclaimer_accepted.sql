-- Add disclaimer acceptance tracking to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS disclaimer_accepted_at timestamptz;

COMMENT ON COLUMN public.users.disclaimer_accepted_at IS
  'Timestamp when user accepted the medical disclaimer. Required before accessing patient data.';
