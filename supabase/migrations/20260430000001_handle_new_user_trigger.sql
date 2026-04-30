-- 20260430000001_handle_new_user_trigger.sql
-- Provisions a personal organization and public.users row for every new signup.
-- Covers all auth paths: email/password, Google OAuth, Apple Sign In.
-- Sprint: fix/new-user-signup
-- MIGRATION REQUIRED: Samira runs manually in Supabase SQL Editor (project lrhwgswbsctfqtvdjntr).
-- DO NOT EXECUTE automatically.

-- ─── handle_new_user ─────────────────────────────────────────────────────────
-- SECURITY DEFINER: runs with the function owner's privileges so it can write
-- to both public.organizations and public.users regardless of caller RLS.
-- SET search_path = public: prevents search-path injection attacks.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create a personal organization for this user.
  INSERT INTO public.organizations (id, name, created_at)
  VALUES (gen_random_uuid(), 'Personal', now())
  RETURNING id INTO new_org_id;

  -- Create the public user profile linked to the new org.
  -- ON CONFLICT guards against the rare case where a partial users row
  -- was written by an earlier failed attempt -- update org + role rather
  -- than error out and leave the user stuck.
  INSERT INTO public.users (id, email, organization_id, role, created_at)
  VALUES (NEW.id, NEW.email, new_org_id, 'caregiver', now())
  ON CONFLICT (id) DO UPDATE
    SET organization_id = EXCLUDED.organization_id,
        role            = COALESCE(public.users.role, 'caregiver');

  RETURN NEW;
END;
$$;

-- ─── on_auth_user_created ────────────────────────────────────────────────────
-- Fires once per row, after every INSERT on auth.users.
-- DROP IF EXISTS makes the migration idempotent on re-run.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
