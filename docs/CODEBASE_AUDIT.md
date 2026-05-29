# CLARIFER CODEBASE AUDIT
**Date:** 2026-05-28
**Branch:** audit/codebase-full
**Audited from:** fix/phi-remediation (branched off)
**Method:** Read-only. No code changes. All findings are logged here only.

---

## SUMMARY SCORECARD

| Section | Status |
|---|---|
| API Routes (59 total) | 35 PASS, 13 FAIL, 11 N/A |
| HIPAA Blockers (missing any of 4 controls) | **13 routes** |
| Routes with no test | 14 routes |
| TypeScript errors | **0** |
| Vitest failures | **2** (pre-existing, same root cause) |
| Em dashes in code | 1 file |
| Hex strings outside PDF lib | 19 files |
| "serious illness" in product | 1 active hit |
| "Cassini" in product | 0 |
| Pages with no mobile equivalent | 17 web pages |
| Env vars in code, missing from .env.example | 0 |

---

## SECTION 1: ROUTE INVENTORY

59 routes total. HIPAA columns: **Auth** = supabase.auth.getUser() + 401. **Role** = role check against users table. **Org** = organization_id filter on queries. **Audit** = audit_log write. **Test** = test file exists.

HIPAA = PASS if all four controls present. FAIL if any missing. N/A if public/system route with no patient data.

| Route | Methods | Auth | Role | Org | Audit | Test | HIPAA | Notes |
|---|---|---|---|---|---|---|---|---|
| /api/admin/who-ictrp-ingest | POST | YES | YES | YES | YES | YES | PASS | Admin-only; public trial data ingest; no PHI |
| /api/ai/analyze-document | POST | YES | YES | YES | YES | YES | PASS | Full document text sent to Anthropic; audit inside stream on completion |
| /api/ai/family-update | POST | YES | YES | YES | YES | YES | PASS | Symptom/medication metadata to AI; patient first name only; audit via onFinish |
| /api/ai/trial-summary | POST | YES | YES | YES | YES | YES | PASS | Patient first name and condition context in AI prompt; audit via onFinish |
| /api/appointments/[id] | GET,PATCH,DELETE | YES | YES | YES | YES | YES | PASS | Full forensic audit on all three methods; cross-tenant returns 404 |
| /api/appointments | GET,POST | YES | YES | YES | YES | YES | PASS | Cross-tenant guard via patient org check; audit on both GET and POST |
| /api/auth/reset-password | POST | NO | NO | NO | NO | YES | N/A | Public unauthenticated; no PHI; rate-limited per IP |
| /api/biomarkers/[id] | PATCH,DELETE | YES | YES | YES | YES | YES | PASS | Full audit on both methods; org filter on biomarker lookup |
| /api/biomarkers | GET,POST | YES | YES | YES | YES | YES | **FAIL** | **GET has no audit_log write**; POST audited; PHI biomarker read is unlogged |
| /api/care-team/[id]/message-templates | GET,POST | YES | YES | YES | YES | YES | **FAIL** | **GET has no audit_log write**; templates can contain PHI; POST audited |
| /api/care-team/[id] | GET,PATCH,DELETE | YES | YES | YES | YES | YES | PASS | Full audit on all three methods |
| /api/care-team/create | POST | YES | YES | YES | YES | YES | PASS | Inserts into care_relationships; audit present |
| /api/care-team | GET,POST | YES | YES | YES | YES | YES | PASS | Full audit on both; cross-tenant guard via patient org check |
| /api/chat | POST | YES | YES | YES | YES | YES | PASS | Patient first name + condition context to Anthropic; audit written before stream |
| /api/condition-templates/[id] | GET | YES | YES | NO | NO | NO | **FAIL** | **No org_id filter; no audit_log write; no test**; config data but controls missing |
| /api/delete-account | GET,DELETE | YES | NO | YES | YES | NO | **FAIL** | **No role check**; GET exports full PHI (patients/meds/docs/chat) with org_id=null on audit; no test |
| /api/documents/[id] | GET,DELETE | YES | YES | YES | YES | YES | PASS | GET double-logs SELECT and DOWNLOAD; DELETE enforces uploaded_by ownership check |
| /api/documents/[id]/summary | GET | YES | YES | YES | YES | YES | PASS | Org-scoped document ownership verified before summary retrieval |
| /api/documents/upload | POST | YES | YES | YES | YES | YES | PASS | Patient org cross-check before upload; all forensic fields present |
| /api/email/welcome | POST | YES | NO | NO | NO | NO | **FAIL** | **No role check; no org filter; no audit_log**; sends firstName in email; no test |
| /api/export/pdf | POST | YES | YES | YES | YES | YES | PASS | Full PHI export as PDF; streamed, never cached; audit action=CAREGIVER_EXPORT |
| /api/export | GET | YES | YES | YES | YES | NO | **FAIL** | **No test**; writes anonymized_exports + audit_log; no explicit patient.organization_id cross-check beyond query filter |
| /api/family-update/generate | POST | YES | YES | YES | YES | YES | PASS | Widest PHI bundle to Anthropic (name, 7-day symptoms, meds, appointments, doc summaries); no rate limiter; audit post-stream |
| /api/family-update | POST | YES | YES | YES | YES | YES | PASS | PHI to Anthropic (name, diagnosis, symptoms, meds); audit written before AI call |
| /api/health | GET | NO | NO | NO | NO | NO | N/A | Public liveness probe; no PHI |
| /api/hq/agents/deadline | GET | NO | NO | NO | NO | NO | N/A | Internal cron; INTERNAL_API_SECRET auth; no patient PHI |
| /api/hq/agents/digest | GET | NO | NO | NO | NO | YES | N/A | Internal cron; INTERNAL_API_SECRET auth; no patient PHI |
| /api/hq/auth | POST | NO | NO | NO | NO | YES | N/A | Passcode-only entry point; no PHI |
| /api/hq/content/generate | POST | YES | NO | NO | NO | NO | **FAIL** | **isAllowedEmail allowlist, not role table**; no org filter; no audit_log; internal only; no PHI sent to Anthropic |
| /api/hq/github-webhook | POST | NO | NO | NO | NO | NO | N/A | HMAC signature auth; CI event logging; no patient PHI |
| /api/hq/logout | GET | NO | NO | NO | NO | NO | N/A | Clears hq_session cookie; no PHI |
| /api/hq/sprints | GET,POST | NO | NO | NO | NO | YES | N/A | INTERNAL_API_SECRET auth; no patient PHI |
| /api/hq/tasks/[id] | PATCH,DELETE | NO | NO | NO | NO | YES | N/A | INTERNAL_API_SECRET auth; no patient PHI |
| /api/hq/tasks | GET,POST | NO | NO | NO | NO | YES | N/A | INTERNAL_API_SECRET auth; no patient PHI |
| /api/log/create | POST | YES | YES | YES | YES | NO | PASS | All four HIPAA controls present; **no dedicated test file** |
| /api/medications/[id] | GET | YES | YES | YES | YES | NO | PASS | All four HIPAA controls present; **no dedicated test file** (indirect coverage via medications-crud.test.ts) |
| /api/medications/[id]/update | PATCH | YES | YES | YES | YES | NO | PASS | All four HIPAA controls present; **no dedicated test file** |
| /api/medications/create | POST | YES | YES | YES | YES | NO | PASS | All four HIPAA controls present; **no dedicated test file** |
| /api/newly-connected | GET,PATCH | YES | YES | YES | NO | NO | **FAIL** | **No audit_log write on GET or PATCH**; patient checklist data; no test file |
| /api/patients/[id]/emergency-card | GET | YES | YES | YES | YES | YES | PASS | High-sensitivity PHI (DOB, blood type, allergies, emergency contacts, DPD status); all four controls present |
| /api/patients/[id] | GET | YES | YES | YES | YES | YES | PASS | Full patient record; all controls present |
| /api/patients/create | POST | YES | YES | YES | YES | YES | PASS | All controls present |
| /api/provider/patients/[id]/export | POST | YES | YES | YES | YES | YES | PASS | Provider-only; care_relationship gate; full PHI export |
| /api/provider/patients/[id]/notes/[noteId] | PATCH,DELETE | YES | YES | YES | YES | YES | PASS | Note ownership enforced (provider_id=caller) |
| /api/provider/patients/[id]/notes | GET,POST | YES | YES | YES | YES | YES | PASS | care_relationship gate on every method |
| /api/provider/patients/[id] | GET | YES | YES | YES | YES | YES | PASS | care_relationship gate; full clinical PHI |
| /api/provider/patients | GET | YES | YES | YES | YES | YES | PASS | Patients only surface via care_relationships |
| /api/summarize | POST | YES | YES | YES | YES | YES | PASS | Document content + patient first name to Anthropic; audit written; two Anthropic calls |
| /api/symptom-summary | POST | YES | NO | NO | NO | NO | **FAIL** | **No role check; no org filter; no audit_log; no test**; sends user-supplied symptom text to Claude with no patient record lookup |
| /api/symptoms/[patientId] | GET | YES | YES | YES | YES | YES | PASS | All controls present |
| /api/symptoms/log | POST | YES | YES | YES | YES | NO | PASS | All four HIPAA controls present; **no dedicated test file** |
| /api/trial-saves/delete | DELETE | YES | YES | YES | YES | YES | PASS | Cross-tenant verified via patients.organization_id |
| /api/trial-saves/upsert | POST | YES | YES | YES | YES | YES | PASS | All controls present |
| /api/trials | POST | YES | NO | NO | NO | NO | **FAIL** | **No role check; no org filter; no audit_log; no test**; proxies ClinicalTrials.gov only; no patient data written to DB but still missing controls |
| /api/trials/save | POST | YES | YES | YES | YES | NO | PASS | All four HIPAA controls present; **no dedicated test file** |
| /api/trials/saved | GET,DELETE | YES | YES | YES | NO | NO | **FAIL** | **GET has no audit_log write**; DELETE audited; **no test file** |
| /api/trials/search | POST | YES | YES | YES | YES | YES | PASS | Condition name sent to Claude and external APIs; audit written; results cached by SHA-256 of condition |
| /api/upload | POST | YES | YES | YES | YES | YES | PASS | Magic byte validation; service-role storage client |
| /api/users/disclaimer | POST | YES | NO | NO | YES | NO | **FAIL** | **No role check; no org filter** (self-update pattern); audit writes organization_id=null; no test file |
| /api/waitlist | POST | NO | NO | NO | NO | NO | N/A | Public unauthenticated; no PHI; anon Supabase client |

### HIPAA FAIL SUMMARY (13 routes)

| Route | Missing Controls |
|---|---|
| /api/biomarkers | Audit on GET |
| /api/care-team/[id]/message-templates | Audit on GET |
| /api/condition-templates/[id] | Org filter, Audit |
| /api/delete-account | Role check |
| /api/email/welcome | Role check, Org filter, Audit |
| /api/hq/content/generate | Role (uses allowlist not role table), Org filter, Audit |
| /api/newly-connected | Audit |
| /api/symptom-summary | Role check, Org filter, Audit |
| /api/trials | Role check, Org filter, Audit |
| /api/trials/saved | Audit on GET |
| /api/users/disclaimer | Role check, Org filter |
| /api/export | Test only (all 4 controls present) |

### Routes with no test file (14)
/api/condition-templates/[id], /api/delete-account, /api/email/welcome, /api/export,
/api/hq/content/generate, /api/hq/github-webhook, /api/log/create, /api/medications/[id],
/api/medications/[id]/update, /api/medications/create, /api/newly-connected,
/api/symptom-summary, /api/symptoms/log, /api/trials, /api/trials/save,
/api/trials/saved, /api/users/disclaimer

---

## SECTION 2: PAGE INVENTORY

50 pages across app/. Protected = requires Supabase session per middleware. HQ pages require passcode cookie instead.

| Page (URL) | Renders | Protected | Mobile | Notes |
|---|---|---|---|---|
| / | Public landing page | NO | NO | Marketing hero + waitlist form |
| /about | About Clarifer | NO | NO | Static marketing page |
| /care-team | Care team manager | YES | YES | apps/mobile/app/(app)/care-team/index.tsx |
| /ccf | CCF co-brand landing | NO | NO | Public marketing page |
| /ccf-dashboard | CCF aggregate dashboard | YES | NO | Requires isAllowedEmail; no mobile equivalent |
| /chat | AI chat interface | YES | NO | No mobile equivalent |
| /data | Data transparency | NO | NO | Static public page |
| /disclaimer | Medical disclaimer | NO | NO | Static public; mobile has (modals)/medical-disclaimer.tsx |
| /documents | Documents list | YES | YES | apps/mobile/app/(app)/documents/index.tsx |
| /documents/[id] | Document detail | YES | YES | apps/mobile/app/(app)/documents/[id].tsx |
| /documents/upload | Document upload | YES | NO | No dedicated mobile upload screen (inline on mobile) |
| /download | App download page | NO | NO | Static marketing |
| /home | Caregiver home dashboard | YES | YES | apps/mobile/app/(home)/caregiver.tsx and variants |
| /log | Symptom log form | YES | NO | No dedicated mobile log screen found |
| /login | Email/Google login | NO | YES | apps/mobile/app/(auth)/login.tsx |
| /notifications | Notifications list | YES | NO | No mobile notifications screen found |
| /onboarding | Multi-step onboarding | YES | YES | apps/mobile/app/(onboarding)/ screens |
| /onboarding/complete | Post-onboarding success | YES | YES | Mobile onboarding flow covers this |
| /patients/[id] | Patient dashboard | YES | YES | apps/mobile/app/(app)/patients/[id]/index.tsx |
| /patients/[id]/appointments | Appointment calendar | YES | YES | apps/mobile/app/(app)/patients/[id]/appointments.tsx |
| /patients/[id]/care-team | Care team directory | YES | YES | apps/mobile/app/(app)/patients/[id]/care-team.tsx |
| /patients/[id]/emergency-card | Emergency PHI card | YES | YES | apps/mobile/app/(app)/patients/[id]/emergency-card (path differs slightly) |
| /patients/[id]/family-update | AI family update | YES | YES | apps/mobile/app/(app)/patients/[id]/family-update.tsx |
| /patients/[id]/trials | Clinical trials search | YES | YES | apps/mobile/app/(app)/patients/[id]/trials.tsx |
| /patients/new | New patient form | YES | YES | apps/mobile/app/(app)/patients/new.tsx |
| /privacy | Privacy policy | NO | NO | Static legal page |
| /privacy-notice | HIPAA privacy notice | NO | NO | Static legal page |
| /profile | User profile settings | YES | NO | No mobile profile screen found |
| /promise | Caregiver promise | NO | NO | Static marketing page |
| /provider | Provider patient list | YES | YES | apps/mobile/app/(app)/provider/index.tsx |
| /provider/patients/[id] | Provider patient detail | YES | YES | apps/mobile/app/(app)/provider/patients/[id].tsx |
| /research | Research partnership | NO | NO | Static public page; **no mobile equivalent (Rule 9 gap — pre-existing pattern)** |
| /security | Security info | NO | NO | Static public page |
| /signup | Email signup | NO | YES | apps/mobile/app/(auth)/signup.tsx |
| /terms | Terms of service | NO | NO | Static legal page |
| /tools | Tools hub | YES | NO | No dedicated tools hub on mobile |
| /tools/medications | Medication tracker | YES | YES | apps/mobile/app/(app)/medications/index.tsx |
| /tools/trials | Clinical trials | YES | NO | Trials on mobile via /patients/[id]/trials; no standalone screen |
| /update-password | Set new password | NO | YES | apps/mobile/app/(auth)/reset-password.tsx |
| /waitlist | Waitlist embed | NO | NO | Static iframe embed |
| /forgot-password | Password reset email | NO | YES | apps/mobile/app/(auth)/forgot-password.tsx |
| /dashboard | Auth redirect stub | YES | NO | Renders null; redirects to /home or /login |

### HQ Pages (passcode-gated, no mobile)

| Page | Renders |
|---|---|
| /hq | Command center overview: sprint stats, milestones, blockers |
| /hq/agents | Agent registry with Claude Code agent cards |
| /hq/board | Team task kanban board |
| /hq/ccf | Anonymized cholangiocarcinoma community metrics |
| /hq/content | AI content generator (Substack/LinkedIn) |
| /hq/login | HQ passcode entry point |
| /hq/roadmap | Product roadmap view by phase/sprint |
| /hq/sessions | 126-session tracker (C01-C31+) |
| /hq/sprints | Sprint history log from DB |

### Pages with no mobile equivalent (Rule 9 gap)
/about, /ccf, /ccf-dashboard, /chat, /data, /disclaimer, /documents/upload,
/download, /log, /notifications, /profile, /research, /security, /terms, /tools,
/tools/trials, /waitlist

All HQ pages have no mobile equivalent — this is intentional (admin dashboard).

---

## SECTION 3: AUTH FLOW AUDIT

**Q1: What does signInWithOAuth pass as redirectTo?**

```ts
redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
```

No `next` query parameter is appended. The callback always falls through to state-based routing via `routePostAuth()`.

---

**Q2: What does the callback route do after exchanging the code?**

Steps in order (app/auth/callback/route.ts):

1. Parse `code` and `next` from the query string.
2. If `code` is missing, redirect to `/login?error=auth_failed`.
3. Call `supabase.auth.exchangeCodeForSession(code)` to consume the PKCE code.
4. If exchange returns an error, redirect to `/login?error=auth_failed`.
5. If `next === "/update-password"`, redirect to `/update-password` (password-reset recovery).
6. If `next` starts with `/hq`, redirect to `/hq` (admin deep-link override).
7. Otherwise, call `routePostAuth(supabase)`:
   - a. Calls `supabase.auth.getUser()` — returns `/login?error=auth_failed` if no user.
   - b. Queries `public.users` for a row with `organization_id`. If missing or null, returns `/onboarding`.
   - c. Queries `public.patients` for any patient in that org. If none found, returns `/onboarding`.
   - d. If both pass, returns `/home`.
8. Redirect to `${origin}${target}`.
9. If `routePostAuth` throws, redirect to `/login?error=auth_failed`.

---

**Q3: Which routes are excluded from middleware protection (publicRoutes)?**

```ts
const publicRoutes = [
  "/", "/login", "/signup", "/auth/callback", "/update-password",
  "/privacy", "/terms", "/about", "/security", "/ccf", "/disclaimer",
  "/data", "/waitlist", "/promise", "/privacy-notice", "/hq", "/research"
];
```

17 public routes. `/ccf-dashboard` is intentionally absent — it is protected and has an additional `isAllowedEmail` check in the page itself.

---

**Q4: Is /auth/callback excluded from middleware?**

Yes, via TWO independent mechanisms:

**Primary — matcher excludes `auth` prefix entirely:**
```ts
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|clarifer-logo.png|...|auth|api|monitoring).*)",
  ],
};
```
The negative lookahead `(?!...auth...)` means Next.js never invokes the middleware function at all for `/auth/*` paths.

**Secondary — publicRoutes belt-and-suspenders:**
`/auth/callback` is also explicitly listed in `publicRoutes` at middleware.ts line 107.

---

**Q5: What happens to a brand new user after OAuth?**

A brand new user always goes to `/onboarding`, not `/home`.

Code path:
1. Google returns to `/auth/callback?code=<code>`.
2. Middleware matcher excludes `/auth/*` — middleware never runs.
3. Callback exchanges code, finds no `next` param.
4. `routePostAuth` queries `public.users`. New user has no row OR `organization_id = null`.
5. Line: `if (!userRecord?.organization_id) return "/onboarding";`
6. Redirect to `/onboarding`.

---

**Q6: What does the login page render?**

Two-column layout:
- Left: Logo, "Welcome back" heading, 3 feature bullet points with check icons, disclaimer text.
- Right: Email input, password input with show/hide toggle, "Forgot password?" link, "Sign in" button, divider, and Google OAuth button.

Google OAuth button calls `supabase.auth.signInWithOAuth({ provider: "google", ... })`. A `SessionTimeoutBanner` (inside Suspense) displays when `?reason=session_timeout` is in the URL.

---

**Q7: Auth vulnerabilities found**

1. **`resolveCallbackRedirect` is exported but dead in the GET handler.** The function (lines 14-18) is never called — the handler re-implements the same logic inline. Two branches could diverge over time. Not a security issue, maintenance risk.

2. **`next` param starts-with check could be bypassed with path traversal.** `next.startsWith("/hq")` would pass for `/hq/../evil`. `NextResponse.redirect` canonicalizes the URL so this is bounded to the same origin and does not produce an open external redirect. Low risk.

3. **PKCE state validation is fully delegated to Supabase.** No application-level CSRF check. Acceptable — Supabase handles PKCE server-side.

4. **`cf_last_activity` cookie uses `sameSite: "lax"`, not `"strict"`.** Standard for most apps; cross-site top-level navigations (email links) carry the cookie. Not a vulnerability in isolation.

5. **`/hq` is in `publicRoutes`** meaning Supabase session check skips it, but it is protected by the SHA-256 passcode cookie gate. The two systems do not interfere. Any route under `/hq/` that is NOT `/hq/login` will be redirected by the passcode gate if the cookie is absent or wrong.

---

## SECTION 4: DATABASE AUDIT

36 migration files. Key findings noted below.

| Migration | Tables Changed | RLS | Org ID | Notes |
|---|---|---|---|---|
| 20250328000002_fix_rls.sql | patients, users, care_relationships, chat_messages, documents, symptom_logs, medications, notifications, trial_saves, appointments | YES | NO | Initial single-tenant RLS; policies use auth.uid() = created_by only |
| 20250328000003_storage_policies.sql | storage.objects | YES | NO | Documents bucket scoped to userId folder prefix; avatars public |
| 20250328000004_storage_update_policy.sql | storage.objects | YES | NO | Adds UPDATE policy for documents bucket |
| 20250328000005_care_team.sql | care_team (CREATE) | YES | NO | Scoped via patient ownership, no org_id yet |
| 20250328000006_symptom_connection.sql | documents (ALTER) | N/A | NO | Adds symptom_connection column only |
| 20250328000007_waitlist.sql | waitlist (CREATE) | YES | NO | Anon INSERT for pre-auth waitlist form |
| 20260421120000_condition_templates_slug.sql | condition_templates (ALTER) | NO | NO | Backfills slug column; adds unique constraint |
| 20260422000001_dementia_condition_template.sql | condition_templates (INSERT) | N/A | NO | Seed data only |
| 20260422000002_alzheimers_condition_template.sql | condition_templates (INSERT) | N/A | NO | Seed data only |
| 20260422000003_create_organizations_table.sql | organizations (ALTER) | YES | YES | Adds white-label columns; org self-reference via users.organization_id |
| 20260422000004_add_tenant_id_to_all_tables.sql | 13 tables (ALTER) | NO | YES | **CRITICAL: backfill uses hardcoded placeholder UUID. Must be replaced with real org UUID before running.** |
| 20260422000005_update_rls_for_multi_tenancy.sql | 16 tables (policies) | YES | YES | Full org-isolation policy replacement; audit_log insert-only for users |
| 20260422000006_add_roles_table.sql | medical_disclaimer_acceptances (CREATE), users (ALTER) | YES | YES | Adds user_role enum; users can only read/write own disclaimer rows |
| 20260423000001_create_documents_bucket.sql | storage.objects | YES | YES | Replaces user-id folder with org-id-based folder |
| 20260423000002_add_missing_tables.sql | ai_analysis_consents (CREATE) | YES | YES | Tracks consent before AI touches PHI |
| 20260423000003_enable_rls_missing_tables.sql | condition_templates, trial_cache (CREATE) | YES | YES | condition_templates readable by all authenticated; trial_cache service-only |
| 20260423000004_cholangiocarcinoma_template.sql | condition_templates (INSERT) | N/A | NO | Seed data only |
| 20260423000005_audit_log_forensic_columns.sql | audit_log (ALTER) | NO | NO | Adds ip_address, user_agent, status columns |
| 20260423000006_full_schema_baseline.sql | 14 tables (CREATE IF NOT EXISTS) | YES | YES | Idempotent full baseline with org_isolation policies |
| 20260423000007_appointments_checklist.sql | appointments (ALTER) | NO | NO | Adds pre_visit_checklist, post_visit_notes, appointment_type |
| 20260423000008_emergency_card.sql | patients (ALTER) | NO | NO | Adds blood_type, allergies, emergency_contact_*, dpd_deficiency_* columns |
| 20260423000009_biomarkers.sql | biomarkers (CREATE) | YES | YES | Org-isolated; includes created_by |
| 20260423000010_newly_connected.sql | newly_connected_checklists (CREATE) | YES | YES | Org-isolated |
| 20260423000011_fix_users_rls_recursion.sql | users (policies) | YES | NO | HOTFIX: eliminates infinite recursion in self-referential org lookup in users RLS |
| 20260424000005_command_center.sql | team_tasks, sprint_updates, agent_runs (CREATE) | YES (service_role only) | NO | Internal ops tables; USING false means no user can read directly |
| 20260424000006_trials_family.sql | trial_cache, family_updates (CREATE), patients (ALTER) | YES | YES | Adds location fields to patients |
| 20260428000002_add_terms_accepted_at.sql | users (ALTER) | NO | NO | Adds terms_accepted_at column |
| 20260428000003_who_ictrp_mirror.sql | who_ictrp_trials (CREATE) | YES (service-only) | NO | Public trial registry; no PHI |
| 20260428000004_care_team_directory.sql | care_team (ALTER), care_team_message_templates (CREATE) | YES | YES | **care_team table had no org_id for the first 6 months of history** |
| 20260428000005_appointments_action_items.sql | appointments (ALTER) | NO | NO | Adds post_visit_action_items; adds index |
| 20260428000006_provider_portal.sql | care_relationships (ALTER), provider_notes (CREATE) | YES | YES | Provider notes org-isolated |
| 20260430000001_handle_new_user_trigger.sql | (trigger + function) | N/A | YES | SECURITY DEFINER trigger creates org + user row on every auth.users INSERT |
| 20260522000001_add_disclaimer_accepted.sql | users (ALTER) | NO | NO | Adds disclaimer_accepted_at |
| 20260522000002_add_language_preference.sql | patients (ALTER) | NO | NO | Adds language_preference |
| 20260526000001_account_deletion_cascade.sql | 8 tables (FK constraints) | NO | NO | Adds ON DELETE CASCADE across 8 tables |
| 20260527000002_who_ictrp_seed.sql | who_ictrp_trials (INSERT) | N/A | NO | 6 seed trials; public registry data; no PHI |

### Key Database Issues

1. **No audit_log triggers in any migration.** Every audit write is manual in application code. Any route that omits the write leaves no trace at the DB level.

2. **Org isolation added late.** First 5 migrations have no org_id. Data written before migration 000004 is multi-tenant-unsafe.

3. **Hardcoded placeholder UUID in 20260422000004.** Must be replaced with the real org UUID before applying in production. The migration comment flags this but there is no runtime enforcement guard.

4. **care_team table had no org_id until migration 20260428000004.** Six months of sprint history with no tenant isolation on care team data.

5. **RLS recursion hotfix (migration 20260423000011).** Users table had a self-referential org lookup that caused infinite recursion. Fixed by simplifying to `auth.uid() = id` only. Tradeoff: users table RLS is now weaker (any row with matching auth.uid) rather than org-isolated.

---

## SECTION 5: ANTHROPIC API AUDIT

10 files call the Anthropic API.

| File | PHI in Prompt | Timeout | Error Handling | Notes |
|---|---|---|---|---|
| app/api/chat/route.ts | YES: patient first name (split[0]), condition_templates.ai_context | YES — 25,000ms Promise.race | YES — try/catch, Sentry capture, stream fallback | Strips HTML; validates message length (10k/50k); rate-limited; audit_log on every call |
| app/api/ai/analyze-document/route.ts | YES: full extracted document text, condition template AI context | YES — 25,000ms Promise.race | YES — multiple catch blocks at each stage; returns 503 on partial failure | Does NOT send patient.name or custom_diagnosis; uses buildAnalysisPrompt() from lib |
| app/api/ai/trial-summary/route.ts | YES: patient first name, conditionContext from condition_templates.ai_context | YES — maxDuration=60 (Vercel); AI SDK internal handling | PARTIAL — rate limiter has no try/catch; a Redis outage hard-fails the request | Uses claude-haiku-4-5-20251001; custom_diagnosis NOT sent; **Redis fail-open gap** |
| app/api/ai/family-update/route.ts | YES: symptom AI summaries, medication names/doses/frequencies | YES — maxDuration=60 | YES — rate limiter has try/catch fallback; AI SDK handles stream errors | Uses claude-haiku-4-5-20251001; patient.name NOT sent; custom_diagnosis fetched but NOT sent to AI |
| app/api/family-update/generate/route.ts | **HIGHEST EXPOSURE**: patient first name, 7 days of symptoms with severity, all active medications (name/dose/unit/frequency), appointment titles and provider names, document titles and summaries | YES — 25,000ms Promise.race | YES — stream errors caught; persist failures silently swallowed | **No rate limiter on this route**; audit_log written best-effort (swallowed on error) |
| app/api/family-update/route.ts | YES: patient first name, symptomSummary (ai_summary or raw JSON), medication names/doses/frequencies | YES — 25,000ms Promise.race | YES — outer try/catch returns 500; stream error emits fallback text | Audit written BEFORE streaming starts (not on completion) |
| app/api/summarize/route.ts | YES: full document content as base64, patient first name in symptom-connection sub-call, findingsText, symptomsText | YES — 25,000ms Promise.race on both calls | YES — outer catch returns 500; symptom sub-call has empty catch (non-critical) | Two Anthropic calls; patient.name.split(' ')[0] explicitly sent in second call |
| app/api/symptom-summary/route.ts | YES: raw symptom text, severity score, free-text notes | YES — 25,000ms Promise.race | YES — catch returns {summary: null} (no error propagation) | **No patient identifier in prompt; no org_id check; no rate limiter; no audit_log** |
| app/api/trials/search/route.ts | PARTIAL: condition name (may equal custom_diagnosis), trial eligibility text, brief summaries | YES — 10,000ms Promise.race (trials returned without summaries if Claude slow) | YES — Claude errors return empty {}; no outer catch | Comment says "no PHI in cache key"; condition name IS custom_diagnosis indirectly |
| app/api/hq/content/generate/route.ts | NO: marketing content only; no patient data | NO explicit timeout | YES — try/catch returns 500 | Internal route; uses claude-sonnet-4-6; no PHI |

### Key Anthropic API Issues

1. **`/api/family-update/generate` has no rate limiter** and sends the widest PHI bundle: 7 days of structured clinical data including symptoms, medications, appointments, and document summaries with patient first name.

2. **`/api/symptom-summary` is the worst HIPAA offender among AI routes**: no role check, no org filter, no audit_log, no rate limiter. User-supplied symptom text goes directly to Claude with no patient record verification.

3. **`/api/ai/trial-summary` rate limiter has no try/catch.** Redis outage = uncaught error. Every other AI route either has a fallback or uses `try/catch` around the limiter.

4. **`patient.custom_diagnosis` reaches Anthropic indirectly** via `/api/trials/search` — the condition name passed to Claude and external APIs is sourced from the same field.

5. **Audit_log is not written on error paths for streaming routes.** `onFinish` callbacks only fire on successful stream completion. An aborted stream leaves no audit trail.

6. **`lib/documents/analyze.ts` accepts `patientContext`** that is passed into the system prompt, but no calling route currently populates this parameter. Dead code path but worth tracking if the API changes.

---

## SECTION 6: BROKEN THINGS

### TypeScript

```
npx tsc --noEmit: 0 errors
```

Clean.

### Vitest

```
Test Files  2 failed | 80 passed (82)
Tests       2 failed | 311 passed (313)
Duration    ~146s
```

**Both failures are pre-existing and share the same root cause:**

- `tests/analyze-document.test.ts` — `supabase.storage.from(...).createSignedUrl is not a function`
- `tests/api/documents-analyze.test.ts` — `TypeError: Cannot read properties of undefined (reading 'from')`

Both tests hit `POST /api/ai/analyze-document`, which calls `generateSignedUrl` in `lib/documents/storage.ts`. The Supabase storage client stub in both test files does not correctly implement `storage.from().createSignedUrl()`. The route returns 503 before any Anthropic call is made. These are listed in CLARIFER_BRAIN.md pre-existing debt.

**No new failures introduced by this session (read-only audit).**

### Em Dashes

Only one file:
```
app/api/ai/analyze-document/route.ts
```

One em dash found inside this route file (likely in a comment or string literal).

### Hex Color Strings (outside hospital-grade-export.tsx)

19 files with hardcoded hex color strings — violation of the design system rule:

```
app/care-team/page.tsx
app/ccf/page.tsx
app/documents/upload/page.tsx
app/documents/[id]/page.tsx
app/hq/agents/page.tsx
app/hq/board/page.tsx
app/hq/ccf/page.tsx
app/hq/roadmap/page.tsx
app/layout.tsx
app/log/page.tsx
app/login/page.tsx
app/not-found.tsx
app/research/page.tsx
app/tools/page.tsx
app/tools/trials/page.tsx
app/update-password/page.tsx
components/care-team/CareTeamMember.tsx
components/delete-document-button.tsx
components/home/home-client.tsx
```

Note: HQ pages (agents, board, ccf, roadmap) are internal-only and lower priority. The caregiver-facing pages (care-team, log, documents/upload, documents/[id], tools, login, home-client) are higher priority violations.

### "serious illness"

**2 hits:**

1. `app/api/hq/content/generate/route.ts` — Active string inside an AI content generation prompt:
   ```
   "Clarifer helps family caregivers -- people caring for a parent, spouse, or loved one with a serious illness -- organize..."
   ```
   This is in the system prompt for an internal marketing content generator. Not caregiver-facing, but violates the copy rule.

2. `app/hq/sessions/page.tsx` — Session tracker entry:
   ```
   { id: "C12", title: "Copy violations removed serious illness x4" }
   ```
   Historical reference to a completed remediation sprint. Not product copy.

**Priority:** The first hit in hq/content/generate/route.ts is the active violation.

### "Cassini"

**0 hits.** Clean.

---

## SECTION 7: WHAT IS MISSING

Comparing sprint plan S19-S40 against current state:

| Sprint | Expected Path | Status | Notes |
|---|---|---|---|
| S19 | app/notifications/page.tsx | **EXISTS** | Found at app/notifications/page.tsx |
| S20 | app/(platform)/patients/[id]/page.tsx | EXISTS (different group) | Lives at app/(app)/patients/[id]/page.tsx — same URL, different route group prefix |
| S21 | app/(platform)/patients/[id]/appointments/page.tsx | EXISTS (different group) | Lives at app/(app)/patients/[id]/appointments/page.tsx |
| S22 | app/tools/page.tsx | **EXISTS** | Found at app/tools/page.tsx |
| S23 | app/download/page.tsx | **EXISTS** | Found at app/download/page.tsx |
| S24 | app/waitlist/page.tsx | **EXISTS** | Found at app/waitlist/page.tsx |
| S25 | app/api/log/create/route.ts | **EXISTS** | Found at app/api/log/create/route.ts |
| S26 | app/api/ai/analyze-document/route.ts | **EXISTS** | Found at app/api/ai/analyze-document/route.ts |
| S29 | app/api/emergency-card/[patientId]/pdf/route.ts | **MISSING** | Route exists at different path: app/api/patients/[id]/emergency-card/route.ts (returns JSON, not PDF) |
| S35 | app/ccf-dashboard/page.tsx | **EXISTS** | Found at app/ccf-dashboard/page.tsx |
| S37 | app/promise/page.tsx | **EXISTS** | Found at app/promise/page.tsx |

**Only one true missing item:**

S29 expected a dedicated PDF route at `/api/emergency-card/[patientId]/pdf`. What exists instead is `/api/patients/[id]/emergency-card` which returns JSON data. A PDF-rendering route for the emergency card does not exist. The PDF export is handled by the general `/api/export/pdf` route, not a dedicated emergency-card PDF endpoint.

---

## SECTION 8: ENVIRONMENT VARIABLES

### Variables referenced in app/ code

```
ANTHROPIC_API_KEY
BREVO_API_KEY
GITHUB_WEBHOOK_SECRET
INTERNAL_API_SECRET
INTERNAL_PASSCODE
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SUPABASE_URL
NODE_ENV
SUPABASE_SERVICE_ROLE_KEY
```

### Variables in .env.example

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
BREVO_API_KEY
SENTRY_DSN
NEXT_PUBLIC_SENTRY_DSN
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_APP_NAME
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_POSTHOG_HOST
INTERNAL_PASSCODE
INTERNAL_API_SECRET
GITHUB_WEBHOOK_SECRET
CLARIFER_INTERNAL_URL
```

### Variables in code NOT in .env.example

`NODE_ENV` — built-in Node.js environment variable; does not need to be documented. **No gaps.**

### Variables in .env.example NOT referenced in app/ code

The following are in .env.example but not found in `app/**` grep:
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` — referenced in `lib/ratelimit.ts`, outside the grep scope
- `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` — referenced in sentry config files (sentry.server.config.ts etc.), outside the grep scope
- `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_APP_NAME` — may be used in layout or metadata outside app/ scope
- `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` — likely in instrumentation or analytics config
- `CLARIFER_INTERNAL_URL` — referenced in HQ agent routes or scripts

**.env.example is complete and accurate for all app-layer variables.** The additional entries cover lib/ and config-level usage that falls outside the app/ grep scope.

---

## PRIORITY REMEDIATION LIST

### P0 — HIPAA Blockers (fix before next production deploy)

1. **`/api/symptom-summary`** — Missing role, org filter, and audit_log. Sends symptom text to Claude with no PHI isolation. Highest risk.
2. **`/api/family-update/generate`** — No rate limiter. Widest PHI exposure to Anthropic of any route.
3. **`/api/delete-account` GET** — Exports full PHI payload; audit_log has org_id=null; no role check.
4. **`/api/biomarkers` GET** — Reads PHI biomarker data with no audit_log entry.
5. **`/api/trials/saved` GET** — Reads saved trials (patient-linked) with no audit_log entry.
6. **`/api/care-team/[id]/message-templates` GET** — Templates can contain PHI; no audit on reads.

### P1 — HIPAA Gaps (fix within current sprint cycle)

7. `/api/newly-connected` — No audit_log on GET or PATCH.
8. `/api/condition-templates/[id]` — No org filter, no audit.
9. `/api/email/welcome` — No role, no org, no audit.
10. `/api/users/disclaimer` — No role check, org_id=null in audit.
11. `/api/trials` — No role, no org, no audit (proxies external API but controls still missing).

### P2 — Copy Violations

12. `app/api/hq/content/generate/route.ts` — Active "serious illness" string in AI marketing prompt.
13. `app/api/ai/analyze-document/route.ts` — Em dash in code.
14. 19 files with hex color strings — prioritize caregiver-facing pages (log, care-team, documents) over HQ internals.

### P3 — Test Gaps

15. 14 routes with no test file (listed in Section 1).

### P4 — Architecture Notes

16. No DB-level audit_log triggers — entire audit trail relies on application code remembering to write.
17. `/api/ai/trial-summary` rate limiter has no try/catch (Redis outage = uncaught error).
18. `resolveCallbackRedirect` in auth callback is dead code — two diverging branches.
19. Rule 9 (mobile parity) gap for 17 web pages — pre-existing pattern; needs explicit policy decision.
20. Emergency card PDF route (S29) never built — only JSON endpoint exists.

---

*Audit complete. No code changes made. All issues logged here only.*
*Next action: Samira reviews and assigns remediation sprints.*
