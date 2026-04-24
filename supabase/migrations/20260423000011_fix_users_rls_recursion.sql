-- Sprint 8 hotfix — eliminate infinite recursion in RLS policies on
-- public.users.
--
-- Prior policies (users_select_same_org in 20260422000005 and
-- users_self_select in 20260423000006) used:
--   SELECT organization_id FROM public.users WHERE id = auth.uid()
-- inside a policy ON public.users, which re-triggers the same policy and
-- PostgreSQL aborts with "infinite recursion detected in policy for
-- relation users".
--
-- Fix: drop all row-level policies on public.users and recreate them using
-- auth.uid() directly. Each user can only read and update their own row.
-- Cross-user queries (e.g. provider listings) must be served from a
-- SECURITY DEFINER view or handled in application code with the service
-- role, not via this policy.
--
-- DO NOT execute manually. Logged to SPRINT_LOG.md as MIGRATION REQUIRED.

DROP POLICY IF EXISTS "users_select_same_org" ON public.users;
DROP POLICY IF EXISTS "users_self_select" ON public.users;
DROP POLICY IF EXISTS "users_self_update" ON public.users;
DROP POLICY IF EXISTS "users_select" ON public.users;
DROP POLICY IF EXISTS "users_insert" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_update" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_org_isolation" ON public.users;

CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);
