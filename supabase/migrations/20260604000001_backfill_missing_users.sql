-- 20260604000001_backfill_missing_users.sql
-- Backfills public.users and public.organizations for every auth.users row
-- that was created before the handle_new_user trigger was applied.
-- Sprint: fix/onboarding-self-heal
-- MIGRATION REQUIRED: Samira runs manually in Supabase SQL Editor (project lrhwgswbsctfqtvdjntr).
-- DO NOT EXECUTE automatically.
-- Idempotent: safe to run multiple times. Existing rows are left unchanged.

DO $$
DECLARE
  auth_user RECORD;
  new_org_id UUID;
  backfill_count INT := 0;
BEGIN
  FOR auth_user IN
    SELECT au.id, au.email
    FROM auth.users au
    LEFT JOIN public.users pu ON pu.id = au.id
    WHERE pu.id IS NULL
  LOOP
    INSERT INTO public.organizations (id, name, created_at)
    VALUES (gen_random_uuid(), 'Personal', now())
    RETURNING id INTO new_org_id;

    INSERT INTO public.users (id, email, organization_id, role, created_at)
    VALUES (auth_user.id, auth_user.email, new_org_id, 'caregiver', now())
    ON CONFLICT (id) DO UPDATE
      SET organization_id = EXCLUDED.organization_id,
          role = COALESCE(public.users.role, 'caregiver');

    backfill_count := backfill_count + 1;
  END LOOP;

  RAISE NOTICE 'Backfilled % missing user rows', backfill_count;
END $$;
