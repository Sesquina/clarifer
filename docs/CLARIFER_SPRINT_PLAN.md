# Clarifer Sprint Plan
**May 25 – June 14, 2026 · 22 build days · 8 sessions/day · 95 sessions remaining**
Launch: June 15, 2026

---

## How sessions are counted

One session = one sprint branch, one focused task, tsc + vitest pass, committed.
You push from PowerShell. You merge to main. Claude Code never touches main.

Branch format: `sprint-[N]-[description]` or `fix/[description]`

---

## PHASE 1 — Clear the debt (May 25–27, 3 days, 24 sessions)

Nothing new gets built until known bugs are gone.
These block HIPAA compliance and the June 15 launch.

### Day 1 — May 25 (8 sessions)

**S1** `fix/password-reset-redirect`
Known bug #1. Password reset redirects to nonexistent page.
Read `app/update-password/page.tsx`. Confirm route exists. Fix redirect target.
Playwright test: reset flow completes end-to-end.

**S2** `fix/phi-client-writes-1`
Known bug #2 (part 1 of 3). 6 client-side PHI writes bypass API routes.
Audit: find all `supabase` client calls writing patient data outside `/api/` routes.
Log as DISCOVERED ISSUE for each one. Fix the first 2. API route + auth check + org_id filter + audit_log.

**S3** `fix/phi-client-writes-2`
Known bug #2 (part 2). Fix the next 2 client-side PHI writes.
Same pattern as S2.

**S4** `fix/phi-client-writes-3`
Known bug #2 (part 3). Fix the final 2 client-side PHI writes.
Verify: grep codebase for direct supabase client writes to patient tables. Result: 0.

**S5** `fix/audit-log-missing`
Known bug #3. audit_log missing on document upload and account deletion.
Add audit_log write to: document upload handler, account deletion handler.
Test: upload a doc, check audit_log row exists.

**S6** `fix/account-deletion-cascade`
Known bug #4. Account deletion leaves data in 12 tables.
Write migration SQL to `supabase/migrations/` — cascade delete all patient data.
Log as MIGRATION REQUIRED. Do not execute. List all 12 tables in migration comment.

**S7** `fix/trial-saves-org-id`
Known bug #5. trial_saves upsert missing organization_id.
Find upsert. Add organization_id. Test: save a trial, confirm org_id present in row.

**S8** `fix/vitest-failing-7`
7 tests are currently failing. Read each failure. Fix root cause.
Do not delete tests. Do not skip tests. All 268 must pass before this session closes.

---

### Day 2 — May 26 (8 sessions)

**S9** `fix/em-dashes`
Known bug #8. 13 files contain em dashes in copy.
grep: `grep -r "—" app/ components/ --include="*.tsx" --include="*.ts" -l`
Replace every em dash with a comma, period, or short phrase. No exceptions.
tsc + vitest pass. Commit.

**S10** `fix/hex-strings`
Known bug #7. 34 files use hex strings instead of CSS variables.
grep: `grep -r "#[0-9A-Fa-f]\{6\}" app/ components/ --include="*.tsx" -l`
Exception: `lib/pdf/hospital-grade-export.tsx` may keep hex directly.
Replace all others with CSS variable equivalents from `docs/DESIGN`.

**S11** `fix/touch-targets`
Known bug #9. 14 files have touch targets under 48px.
grep: find buttons and interactive elements under 48px height.
Set `min-height: 48px` on all interactive elements. Mobile-first.

**S12** `fix/who-ictrp-empty`
Known bug #6. WHO ICTRP table empty.
Investigate: what populates this table? Write seed migration or n8n trigger.
Log as MIGRATION REQUIRED with seed data approach documented.

**S13** `fix/rls-audit`
Audit all tables created in the last 25 migrations.
Every table must have RLS enabled on creation.
For any table missing RLS: write migration to add it.
Log as MIGRATION REQUIRED for each one.

**S14** `fix/session-timeout`
Session timeout must fire at 30 minutes inactivity.
Find current implementation. If missing: add inactivity listener.
`supabase.auth.signOut()` to `/login`. Test with Playwright.

**S15** `fix/supabase-baa-check`
Audit: confirm no real PHI is flowing into Anthropic API prompts.
grep all Anthropic API calls. Confirm patient data is anonymized or summarized before prompt injection.
Log any violations as DISCOVERED ISSUE. Do not fix inline — report to Samira.

**S16** `fix/sentry-errors`
Review Sentry for any production errors from the last 7 days.
Fix the top 3 by frequency. tsc + vitest pass.

---

### Day 3 — May 27 (8 sessions)

**S17** `fix/mobile-touch-audit`
Rule 9 audit: every web page must have a corresponding mobile screen in `apps/mobile/app/`.
List all web routes. List all mobile routes. Find gaps.
Log each gap as DISCOVERED ISSUE. Do not fix inline — report to Samira.

**S18** `sprint-1-onboarding-flow`
Build `/onboarding` and `/onboarding/complete`.
Files: `app/onboarding/page.tsx`, `app/onboarding/complete/page.tsx`.
Matches Figma Row 1 signup steps 1-5.
API: `POST /api/onboarding/complete`. Writes to: profiles, patients, care_team tables.
tsc + vitest + Playwright (onboarding completes, redirects to /home).

**S19** `sprint-2-notifications`
Build `/notifications` — `app/notifications/page.tsx`.
Lists: symptom alerts, medication reminders, care team updates.
GET `/api/notifications`. Mark-read: `PATCH /api/notifications/[id]/read`.
Bell icon badge on mobile header updates in real time.

**S20** `sprint-3-patient-hub`
Build `/patients/[id]` hub — `app/(app)/patients/[id]/page.tsx`.
Shows: insurance stack, coverage waterfall, authorization wallet, income cliff alert.
GET `/api/patients/[id]`. Requires auth + role + org_id filter + audit_log.

**S21** `sprint-4-appointments`
Build `/patients/[id]/appointments` — `app/(app)/patients/[id]/appointments/page.tsx`.
List + add form. GET/POST `/api/appointments`.
All 4 HIPAA checks. audit_log on every write.

**S22** `sprint-5-tools-hub`
Build `/tools` hub — `app/tools/page.tsx`.
Links to: medications, trials, emergency card, family update.
No new API. Static navigation screen. Mobile screen in `apps/mobile/`.

**S23** `sprint-6-download-page`
Build `/download` — `app/download/page.tsx`.
Links to App Store (Apple Team ID: PV8B2R8Y22) and Google Play.
Static page. No auth required.

**S24** `sprint-7-waitlist-flow`
Build `/waitlist` — `app/waitlist/page.tsx`.
Form: email + submit. POST `/api/waitlist`. Writes to waitlist table.
Brevo confirmation email via `team@clarifer.com`.
Connects to existing landing page waitlist CTA.

---

## PHASE 2 — Core features (May 28–31, 4 days, 32 sessions)

### Day 4 — May 28 (8 sessions)

**S25** `sprint-8-symptom-log-api`
Harden symptom log API. Confirm all 7 fields write correctly.
Add: overallLevel validation (1-5 only), infectionSigns alert email trigger (Brevo).
Trend calculation: flag if same symptom logged high 3 days in a row.
AI trend summary on `/log` home view: POST `/api/log/trend` (Anthropic, cached 6h).

**S26** `sprint-9-document-analysis`
Confirm document analysis pipeline is working end-to-end.
PDF upload to Supabase Storage to Anthropic document API to cached summary.
Test with a real PDF. Fix any broken steps.
Add: skeleton shimmer while loading, error state if analysis fails.

**S27** `sprint-10-medication-interactions`
Drug interaction detection on medication list.
When 2+ medications saved: check against `drug_interactions` table.
If match: show warning banner on `/tools/medications`.
Seed `drug_interactions` table with top 20 common oncology interactions.
Log as MIGRATION REQUIRED.

**S28** `sprint-11-family-update-history`
Build `/patients/[id]/family-update/history`.
Lists all past family updates with date, format (WhatsApp/email), content preview.
GET `/api/family-update/history`. Pagination: 20 per page.

**S29** `sprint-12-emergency-card-pdf`
Emergency card PDF export.
`/api/emergency-card/[patientId]/pdf` returns signed Supabase Storage URL to PDF.
PDF uses `lib/pdf/hospital-grade-export.tsx`. Hex colors allowed here.
QR code links to `/emergency/[publicToken]` (public, no auth).

**S30** `sprint-13-care-team-invite`
Build `/patients/[id]/care-team/invite`.
Form: provider name, email, role, org.
POST `/api/care-team/invite`. Brevo sends invite email.
Creates pending row in `care_team` table. Pending badge on care team list.

**S31** `sprint-14-provider-patient-detail`
Provider patient detail screen: `/provider/patients/[id]`.
Shows: 7-day symptom trend chart, medication list with taken status, provider notes.
POST `/api/provider/notes` to add note. Role check: provider only.
All 4 HIPAA checks. audit_log on every view.

**S32** `sprint-15-admin-outcomes`
Hospital admin outcomes tab: `/admin/outcomes`.
Readmission rate chart (recharts). Medication adherence. Caregiver burden distribution.
GET `/api/admin/outcomes`. Role check: hospital_admin only.
Data is aggregate — no individual PHI in response.

---

### Day 5 — May 29 (8 sessions)

**S33** `sprint-16-trials-detail`
Build `/patients/[id]/trials/[trialId]`.
Full trial detail: description, eligibility criteria, site locations, contact info.
GET `/api/trials/[trialId]`. Save/unsave. Share button.

**S34** `sprint-17-patients-new`
Build `/patients/new` — `app/(app)/patients/new/page.tsx`.
Multi-step form matching signup step 2 (patient info).
POST `/api/patients/create`. handle_new_user trigger must not double-create.

**S35** `sprint-18-ccf-dashboard`
Audit and harden `/ccf-dashboard` and `/ccf` pages.
Confirm CCF dashboard at `clarifer.com/ccf-dashboard` is working.
Confirm data shown to CCF is aggregate only — no individual PHI.
Confirm access requires CCF credentials, not caregiver auth.

**S36** `sprint-19-internal-command-center`
Audit `/internal` and all sub-routes.
Confirm all require allowlist auth (samira.esquina@clarifer.com, michael.barbara@clarifer.com).
Michael's view: growth data only. No PHI. Confirm this is enforced.

**S37** `sprint-20-promise-page`
Build or audit `/promise` — `app/promise/page.tsx`.
Caregiver Support Fund commitment. PBC intent. Data consent value exchange.
Copy: no em dashes, no "serious illness". Static page. No auth required.

**S38** `sprint-21-data-transparency`
Audit `/data`, `/disclaimer`, `/privacy`, `/privacy-notice`, `/security`, `/terms`.
Confirm: no Cassini Design Group references, no em dashes, correct Clarifer Corp entity.
Confirm all legal pages are live and linked from footer.

**S39** `sprint-22-brevo-emails`
Audit all Brevo email templates.
Triggered by: signup, password reset, invite, waitlist confirmation, GDPR export, medication reminder.
Confirm: all send from `team@clarifer.com` via smtp-relay.brevo.com:587.
Confirm: no em dashes, no "serious illness" in any template.

**S40** `sprint-23-rate-limiting`
Confirm Upstash Redis rate limiting is active on:
`/api/chat` (4/min), `/api/log/create` (reasonable limit), auth routes (5 attempts).
If missing on any route: add it.

---

### Day 6 — May 30 (8 sessions)

**S41** `sprint-24-mobile-home`
Expo mobile: `apps/mobile/app/home.tsx`.
Matches web `/home` exactly: patient name, alert banner, 4 quick actions, symptom log rows, CCF card, tab bar.
Uses `lib/design-tokens.ts` for all colors. No hex in components.

**S42** `sprint-25-mobile-symptoms`
Expo mobile: `apps/mobile/app/log/index.tsx` and `apps/mobile/app/log/add.tsx`.
Symptom list view + all 7 sections of the add form.
Same logic as web. Same validation. Same API calls.

**S43** `sprint-26-mobile-medications`
Expo mobile: `apps/mobile/app/tools/medications.tsx`.
Medication list, mark-taken checkbox, adherence bar, interaction warning.
Same API. Optimistic UI. Undo toast.

**S44** `sprint-27-mobile-documents`
Expo mobile: `apps/mobile/app/documents/index.tsx` and `apps/mobile/app/documents/upload.tsx`.
Document list with AI analyzed badge. Upload with native file picker.
Same API. Progress bar on upload.

**S45** `sprint-28-mobile-chat`
Expo mobile: `apps/mobile/app/chat.tsx`.
Suggested questions, message bubbles, streaming response.
Same API. Same rate limit. Same guardrails.

**S46** `sprint-29-mobile-trials`
Expo mobile: `apps/mobile/app/tools/trials.tsx`.
Trial list, filters, save, discuss. Same API.

**S47** `sprint-30-mobile-family-update`
Expo mobile: `apps/mobile/app/patients/[id]/family-update.tsx`.
Generate, format toggle, copy buttons. Same API. Same timeout.

**S48** `sprint-31-mobile-emergency`
Expo mobile: `apps/mobile/app/patients/[id]/emergency-card.tsx`.
Emergency card display, QR code, share. Offline capable.

---

### Day 7 — May 31 (8 sessions)

**S49** `sprint-32-mobile-care-team`
Expo mobile: `apps/mobile/app/patients/[id]/care-team.tsx`.
Provider list, invite, swipe-to-remove. Same API.

**S50** `sprint-33-mobile-profile`
Expo mobile: `apps/mobile/app/profile.tsx`.
Account details, language toggle, sign out, danger zone. Same API.

**S51** `sprint-34-mobile-auth`
Expo mobile: `apps/mobile/app/(auth)/login.tsx`, `signup.tsx`, `forgot-password.tsx`.
All auth flows. Google OAuth via Supabase. MFA challenge. Account locked state.
Apple Developer Team ID: PV8B2R8Y22.

**S52** `sprint-35-mobile-onboarding`
Expo mobile: `apps/mobile/app/onboarding.tsx`.
5-step onboarding matching web. Same API.

**S53** `sprint-36-mobile-notifications`
Expo mobile: `apps/mobile/app/notifications.tsx`.
Notification list, mark-read. Push notification registration (Expo Push Notifications).
Badge on tab bar updates in real time.

**S54** `sprint-37-mobile-patient-hub`
Expo mobile: `apps/mobile/app/patients/[id]/index.tsx`.
Patient hub with insurance stack, coverage waterfall, authorization wallet.

**S55** `sprint-38-mobile-tools-hub`
Expo mobile: `apps/mobile/app/tools/index.tsx`.
Tools hub navigation screen. Links to all tools.

**S56** `sprint-39-mobile-document-detail`
Expo mobile: `apps/mobile/app/documents/[id].tsx`.
AI summary, share, view original. Skeleton while loading.

---

## PHASE 3 — Enhancement (Jun 1–5, 5 days, 40 sessions)

### Day 8 — June 1 (8 sessions)

**S57** `sprint-40-symptom-trends`
30-day symptom trend chart on `/log` (web + mobile).
recharts on web. react-native-chart-kit on mobile.
Data: GET `/api/log/trend?days=30`.
Chart: line graph, severity by day, color-coded by level.

**S58** `sprint-41-medication-adherence-chart`
30-day adherence chart on `/tools/medications`.
Bar chart: taken vs missed per day. Streak counter.
Data: GET `/api/medications/adherence?days=30`.

**S59** `sprint-42-ai-guardrail-tests`
Write Vitest tests for every AI guardrail.
Tests must verify: no diagnosis language, no prognosis speculation, no medication change recommendations, no psychiatric medication commentary.
Use mock Anthropic responses. All tests must pass before any AI feature ships.

**S60** `sprint-43-document-categories`
Document category filtering on `/documents`.
Filter pills: All, Medical record, Lab report, Insurance, Medication, Referral.
Client-side filter (no API call). Matches upload category selection.

**S61** `sprint-44-trial-filters-advanced`
Advanced trial filters: distance radius, phase multi-select, biomarker match only.
GET `/api/trials` updated to accept new params.
Filters persist in URL params so they survive page refresh.

**S62** `sprint-45-family-update-spanish`
Spanish family update generation.
When `profile.locale === 'es'`: generate update in Spanish.
Test: generate update with ES locale, confirm Spanish output.
Copy rule: Latin American Spanish, not Spain Spanish.

**S63** `sprint-46-ccf-support-groups`
CCF support groups on caregiver home screen.
Confirm data is current. Add "Newly Connected" program card.
No condition names visible on caregiver home screen.

**S64** `sprint-47-care-team-provider-view`
Provider patient detail: add provider notes with timestamps.
Notes visible to all providers on care team, not to caregivers.
Role check: role=provider. audit_log on every note write and read.

---

### Day 9 — June 2 (8 sessions)

**S65** `sprint-48-search-global`
Global search on web: `components/Search.tsx`.
Searches across: documents, medications, care team, trial saves.
GET `/api/search?q=query`. Debounced 300ms.
Keyboard shortcut: Cmd+K (desktop).

**S66** `sprint-49-export-data`
GDPR data export: `POST /api/data/export`.
Collects: profile, patients, symptoms, medications, documents metadata, care team, trials saved.
Packages as JSON. Stores in Supabase Storage (private). Sends download link via Brevo.

**S67** `sprint-50-delete-account`
Account deletion: `POST /api/account/delete`.
Cascade delete: all 12 tables. Confirm all are covered (known bug #4 migration).
audit_log retained. Brevo confirmation email sent.
Test: delete account, confirm all data gone, audit_log row present.

**S68** `sprint-51-public-emergency`
Public emergency card: `/emergency/[publicToken]`.
No auth required. Works offline (static render).
Shows: patient name, allergies, blood type, medications, primary care, caregiver contact.
No diagnosis visible — condition removed from public view per copy rules.

**S69** `sprint-52-about-page`
Build or audit `/about` — `app/about/page.tsx`.
Founder story (Samira, father, cholangiocarcinoma, anchor logo).
The anchor is tied to her father's love of fishing. This story is never stripped.
No "serious illness". No em dashes. No Cassini Design Group.

**S70** `sprint-53-password-change`
Build password change flow from within profile.
`/profile` to "Change password" to `supabase.auth.updateUser({password})`.
Requires current password verification first.
Playwright test: change password, sign in with new password.

**S71** `sprint-54-mfa-setup`
MFA setup flow for caregivers who want it.
`/profile` to "Enable two-factor" to QR code for authenticator app.
`supabase.auth.mfa.enroll()`. Recovery codes displayed once.

**S72** `sprint-55-push-notifications-web`
Web push notifications for symptom alerts and medication reminders.
Service worker registration. Notification permission prompt (not on first load).
Fires when: severity >= 7, medication overdue by 2h.

---

### Day 10 — June 3 (8 sessions)

**S73** `sprint-56-intake-forms`
Patient intake form PDF export.
`/api/patients/[id]/intake-pdf` via `lib/pdf/hospital-grade-export.tsx`.
Includes: demographics, insurance, medications, care team, allergies.

**S74** `sprint-57-appointment-reminders`
Appointment reminder emails.
24h before appointment: Brevo email to caregiver.
`/api/appointments/reminders` — build the endpoint n8n calls. Do not configure n8n.

**S75** `sprint-58-symptom-sharing`
Share symptom log entry with care team.
`POST /api/log/[entryId]/share`. Formatted Brevo email. audit_log write.

**S76** `sprint-59-document-sharing`
Share document AI summary with care team.
`POST /api/documents/[id]/share`. Plain text only — no PHI beyond summary.

**S77** `sprint-60-insurance-waterfall`
Insurance coverage waterfall on patient hub `/patients/[id]`.
Shows: primary to secondary to Medicaid to out-of-pocket.
Calculates estimated patient responsibility for each coverage tier.

**S78** `sprint-61-income-cliff-alert`
Income cliff alert on patient hub.
If Medicaid income limit is within 10% of entered household income: show alert.
Static calculation — no external API.

**S79** `sprint-62-authorization-wallet`
Prior authorization tracker on patient hub.
Fields: procedure, status (pending/approved/denied), date submitted, payer.
GET/POST `/api/authorizations`. CRUD. audit_log on all writes.

**S80** `sprint-63-medication-refill-alerts`
Medication refill alert: 7 days before estimated refill date.
Alert: banner on `/tools/medications` + push notification + Brevo email.

---

### Day 11 — June 4 (8 sessions)

**S81** `sprint-64-provider-dashboard-filters`
Provider dashboard filters: by alert status, by last activity, by patient name.
Client-side filter. No new API. Filters persist in URL.

**S82** `sprint-65-admin-white-label`
Hospital admin white-label: `/admin/white-label`.
Form: display name, tagline, logo upload, accent color.
`PATCH /api/admin/branding`. Requires role=hospital_admin.
Stored in `organizations` table. Applied via CSS custom properties.

**S83** `sprint-66-admin-caregiver-list`
Hospital admin caregiver list view.
Paginated table: name, last active, adherence %, alert status.
GET `/api/admin/caregivers`. Aggregate data only.

**S84** `sprint-67-admin-export`
Hospital admin data export: CSV and PDF report.
GET `/api/admin/export?format=csv|pdf`.
Aggregate outcomes data. Signed URL from Supabase Storage.

**S85** `sprint-68-internacional-es`
Spanish (Latin American) localization pass.
All i18n keys for: home, symptom log, medications, documents, chat, family update.
Confirm: no em dashes in any Spanish string.
Test: toggle to ES, verify all strings render correctly.

**S86** `sprint-69-internacional-panama`
Panama admin dashboard skeleton.
Placeholder page with "Coming soon" content. No real data. No auth bypass.

**S87** `sprint-70-caregiver-support-fund`
Caregiver Support Fund data consent flow.
On profile: opt-in toggle for anonymized data sharing.
Write consent to `data_consent` table with timestamp. audit_log write.
Copy: data consent is a genuine value exchange, not a legal checkbox.

**S88** `sprint-71-landing-page-final`
Final landing page audit.
Confirm: waitlist form works end-to-end.
Confirm: June 15 launch date visible.
Confirm: no "serious illness", no em dashes, no Cassini references.
Playwright test: full landing page flow.

---

### Day 12 — June 5 (8 sessions)

**S89** `sprint-72-playwright-auth`
Playwright E2E: full auth suite.
Tests: sign up, onboarding, home, sign in email, Google mock, forgot password, MFA, account locked.

**S90** `sprint-73-playwright-symptom-log`
Playwright E2E: full symptom log flow.
Tests: open form, fill all 7 sections, save, verify entry in list, open detail, share with care team.

**S91** `sprint-74-playwright-documents`
Playwright E2E: document upload and AI analysis.
Tests: upload PDF, verify progress, verify AI analysis triggers, open summary, share.

**S92** `sprint-75-playwright-medications`
Playwright E2E: medications.
Tests: add medication, mark taken, verify streak, interaction warning appears.

**S93** `sprint-76-playwright-trials`
Playwright E2E: trials.
Tests: search, filter, save trial, dismiss trial, view detail.

**S94** `sprint-77-playwright-family-update`
Playwright E2E: family update.
Tests: generate WhatsApp and email, copy, view history.

**S95** `sprint-78-playwright-emergency`
Playwright E2E: emergency card.
Tests: view card, QR code opens public URL, share card.

**S96** `sprint-79-playwright-provider`
Playwright E2E: provider flow.
Tests: provider login, view patient list, view patient detail, add note.

---

## PHASE 4 — Polish and launch prep (Jun 6–14, 9 days, remaining sessions)

| Session | Task |
|---|---|
| S97 | npm audit — fix all critical and high severity vulnerabilities |
| S98 | Performance audit — Lighthouse score >= 90 on landing page |
| S99 | Accessibility audit — all interactive elements have aria labels |
| S100 | Image optimization — all images use next/image, have alt text |
| S101 | Error boundaries — every page has an error boundary component |
| S102 | Loading states audit — every data fetch has a skeleton or spinner |
| S103 | Empty states audit — every list has an empty state (no blank screens) |
| S104 | 404 and 500 pages — custom, branded, link back to /home |
| S105 | robots.txt and sitemap.xml — confirm correct for public pages |
| S106 | OpenGraph metadata — every public page has og:title, og:description, og:image |
| S107 | Favicon and app icons — all sizes, Apple Developer Team ID PV8B2R8Y22 |
| S108 | Production environment variables — audit Vercel, confirm all present |
| S109 | Supabase connection limits — confirm pooler in use for serverless |
| S110 | Vercel deployment audit — no build warnings, all routes resolve |
| S111 | CI/CD audit — GitHub Actions all passing |
| S112 | Copy final pass — grep em dashes, "serious illness", "Clarifier" (wrong spelling), Cassini |
| S113 | Mobile app TestFlight build — Expo EAS build to TestFlight |
| S114 | Mobile app internal testing — test on real device |
| S115 | Demo account reset — demo@clarifer.com fresh data |
| S116 | CCF dashboard final — confirm data for CCF research team presentation |
| S117 | Waitlist final test — submit form, confirm Brevo email arrives |
| S118 | Stripe or payment placeholder (if hospital licensing requires) |
| S119 | Supabase backup confirmation — backups enabled, retention set |
| S120 | Final Playwright suite — all tests pass against production URL |
| S121 | Final tsc — 0 errors |
| S122 | Final vitest — all 268+ tests pass |
| S123 | Final npm audit — 0 critical, 0 high |
| S124 | Soft launch to waitlist — send Brevo campaign |
| S125 | Buffer — anything that slipped |
| S126 | Buffer — anything that slipped |

---

## Session prompt template

Paste at the start of every Claude Code session:

Read docs/CLARIFER_MASTER_SESSION_PROMPT.md in full.
Confirm you have read it by listing the 10 rules back to me.
Then run Step 0:

git branch --show-current
git log --oneline -5
git status
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l
npx vitest run 2>&1 | tail -5

Report all results. Do not write any code. Wait for my instructions.

Then paste the specific session task from this document.

---

## Tracking

| Session | Branch | Status | Notes |
|---|---|---|---|
| S1 | fix/password-reset-redirect | [ ] | |
| S2 | fix/phi-client-writes-1 | [ ] | |
| S3 | fix/phi-client-writes-2 | [ ] | |
| S4 | fix/phi-client-writes-3 | [ ] | |
| S5 | fix/audit-log-missing | [ ] | |
| S6 | fix/account-deletion-cascade | [ ] | |
| S7 | fix/trial-saves-org-id | [ ] | |
| S8 | fix/vitest-failing-7 | [ ] | |
| S9 | fix/em-dashes | [ ] | |
| S10 | fix/hex-strings | [ ] | |
| S11 | fix/touch-targets | [ ] | |
| S12 | fix/who-ictrp-empty | [ ] | |
| S13 | fix/rls-audit | [ ] | |
| S14 | fix/session-timeout | [ ] | |
| S15 | fix/supabase-baa-check | [ ] | |
| S16 | fix/sentry-errors | [ ] | |
| S17 | fix/mobile-touch-audit | [ ] | |
| S18 | sprint-1-onboarding-flow | [ ] | |
| S19 | sprint-2-notifications | [ ] | |
| S20 | sprint-3-patient-hub | [ ] | |
| S21 | sprint-4-appointments | [ ] | |
| S22 | sprint-5-tools-hub | [ ] | |
| S23 | sprint-6-download-page | [ ] | |
| S24 | sprint-7-waitlist-flow | [ ] | |
| S25 | sprint-8-symptom-log-api | [ ] | |
| S26 | sprint-9-document-analysis | [ ] | |
| S27 | sprint-10-medication-interactions | [ ] | |
| S28 | sprint-11-family-update-history | [ ] | |
| S29 | sprint-12-emergency-card-pdf | [ ] | |
| S30 | sprint-13-care-team-invite | [ ] | |
| S31 | sprint-14-provider-patient-detail | [ ] | |
| S32 | sprint-15-admin-outcomes | [ ] | |
| S33 | sprint-16-trials-detail | [ ] | |
| S34 | sprint-17-patients-new | [ ] | |
| S35 | sprint-18-ccf-dashboard | [ ] | |
| S36 | sprint-19-internal-command-center | [ ] | |
| S37 | sprint-20-promise-page | [ ] | |
| S38 | sprint-21-data-transparency | [ ] | |
| S39 | sprint-22-brevo-emails | [ ] | |
| S40 | sprint-23-rate-limiting | [ ] | |
| S41-S56 | sprint-24 through 39 (mobile) | [ ] | |
| S57-S88 | sprint-40 through 71 (features) | [ ] | |
| S89-S96 | sprint-72 through 79 (Playwright) | [ ] | |
| S97-S126 | Polish and launch prep | [ ] | |
