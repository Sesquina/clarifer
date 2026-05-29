# CLARIFER — LEVEL SET AUDIT
## May 28, 2026 — End of Day Snapshot

**Branch audited:** main  
**Audited by:** Claude Code (autonomous session)  
**Timestamp:** 2026-05-28  

---

## STEP 1 — GIT STATE

### Last 10 commits on main
```
e80ad31 feat: mobile symptom log list and add screens, wire home tile
4107c1c feat: wire mobile patient hub, family update, care team, appointments
22ddf84 feat: wire mobile documents and medications to real Supabase data
04754bd feat: CCF dashboard audit and hardening for June 3 demo (S35)
c5cf43a fix: first name only in nav, AI disclaimer above chat input (D3+D5)
a60c2ea fix: remove PHI from Anthropic prompts (S-INFRA-5)
ab09649 fix: remove PHI from Anthropic prompts (S-INFRA-5)
91de0a5 fix: add redirectTo in signInWithOAuth so Google OAuth lands on /home
957a570 feat: CCF research partnership page at /research
1fbda77 fix: Google OAuth callback redirect to /home
```

### Uncommitted changes
No staged or unstaged changes to tracked files.  
Untracked files present (not committed):
- `playwright/` — auth state directory from smoke test session (gitignored)
- `tests/api/appointments-create-org.test.ts` — orphaned test file
- `h origin main` — stray artifact from a failed git command

**Assessment:** Clean working tree on main. The orphaned test file and stray artifact should be cleaned up.

---

## STEP 2 — TYPESCRIPT

**Error count: 0**  
`npx tsc --noEmit` passes cleanly on main with zero TypeScript errors.

**Note:** The mobile workspace (`apps/mobile`) has 23 pre-existing TS errors related to Expo Router typed routes. These are in the mobile tsconfig scope, not the web tsconfig. They are tracked as pre-existing and do not block deployment.

---

## STEP 3 — TEST SUITE

**Result:** 2 failed | 311 passed (313 total)

**Failing tests (pre-existing, not caused by recent sprints):**
- `tests/analyze-document.test.ts` — `POST /api/ai/analyze-document > returns streaming response for authenticated caregiver (Sprint 5 contract)` → 200 expected, 503 received (Anthropic API key absent in test env)
- `tests/api/documents-analyze.test.ts` — `streams text, writes chat_message and updates analysis_status on success` → same cause

**Assessment:** Both failures are pre-existing, documented in CLARIFER_BRAIN.md, and caused by the Anthropic API key not being available in the test environment. No new test regressions introduced in recent sessions.

---

## STEP 4 — WEB PAGES

Full list of `app/**/page.tsx` files:

```
app/(app)/patients/[id]/appointments/page.tsx
app/(app)/patients/[id]/care-team/page.tsx
app/(app)/patients/[id]/emergency-card/page.tsx
app/(app)/patients/[id]/family-update/page.tsx
app/(app)/patients/[id]/page.tsx
app/(app)/patients/[id]/trials/page.tsx
app/(app)/patients/new/page.tsx
app/(app)/provider/page.tsx
app/(app)/provider/patients/[id]/page.tsx
app/(auth)/forgot-password/page.tsx
app/(platform)/dashboard/page.tsx
app/about/page.tsx
app/care-team/page.tsx
app/ccf-dashboard/page.tsx
app/ccf/page.tsx
app/chat/page.tsx
app/data/page.tsx
app/disclaimer/page.tsx
app/documents/[id]/page.tsx
app/documents/page.tsx
app/documents/upload/page.tsx
app/download/page.tsx
app/home/page.tsx
app/hq/* (7 internal dashboard pages)
app/log/page.tsx
app/login/page.tsx
app/notifications/page.tsx
app/onboarding/complete/page.tsx
app/onboarding/page.tsx
app/page.tsx  (landing)
app/privacy-notice/page.tsx
app/privacy/page.tsx
app/profile/page.tsx
app/promise/page.tsx
app/research/page.tsx
app/security/page.tsx
app/signup/page.tsx
app/terms/page.tsx
app/tools/medications/page.tsx
app/tools/page.tsx
app/tools/trials/page.tsx
app/update-password/page.tsx
app/waitlist/page.tsx
```

### Tracked pages — status

| Page | Status |
|---|---|
| app/home/page.tsx | EXISTS |
| app/onboarding/page.tsx | EXISTS |
| app/login/page.tsx | EXISTS |
| app/log/page.tsx | EXISTS |
| app/documents/page.tsx | EXISTS |
| app/chat/page.tsx | EXISTS |
| app/tools/page.tsx | EXISTS |
| app/tools/medications/page.tsx | EXISTS |
| app/tools/trials/page.tsx | EXISTS |
| app/(app)/patients/[id]/page.tsx | EXISTS |
| app/(app)/patients/[id]/family-update/page.tsx | EXISTS |
| app/(app)/patients/[id]/emergency-card/page.tsx | EXISTS |
| app/(app)/patients/[id]/care-team/page.tsx | EXISTS |
| app/(app)/patients/[id]/appointments/page.tsx | EXISTS |
| app/ccf-dashboard/page.tsx | EXISTS |
| app/research/page.tsx | EXISTS |
| app/about/page.tsx | EXISTS |
| app/promise/page.tsx | EXISTS |
| app/waitlist/page.tsx | EXISTS |

**All 19 tracked pages exist.** Additionally there are 30+ other pages (HQ, provider portal, legal, auth flows, etc.).

---

## STEP 5 — MOBILE SCREENS

Full mobile screen inventory (`apps/mobile/app/**/*.tsx`):

```
apps/mobile/app/_layout.tsx
apps/mobile/app/index.tsx
apps/mobile/app/auth/callback.tsx
apps/mobile/app/(app)/_layout.tsx
apps/mobile/app/(app)/care-team/index.tsx
apps/mobile/app/(app)/care-team/new.tsx
apps/mobile/app/(app)/chat/index.tsx
apps/mobile/app/(app)/documents/[id].tsx
apps/mobile/app/(app)/documents/index.tsx
apps/mobile/app/(app)/log/add.tsx
apps/mobile/app/(app)/log/index.tsx
apps/mobile/app/(app)/medications/index.tsx
apps/mobile/app/(app)/medications/new.tsx
apps/mobile/app/(app)/patients/[id]/appointments.tsx
apps/mobile/app/(app)/patients/[id]/care-team.tsx
apps/mobile/app/(app)/patients/[id]/family-update.tsx
apps/mobile/app/(app)/patients/[id]/index.tsx
apps/mobile/app/(app)/patients/[id]/trials.tsx
apps/mobile/app/(app)/patients/emergency-card.tsx
apps/mobile/app/(app)/patients/new.tsx
apps/mobile/app/(app)/provider/index.tsx
apps/mobile/app/(app)/provider/patients/[id].tsx
apps/mobile/app/(auth)/forgot-password.tsx
apps/mobile/app/(auth)/login.tsx
apps/mobile/app/(auth)/phone-login.tsx
apps/mobile/app/(auth)/reset-password.tsx
apps/mobile/app/(auth)/role-select.tsx
apps/mobile/app/(auth)/signup.tsx
apps/mobile/app/(auth)/verify-email.tsx
apps/mobile/app/(auth)/verify-otp.tsx
apps/mobile/app/(home)/admin.tsx
apps/mobile/app/(home)/caregiver.tsx
apps/mobile/app/(home)/patient.tsx
apps/mobile/app/(home)/provider.tsx
apps/mobile/app/(modals)/medical-disclaimer.tsx
apps/mobile/app/(onboarding)/care-team-setup.tsx
apps/mobile/app/(onboarding)/condition-select.tsx
```

### Tracked screens — status and wiring

"Wired" = file contains at least one of: `supabase`, `fetch`, `useEffect` (i.e., makes real API calls).

| Screen | Status | Wired |
|---|---|---|
| (auth)/login.tsx | EXISTS | NO — auth is handled by AuthProvider/context, not inline |
| (auth)/signup.tsx | EXISTS | NO — same pattern |
| (home)/caregiver.tsx | EXISTS | NO — reads from context, no direct data fetching |
| (app)/log/index.tsx | EXISTS | YES |
| (app)/log/add.tsx | EXISTS | YES |
| (app)/chat/index.tsx | EXISTS | YES |
| (app)/documents/index.tsx | EXISTS | YES |
| (app)/documents/[id].tsx | EXISTS | YES |
| (app)/medications/index.tsx | EXISTS | YES |
| (app)/medications/new.tsx | EXISTS | YES |
| (app)/patients/[id]/index.tsx | EXISTS | YES |
| (app)/patients/[id]/family-update.tsx | EXISTS | YES |
| (app)/patients/[id]/care-team.tsx | EXISTS | YES |
| (app)/patients/[id]/appointments.tsx | EXISTS | YES |
| (app)/patients/[id]/trials.tsx | EXISTS | YES |
| (app)/patients/emergency-card.tsx | EXISTS | YES |

**Notes:**
- login, signup, caregiver show wired=NO but this is expected: these screens use `useAuth()` context which wraps Supabase. The actual Supabase calls are in `lib/auth-context.tsx`. The screens themselves are thin UI wrappers — not shells.
- All 16 tracked screens exist. The entire (app)/* screen layer is wired to real Supabase data as of today.
- Additional wired screens beyond the tracked list: care-team/, patients/new, provider/, onboarding/

---

## STEP 6 — HIPAA AUDIT_LOG SPOT CHECK

Checked 5 routes for presence of `audit_log` write:

| Route | Has audit_log |
|---|---|
| app/api/chat/route.ts | YES |
| app/api/symptoms/log/route.ts | YES |
| app/api/documents/upload/route.ts | YES |
| app/api/family-update/generate/route.ts | YES |
| app/api/patients/create/route.ts | YES |

**All 5 routes pass.** All five write to `audit_log` as required by RULE 6.

Additional context: Earlier in this session, 6 more routes were hardened (symptom-summary, biomarkers GET, trials/saved GET, care-team/message-templates GET, delete-account GET) with audit_log writes — those are in the `fix/hipaa-route-hardening` branch, not yet merged to main.

---

## STEP 7 — COPY COMPLIANCE

### "serious illness"
Two occurrences found:

1. `app/api/hq/content/generate/route.ts` — in an AI prompt string used by the internal HQ content generator. This is an internal admin route (`/api/hq/*`), not caregiver-facing product copy.
2. `app/hq/sessions/page.tsx` — in a session title string: `"Copy violations removed serious illness x4"`. This is an internal HQ dashboard tracking session log — not visible to caregivers.

**Assessment:** No "serious illness" in caregiver-facing product pages. Both occurrences are internal admin surfaces.

### Em dash ( — )
One occurrence found:

- `app/api/ai/analyze-document/route.ts` — in a `console.log` string: `"[analyze-document] file fetch failed — status:"`. This is a server-side log line, never shown to users.

**Assessment:** No em dashes in user-facing UI copy.

### "Cassini"
No occurrences found. Clean.

**Overall copy compliance: PASS** — no violations in caregiver-facing surfaces.

---

## STEP 8 — ENVIRONMENT VARIABLES

All env vars documented in `.env.example`:

| Variable | Purpose |
|---|---|
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anon key (client-safe) |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service role (server-only, never in client) |
| ANTHROPIC_API_KEY | Claude API key (server-only) |
| UPSTASH_REDIS_REST_URL | Rate limiting via Upstash |
| UPSTASH_REDIS_REST_TOKEN | Rate limiting via Upstash |
| BREVO_API_KEY | Transactional email |
| SENTRY_DSN | Error monitoring (server) |
| NEXT_PUBLIC_SENTRY_DSN | Error monitoring (client) |
| NEXT_PUBLIC_APP_URL | Local dev base URL |
| NEXT_PUBLIC_APP_NAME | App name constant |
| NEXT_PUBLIC_SITE_URL | Production URL — used as OAuth redirectTo base |
| NEXT_PUBLIC_POSTHOG_KEY | Analytics key |
| NEXT_PUBLIC_POSTHOG_HOST | Analytics endpoint |
| INTERNAL_PASSCODE | /hq dashboard passcode |
| INTERNAL_API_SECRET | Cron agent API secret |
| GITHUB_WEBHOOK_SECRET | GitHub webhook HMAC secret |
| CLARIFER_INTERNAL_URL | Base URL for internal agent callbacks |

**Total: 18 env vars documented.** All have comments. `.env.example` is complete.

**Note:** Sentry DSN is also hardcoded in `sentry.server.config.ts`, `sentry.edge.config.ts`, and `instrumentation-client.ts` — logged as known pre-existing debt in SPRINT_LOG.md (S16), scheduled for Sprint 18.

---

## STEP 9 — PRODUCTION SMOKE TESTS

The `--project=smoke` configuration (10-test suite) exists on branch `feat/real-test-suite` but has **not been merged to main**. The `playwright.config.ts` on main only has `Desktop Chrome` and `Mobile Chrome` projects.

The smoke test files in `tests/e2e/smoke/` that DO exist on main are the CCF dashboard tests (`ccf-dashboard-final.spec.ts`).

**Results against clarifer.com:**
```
16 passed (24.1s)
0 failed
```

All 16 CCF dashboard smoke tests pass against production:
- Page loads and shows CCF Community Overview header
- No individual patient names visible
- Aggregate hero metric is visible and non-empty
- Community metrics cards are all visible
- "Don't know where to start?" guide card present
- "Send to your community" section present
- Mobile viewport (375px) renders correctly
- Unauthenticated access redirects to /login
(All tests run on Desktop Chrome + Mobile Chrome = 8 tests × 2 projects = 16)

**Note:** The broader 10-test smoke suite (01-auth through 10-new-user-signup) that tests /home, /log, /documents, /chat, /ccf-dashboard, /research, public pages, PHI guardrails, and signup is available on `feat/real-test-suite` branch. It needs to be merged and integrated into `playwright.config.ts` on main to be part of the standard CI gate.

---

## SUMMARY

| Area | Status | Notes |
|---|---|---|
| Git state | CLEAN | No uncommitted changes. 3 untracked files to tidy. |
| TypeScript (web) | PASS | 0 errors on main |
| TypeScript (mobile) | 23 pre-existing errors | Expo Router typed routes issue. Not blocking. |
| Test suite | 311/313 passing | 2 pre-existing failures in analyze-document (API key in test env) |
| Web pages | ALL 19 EXIST | Full page coverage |
| Mobile screens | ALL 16 EXIST | All (app)/* screens wired to real data |
| HIPAA — 5 spot check routes | ALL PASS | audit_log present in all 5 |
| HIPAA — 6 additional routes | PENDING MERGE | fix/hipaa-route-hardening branch not yet on main |
| Copy: serious illness | PASS | 2 occurrences, both internal admin only |
| Copy: em dash | PASS | 1 occurrence in console.log, not user-facing |
| Copy: Cassini | PASS | Zero occurrences |
| Env vars | 18 documented | .env.example complete |
| Smoke tests (CCF) | 16/16 PASS | Production clarifer.com |
| Smoke tests (full suite) | NOT ON MAIN | Exists on feat/real-test-suite, needs merge |

### Open items to address

1. **Merge `fix/hipaa-route-hardening`** — adds audit_log to 6 more routes (biomarkers GET, trials/saved GET, care-team/message-templates GET, symptom-summary, delete-account GET, family-update rate limit).
2. **Merge `feat/real-test-suite`** — adds 10 real E2E smoke tests to playwright.config.ts on main.
3. **Clean untracked files** — `h origin main` artifact, `playwright/` dir (already gitignored), `tests/api/appointments-create-org.test.ts` (orphaned, needs review).
4. **Sentry DSN hardcoding** — flagged S16, scheduled Sprint 18.
5. **Mobile TypeScript** — 23 Expo Router typed-route errors. Not blocking but should be resolved in a dedicated sprint.
6. **Analyze-document test failures** — `ANTHROPIC_API_KEY` needs to be mocked in test environment so these 2 tests can pass in CI.
7. **Google OAuth Supabase allowlist** — `https://clarifer.com/auth/callback` must be added in Supabase dashboard (Authentication > URL Configuration > Redirect URLs). See MANUAL REQUIRED in SPRINT_LOG.md.
