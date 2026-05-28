# Clarifer Sprint Plan — UPDATED
# May 27, 2026 revision
# Testing woven in from start. Visual verification at every phase.
# Launch: June 15, 2026

---

## How sessions are counted

One session = one sprint branch, one focused task, tsc + vitest pass, committed.
Samira pushes from PowerShell. Samira merges to main. Claude Code never touches main.
Branch format: fix/[description] or feat/[description]

## What changed from the original plan

1. Testing is no longer a phase at the end. Tests run alongside every build.
2. Smoke tests and production verification added as S-INFRA-1 through S-INFRA-4
3. Infrastructure sessions added before Phase 2 features begin
4. PHI remediation added (S15 found 4 violations that must be fixed)
5. data_consent table migration added (S87 references it but it does not exist)
6. All references to CLARIFER_MASTER_SESSION_PROMPT.md replaced with CLARIFER_BRAIN.md
7. S18 corrected: profiles table does not exist, use patients table
8. Branch format corrected: fix/ not sprint-N-name

---

## COMPLETED — S1 through S17 (May 25-27, 2026)

S1  | fix/password-reset-redirect  | DONE | Password reset redirect fixed
S2  | fix/phi-client-writes-1      | DONE | 2 PHI writes moved to API routes
S3  | fix/phi-client-writes-2      | DONE | 2 more PHI writes moved
S4  | fix/phi-client-writes-3      | DONE | Final PHI writes moved, 0 remaining
S5  | fix/audit-log-missing        | DONE | audit_log complete on upload and deletion
S6  | fix/account-deletion-cascade | DONE | Cascade SQL written (MIGRATION REQUIRED)
S7  | fix/trial-saves-org-id       | DONE | org_id fix on trial_saves upsert
S8  | fix/vitest-failing-7         | DONE | 308 tests passing
S9  | fix/em-dashes                | DONE | 26 em dashes replaced across 18 files
S10 | fix/hex-strings              | DONE | Hex strings replaced with CSS variables
S11 | fix/touch-targets            | DONE | 9 touch targets under 48px fixed
S12 | fix/who-ictrp-empty          | DONE | WHO ICTRP seeded with 6 sample trials
S13 | fix/rls-audit                | DONE | 27 tables audited, all have RLS
S14 | fix/session-timeout          | DONE | 30-min inactivity timeout added
S15 | fix/supabase-baa-check       | DONE | PHI audit, 4 violations logged
S16 | fix/sentry-errors            | DONE | Sentry wired into top 3 silent errors
S17 | fix/mobile-touch-audit       | DONE | Mobile parity gaps logged

---

## INFRASTRUCTURE — Build the testing foundation first
## These run before Phase 2 features. Testing cannot come at the end.

**S-INFRA-1** `fix/core-smoke-tests`
5 Playwright smoke tests against https://clarifer.com using demo account.
Tests: login, symptom log form opens, document upload page loads,
family update generator produces output, AI chat responds.
All tests run against LIVE production URL.
Auth state saved to playwright/.auth/demo.json and reused across tests.
Add to package.json: "test:smoke": "playwright test --project=smoke"
Demo: demo@clarifer.com / ClariferdDemo2026! / Carlos Rivera
Patient ID: 5fc76836-e2f7-47b6-a394-ddccef619c95
All 5 tests must pass against clarifer.com before committing.
Commit to fix/core-smoke-tests.

**S-INFRA-2** `fix/github-actions-ci`
Build .github/workflows/ci.yml — runs on every push to any branch.
Steps: npm install, tsc, vitest, npm audit.
Build .github/workflows/production-smoke.yml — runs on push to main.
Waits for Vercel deployment then runs the 5 smoke tests against clarifer.com.
On failure: GitHub Action marked failed, email sent via Brevo.
Requires GitHub secrets: DEMO_EMAIL, DEMO_PASSWORD, VERCEL_TOKEN.
Log as MANUAL REQUIRED: Samira adds secrets to GitHub repo settings.
Commit to fix/github-actions-ci.

**S-INFRA-3** `fix/percy-visual-tests`
Add Percy visual regression testing to existing Playwright smoke tests.
npm install --save-dev @percy/cli @percy/playwright
Add percySnapshot() calls to all 5 smoke tests after key UI states.
Snapshots: home screen, symptom form open, document list,
family update generated, chat response visible.
Percy runs as part of the GitHub Actions CI workflow.
Log as MANUAL REQUIRED: Samira creates Percy account, adds PERCY_TOKEN
to GitHub secrets at percy.io (free tier: 5,000 snapshots/month).
Commit to fix/percy-visual-tests.

**S-INFRA-4** `fix/n8n-monitoring`
Build n8n workflow JSON file at scripts/n8n-monitoring-workflow.json.
Workflow: runs every 10 minutes, hits 5 endpoints, alerts on failure.
Endpoints to monitor:
  GET  https://clarifer.com/api/health
  GET  https://clarifer.com/login
  GET  https://clarifer.com (landing page)
  GET  https://clarifer.com/ccf-dashboard
  POST https://clarifer.com/api/chat (with test payload)
On non-200 or timeout > 8 seconds: sends Brevo email to samira.esquina@clarifer.com.
Claude Code writes the JSON. Samira imports it into n8n on HP machine.
Log as MANUAL REQUIRED: import workflow JSON into n8n at 100.109.75.73.
Commit to fix/n8n-monitoring.

**S-INFRA-5** `fix/phi-remediation`
Fix the 4 PHI violations found in S15 audit.
Files to fix:
  app/api/ai/trial-summary/route.ts:150
  app/api/chat/route.ts:162
  app/api/family-update/route.ts:82
  app/api/summarize/route.ts:143
Fix: replace patient.name with patient first name only.
Fix: replace custom_diagnosis with condition category only (never specific name).
No raw diagnosis text in any Anthropic prompt. Ever.
tsc must be 0 errors. All existing tests must pass.
This is a HIPAA BLOCKER. Must be done before any real caregiver uses the platform.
Commit to fix/phi-remediation.

**S-INFRA-6** `fix/data-consent-migration`
The data_consent table is referenced in S87 but does not exist in the schema.
Write migration: supabase/migrations/20260528000001_data_consent.sql
Table: data_consent
Columns: id (uuid), user_id (uuid FK auth.users), organization_id (uuid FK organizations),
  consented_at (timestamptz), consent_version (text), withdrawn_at (timestamptz nullable),
  ip_address (text), created_at (timestamptz default now()
RLS: enabled. Policy: users can read/write their own consent records.
audit_log on every write.
Log as MIGRATION REQUIRED.
Commit to fix/data-consent-migration.

---

## PHASE 1 REMAINING — S18 through S24
## Clear remaining debt before building features.

**S18** `fix/onboarding-hardening`
Existing onboarding at app/onboarding/page.tsx (3 steps, 642 lines) stays.
Do NOT rebuild it. Harden what exists.
Read the file in full. Check:
- All 4 HIPAA requirements on POST /api/patients/create
- Input validation before database write
- Error handling that does not leak internals
- Loading state during API call
- Handles page refresh mid-onboarding
Fix any gaps. Write tests for new logic.
NOTE: There is NO profiles table. User data is in patients and users tables.
NOTE: API route is POST /api/patients/create, not /api/onboarding/complete.
Commit to fix/onboarding-hardening.

**S19** `feat/notifications`
Build /notifications — app/notifications/page.tsx.
Lists: symptom alerts, medication reminders, care team updates.
GET /api/notifications with auth + role + org_id filter + audit_log.
PATCH /api/notifications/[id]/read to mark read.
Bell icon badge on header updates when unread count changes.
Write Playwright test: notifications page loads, unread badge visible.
Commit to feat/notifications.

**S20** `feat/patient-hub`
Build /patients/[id] hub — app/(platform)/patients/[id]/page.tsx.
Shows: insurance stack, coverage waterfall, authorization wallet, income cliff alert.
GET /api/patients/[id] with all 4 HIPAA checks.
Read Figma file RvUccT5yRPIMLMAYySg8W2 frame "Patient Hub" before building.
Write Playwright test: patient hub loads with demo patient data.
Commit to feat/patient-hub.

**S21** `feat/appointments`
Build /patients/[id]/appointments.
List + add form. GET/POST /api/appointments with all 4 HIPAA checks.
audit_log on every write.
Write Vitest test: appointment creates with correct org_id.
Commit to feat/appointments.

**S22** `feat/tools-hub`
Build /tools hub — app/tools/page.tsx.
Links to: medications, trials, emergency card, family update.
No new API. Static navigation screen.
Mobile screen: apps/mobile/app/tools/index.tsx.
Commit to feat/tools-hub.

**S23** `feat/download-page`
Build /download — app/download/page.tsx.
Links to App Store (Apple Team ID: PV8B2R8Y22) and Google Play.
Static page. No auth required.
Commit to feat/download-page.

**S24** `feat/waitlist-flow`
Build /waitlist — app/waitlist/page.tsx.
Form: email + submit. POST /api/waitlist. Writes to waitlist table.
Brevo confirmation email via team@clarifer.com.
Write Playwright test: submit waitlist form, confirm success state.
Commit to feat/waitlist-flow.

---

## PHASE 2 — Core features
## Every feature session includes tests. No exceptions.

**S25** `feat/symptom-log-hardening`
Harden symptom log API. Confirm all 7 fields write correctly.
Add: overallLevel validation (1-5 only).
Add: infectionSigns alert email trigger via Brevo when 2+ signs checked.
Alert copy: "Call 911 or go to the emergency room immediately" for 2+ signs.
Trend: flag if same symptom logged high 3 days in a row.
AI trend summary: POST /api/log/trend (Anthropic, cached 6h).
Write Vitest tests: validation, alert trigger, trend calculation.
Playwright test: log symptom with 2+ infection signs, confirm alert fires.
Commit to feat/symptom-log-hardening.

**S26** `feat/document-analysis-verify`
Verify document analysis pipeline works end to end.
PDF upload to Supabase Storage, Anthropic document API, cached summary.
Test with a real PDF from tests/fixtures/ (create a simple test PDF if none exists).
Fix any broken steps in the pipeline.
Add: skeleton shimmer while loading.
Add: error state if analysis fails or times out after 30s.
Write Playwright test: upload PDF, wait for AI analyzed badge to appear.
Commit to feat/document-analysis-verify.

**S27** `feat/medication-interactions`
Drug interaction detection on medication list.
When 2+ medications saved: check against drug_interactions table.
If drug_interactions table is empty: seed with top 20 oncology interactions.
Log as MIGRATION REQUIRED for the seed data.
Show warning banner on /tools/medications if interaction found.
Write Vitest test: interaction detected when 2 conflicting meds present.
Commit to feat/medication-interactions.

**S28** `feat/family-update-history`
Build /patients/[id]/family-update/history.
Lists all past family updates: date, format (WhatsApp/email), content preview.
GET /api/family-update/history with all 4 HIPAA checks. Pagination: 20/page.
Write Playwright test: history page loads with at least one entry from demo data.
Commit to feat/family-update-history.

**S29** `feat/emergency-card-pdf`
Emergency card PDF export.
GET /api/emergency-card/[patientId]/pdf returns signed Supabase Storage URL.
PDF uses lib/pdf/hospital-grade-export.tsx (hex colors allowed here only).
QR code links to /emergency/[publicToken] (public, no auth).
Medications must show: name, dosage, frequency (not name only per James Whitfield).
Write Playwright test: PDF download link appears, QR code visible on card.
Commit to feat/emergency-card-pdf.

**S30** `feat/care-team-invite`
Build /patients/[id]/care-team/invite.
Form: provider name, email, role, org.
POST /api/care-team/invite with all 4 HIPAA checks.
Brevo sends invite email from team@clarifer.com.
Creates pending row in care_team table. Pending badge on care team list.
Write Vitest test: invite creates pending care_team row with correct org_id.
Commit to feat/care-team-invite.

**S31** `feat/provider-patient-detail`
Provider patient detail: /provider/patients/[id].
Shows: 7-day symptom trend chart (recharts), medication list with taken status,
provider notes with timestamps.
POST /api/provider/notes. Role check: provider only.
All 4 HIPAA checks. audit_log on every view and note write.
Notes visible to all providers on care team. Never visible to caregivers.
Write Playwright test: provider can add note, note appears in list.
Commit to feat/provider-patient-detail.

**S32** `feat/admin-outcomes`
Hospital admin outcomes tab: /admin/outcomes.
Readmission rate chart (recharts). Medication adherence. Caregiver burden.
GET /api/admin/outcomes. Role check: hospital_admin only.
Data is aggregate only. No individual PHI in response.
Write Vitest test: response contains no individual patient identifiers.
Commit to feat/admin-outcomes.

**S33** `feat/trials-detail`
Build /patients/[id]/trials/[trialId].
Full trial detail: description, eligibility, site locations, contact info.
GET /api/trials/[trialId]. Save/unsave. Share button.
Write Playwright test: trial detail page loads with correct data.
Commit to feat/trials-detail.

**S34** `feat/patients-new`
Build /patients/new — app/(platform)/patients/new/page.tsx.
Multi-step form for adding a new patient.
POST /api/patients/create. handle_new_user trigger must not double-create.
Write Playwright test: new patient form submits, patient appears in list.
Commit to feat/patients-new.

**S35** `feat/ccf-dashboard-audit`
Audit and harden /ccf-dashboard and /ccf pages.
Confirm live at clarifer.com/ccf-dashboard.
Confirm data is aggregate only, no individual PHI.
Confirm CCF credentials required, not caregiver auth.
Confirm CCF card on home says "Don't know where to start?" not "Are you newly diagnosed?"
Write Playwright test: CCF dashboard loads with data. No PHI visible.
THIS SESSION IS PRIORITY — CCF research demo is June 3-5.
Commit to feat/ccf-dashboard-audit.

**S36** `feat/internal-command-center-audit`
Audit /hq and all sub-routes.
Confirm all require allowlist auth (samira.esquina@clarifer.com, michael.barbara@clarifer.com).
Michael's view: growth data only. No PHI.
Write Playwright test: unauthenticated access to /hq redirects to /hq/login.
Commit to feat/internal-command-center-audit.

**S37** `feat/promise-page`
Build or audit /promise — app/promise/page.tsx.
Caregiver Support Fund commitment. PBC intent. Data consent value exchange.
Copy: no em dashes, no "serious illness". Static page. No auth required.
Write Playwright test: page loads, all footer links resolve.
Commit to feat/promise-page.

**S38** `feat/data-transparency-audit`
Audit /data, /disclaimer, /privacy, /privacy-notice, /security, /terms.
Confirm: no Cassini Design Group references, no em dashes, correct Clarifer Corp entity.
Confirm all legal pages live and linked from footer.
Write Playwright test: all 6 legal pages return 200.
Commit to feat/data-transparency-audit.

**S39** `feat/brevo-email-audit`
Audit all Brevo email templates.
Triggered by: signup, password reset, invite, waitlist confirmation,
GDPR export, medication reminder.
Confirm: all send from team@clarifer.com via smtp-relay.brevo.com:587.
Confirm: no em dashes, no "serious illness" in any template.
Write Vitest test: email template content validation.
Commit to feat/brevo-email-audit.

**S40** `feat/rate-limiting-audit`
Confirm Upstash Redis rate limiting active on:
/api/chat (4/min), /api/log/create, auth routes (5 attempts).
Add rate limiting to any route missing it.
Write Vitest test: 6th request to rate-limited route returns 429.
Commit to feat/rate-limiting-audit.

---

## MOBILE PHASE — S41 through S56
## Every mobile screen ships with a corresponding Vitest component test.
## Uses apps/mobile/app/ directory. No hex strings. Design tokens only.
## No window, document, localStorage, or next/router in any mobile file.

**S41** `feat/mobile-home`
apps/mobile/app/home.tsx
Matches web /home: patient name, alert banner, 4 quick actions,
symptom log rows, CCF card ("Don't know where to start?"), tab bar.
Tab bar active indicator: 4px (not 3px — renders at sub-pixel on Android).
Uses lib/design-tokens.ts for all colors.
Write Vitest component test: home screen renders with patient data.
Commit to feat/mobile-home.

**S42** `feat/mobile-symptoms`
apps/mobile/app/log/index.tsx and apps/mobile/app/log/add.tsx.
Symptom list view + all 7 sections of add form.
Scroll behavior: one long scroll (not expand/collapse sections).
Autosave indicator: draft saved every 30 seconds via /api/log/draft.
Same validation as web. Same API calls.
Write Vitest test: symptom form validates overallLevel 1-5 only.
Commit to feat/mobile-symptoms.

**S43** `feat/mobile-medications`
apps/mobile/app/tools/medications.tsx.
Medication list, mark-taken checkbox, adherence bar, interaction warning.
Same API. Optimistic UI. Undo toast.
Write Vitest test: mark-taken updates optimistically, reverts on error.
Commit to feat/mobile-medications.

**S44** `feat/mobile-documents`
apps/mobile/app/documents/index.tsx and upload.tsx.
Document list with AI analyzed badge. Upload with native file picker.
Same API. Progress bar on upload (multipart via Supabase resumable upload).
Write Vitest test: upload flow triggers analysis.
Commit to feat/mobile-documents.

**S45** `feat/mobile-chat`
apps/mobile/app/chat.tsx.
Suggested questions, message bubbles, streaming response.
AI disclaimer visible ABOVE input bar (not below).
Keyboard safe area: input bar accounts for iOS keyboard inset.
Streaming indicator: blinking cursor while generating.
Same API. Same rate limit. Same guardrails.
Write Vitest test: guardrail text is visible above input.
Commit to feat/mobile-chat.

**S46** `feat/mobile-trials`
apps/mobile/app/tools/trials.tsx.
Trial list, filters, save, discuss. Same API.
Write Vitest test: save trial updates trial_saves with org_id.
Commit to feat/mobile-trials.

**S47** `feat/mobile-family-update`
apps/mobile/app/patients/[id]/family-update.tsx.
Generate, format toggle (WhatsApp/email), copy buttons.
Streaming indicator: blinking cursor while generating.
Copy button label: "Copy, then open WhatsApp and paste" (known friction, explicit).
Same API. Same timeout.
Write Vitest test: copy button appears after generation completes.
Commit to feat/mobile-family-update.

**S48** `feat/mobile-emergency`
apps/mobile/app/patients/[id]/emergency-card.tsx.
Emergency card display, QR code, share. Offline capable.
Medications show: name, dosage, frequency.
Write Vitest test: card renders offline (no network call required).
Commit to feat/mobile-emergency.

**S49** `feat/mobile-care-team`
apps/mobile/app/patients/[id]/care-team.tsx.
Provider list, invite, swipe-to-remove. Same API.
Write Vitest test: care team list renders with demo data.
Commit to feat/mobile-care-team.

**S50** `feat/mobile-profile`
apps/mobile/app/profile.tsx.
Account details, language toggle, sign out, danger zone.
Data consent toggle: opt-in to anonymized data sharing.
Same API.
Write Vitest test: sign out calls supabase.auth.signOut().
Commit to feat/mobile-profile.

**S51** `feat/mobile-auth`
apps/mobile/app/(auth)/login.tsx, signup.tsx, forgot-password.tsx.
All auth flows. Google OAuth via Supabase. MFA challenge. Account locked state.
Apple Developer Team ID: PV8B2R8Y22.
Write Playwright test: mobile login flow completes.
Commit to feat/mobile-auth.

**S52** `feat/mobile-onboarding`
apps/mobile/app/onboarding.tsx.
3-step onboarding matching web. Same API (POST /api/patients/create).
Write Vitest test: onboarding completes and creates patient record.
Commit to feat/mobile-onboarding.

**S53** `feat/mobile-notifications`
apps/mobile/app/notifications.tsx.
Notification list, mark-read. Push notification registration (Expo Push).
Badge on tab bar updates in real time.
Write Vitest test: unread count badge updates when notification marked read.
Commit to feat/mobile-notifications.

**S54** `feat/mobile-patient-hub`
apps/mobile/app/patients/[id]/index.tsx.
Patient hub: insurance stack, coverage waterfall, authorization wallet.
Write Vitest test: patient hub renders without PHI leaking to console.
Commit to feat/mobile-patient-hub.

**S55** `feat/mobile-tools-hub`
apps/mobile/app/tools/index.tsx.
Tools hub navigation. Links to all tools.
Write Vitest test: all tool links point to existing routes.
Commit to feat/mobile-tools-hub.

**S56** `feat/mobile-document-detail`
apps/mobile/app/documents/[id].tsx.
AI summary, share, view original. Skeleton while loading.
Error state if AI analysis fails or times out.
Write Vitest test: skeleton visible during load, disappears on data.
Commit to feat/mobile-document-detail.

---

## PHASE 3 — Enhancement
## Smoke tests run after every 5 sessions merged to main.

**S57** `feat/symptom-trends-chart`
30-day symptom trend chart on /log (web + mobile).
recharts on web. react-native-chart-kit on mobile.
Data: GET /api/log/trend?days=30.
Chart: line graph, severity by day, color-coded by level.
Write Vitest test: trend data returns correct shape.
Commit to feat/symptom-trends-chart.

**S58** `feat/medication-adherence-chart`
30-day adherence chart on /tools/medications.
Bar chart: taken vs missed per day. Streak counter.
Data: GET /api/medications/adherence?days=30.
Write Vitest test: adherence calculation correct.
Commit to feat/medication-adherence-chart.

**S59** `feat/ai-guardrail-tests`
Write Vitest tests for every AI guardrail.
Tests verify: no diagnosis language, no prognosis speculation,
no medication change recommendations, no psychiatric medication commentary.
Use mock Anthropic responses. All tests must pass.
These tests run in CI on every push.
Commit to feat/ai-guardrail-tests.

**S60** `feat/document-categories`
Document category filtering on /documents.
Filter pills: All, Medical record, Lab report, Insurance, Medication, Referral.
Client-side filter only. Matches upload category selection.
Write Playwright test: filter pills work, correct documents shown.
Commit to feat/document-categories.

**S61** `feat/trial-filters-advanced`
Advanced trial filters: distance radius, phase multi-select, biomarker match only.
GET /api/trials updated to accept new params.
Filters persist in URL params for page refresh survival.
Write Playwright test: filters persist after refresh.
Commit to feat/trial-filters-advanced.

**S62** `feat/family-update-spanish`
Spanish family update generation.
When profile.locale === 'es': generate in Latin American Spanish (not Spain Spanish).
Test: generate with ES locale, confirm Spanish output.
Write Vitest test: Spanish generation returns es-MX language content.
Commit to feat/family-update-spanish.

**S63** `feat/ccf-support-groups`
CCF support groups on caregiver home screen.
Confirm data is current. Add "Newly Connected" program card.
No condition names visible on caregiver home screen.
CCF card copy: "Don't know where to start?" not "Are you newly diagnosed?"
Write Playwright test: CCF card visible, no condition names on screen.
Commit to feat/ccf-support-groups.

**S64** `feat/care-team-provider-view`
Provider patient detail: provider notes with timestamps.
Notes visible to all providers on care team. Never to caregivers.
Role check: role=provider. audit_log on every note write and read.
Write Playwright test: caregiver cannot see provider notes.
Commit to feat/care-team-provider-view.

**S65** `feat/global-search`
Global search: components/Search.tsx.
Searches: documents, medications, care team, trial saves.
GET /api/search?q=query. Debounced 300ms. Keyboard: Cmd+K.
Write Playwright test: search returns results for demo data.
Commit to feat/global-search.

**S66** `feat/gdpr-export`
GDPR data export: POST /api/data/export.
Collects: patients, symptoms, medications, documents metadata,
care team, trials saved.
Packages as JSON. Stores in Supabase Storage (private).
Sends download link via Brevo.
Write Vitest test: export contains all required tables, no missing data.
Commit to feat/gdpr-export.

**S67** `feat/account-deletion`
Account deletion: POST /api/account/delete.
Cascade delete all 12 tables (uses S6 migration).
audit_log retained. Brevo confirmation email sent.
Write Playwright test: delete account, confirm redirect to marketing site.
Commit to feat/account-deletion.

**S68** `feat/public-emergency-card`
Public emergency card: /emergency/[publicToken].
No auth required. Works offline (static render).
Shows: patient name, allergies, blood type, medications with dosage/frequency,
primary care, caregiver contact.
No diagnosis visible per copy rules.
Write Playwright test: page loads without auth, no diagnosis text present.
Commit to feat/public-emergency-card.

**S69** `feat/about-page`
Build or audit /about — app/about/page.tsx.
Founder story: Samira, her father, cholangiocarcinoma, anchor logo.
Anchor logo tied to his love of fishing. Never removed from about page.
No "serious illness". No em dashes. No Cassini Design Group.
Write Playwright test: about page loads, anchor logo present.
Commit to feat/about-page.

**S70** `feat/password-change`
Password change from within profile.
/profile → "Change password" → supabase.auth.updateUser({password}).
Requires current password verification first.
Write Playwright test: change password, sign in with new password.
Commit to feat/password-change.

**S71** `feat/mfa-setup`
MFA setup for caregivers who want it.
/profile → "Enable two-factor" → QR code for authenticator app.
supabase.auth.mfa.enroll(). Recovery codes displayed once.
Write Playwright test: MFA enrollment flow completes.
Commit to feat/mfa-setup.

**S72** `feat/web-push-notifications`
Web push notifications for symptom alerts and medication reminders.
Service worker registration. Permission prompt (not on first load).
Fires when: severity >= 7, medication overdue by 2h.
Write Vitest test: push permission prompt behavior.
Commit to feat/web-push-notifications.

**S73** `feat/intake-forms-pdf`
Patient intake form PDF export.
GET /api/patients/[id]/intake-pdf → hospital-grade PDF.
Includes: demographics, insurance, medications, care team, allergies.
Write Playwright test: PDF download link returns signed URL.
Commit to feat/intake-forms-pdf.

**S74** `feat/appointment-reminders`
Appointment reminder emails.
24h before appointment: Brevo email to caregiver.
Build GET /api/appointments/reminders (n8n calls this on schedule).
Do not configure n8n — just build the endpoint.
Write Vitest test: endpoint returns upcoming appointments correctly.
Commit to feat/appointment-reminders.

**S75** `feat/symptom-sharing`
Share symptom log entry with care team.
/log/[entryId] → "Share with care team" → Brevo formatted email.
POST /api/log/[entryId]/share with audit_log write.
Write Playwright test: share button sends email, success state shown.
Commit to feat/symptom-sharing.

**S76** `feat/document-sharing`
Share document AI summary with care team.
/documents/[id] → "Share summary" → Brevo email.
POST /api/documents/[id]/share. Plain text only, no raw PHI.
Write Playwright test: share button sends email, success state shown.
Commit to feat/document-sharing.

**S77** `feat/insurance-waterfall`
Insurance coverage waterfall on patient hub /patients/[id].
Shows: primary → secondary → Medicaid → out-of-pocket.
Calculates estimated patient responsibility per coverage tier.
Static calculation from patient profile coverage fields.
Write Vitest test: waterfall calculation correct for each tier.
Commit to feat/insurance-waterfall.

**S78** `feat/income-cliff-alert`
Income cliff alert on patient hub.
If Medicaid income limit within 10% of household income: show alert.
Static calculation. Uses income from onboarding.
Write Vitest test: alert triggers at correct threshold.
Commit to feat/income-cliff-alert.

**S79** `feat/authorization-wallet`
Prior authorization tracker on patient hub.
Fields: procedure, status enum (pending/approved/denied), date submitted, payer.
GET/POST /api/authorizations. CRUD. audit_log on all writes.
Write Vitest test: status field only accepts valid enum values.
Commit to feat/authorization-wallet.

**S80** `feat/medication-refill-alerts`
Medication refill alert: 7 days before estimated refill date.
Calculate days supply from dosage and fill date.
Alert: banner on /tools/medications + push notification + Brevo email.
Write Vitest test: refill alert triggers at correct threshold.
Commit to feat/medication-refill-alerts.

**S81** `feat/provider-dashboard-filters`
Provider dashboard filters: by alert status, last activity, patient name.
Client-side filter. No new API. Filters persist in URL.
Write Playwright test: filters persist after page refresh.
Commit to feat/provider-dashboard-filters.

**S82** `feat/admin-white-label`
Hospital admin white-label: /admin/white-label.
Form: display name, tagline, logo upload, accent color.
PATCH /api/admin/branding. Role: hospital_admin only.
Stored in organizations table. Applied via CSS custom properties.
Write Playwright test: white-label settings save and apply.
Commit to feat/admin-white-label.

**S83** `feat/admin-caregiver-list`
Hospital admin caregiver list.
Paginated table: name, last active, adherence %, alert status.
GET /api/admin/caregivers. Aggregate data only. No individual PHI.
Write Vitest test: response contains no individual patient identifiers.
Commit to feat/admin-caregiver-list.

**S84** `feat/admin-export`
Hospital admin data export: CSV and PDF.
GET /api/admin/export?format=csv|pdf.
Aggregate outcomes data. Signed URL from Supabase Storage.
Write Playwright test: export download link resolves.
Commit to feat/admin-export.

**S85** `feat/spanish-localization`
Spanish (Latin American) localization pass.
All i18n keys for: home, symptom log, medications, documents, chat, family update.
No em dashes in Spanish strings. No "serious illness" equivalent in Spanish.
Test: toggle to ES, verify all strings render in Spanish.
Write Vitest test: all required i18n keys present for es-MX locale.
Commit to feat/spanish-localization.

**S86** `feat/panama-dashboard-skeleton`
Panama admin dashboard placeholder.
Route: /admin/panama. Page: "Coming soon" content.
No real data. No auth bypass. Registered route only.
Write Playwright test: page returns 200 with correct auth.
Commit to feat/panama-dashboard-skeleton.

**S87** `feat/caregiver-support-fund`
Caregiver Support Fund data consent flow.
On profile: "Opt into anonymized data sharing" toggle.
If opted in: eligible for Fund distributions (informational).
Write consent to data_consent table (created in S-INFRA-6).
Fields: user_id, organization_id, consented_at, consent_version, ip_address.
audit_log write on consent and withdrawal.
Copy: this is a genuine value exchange, not a legal checkbox.
Show: withdrawal option is always visible. Consent can be withdrawn anytime.
Write Vitest test: consent row created with correct fields including version.
Commit to feat/caregiver-support-fund.

**S88** `feat/landing-page-final`
Final landing page audit.
Confirm: waitlist form works end-to-end (submits, Brevo confirmation sent).
Confirm: June 15 launch date visible (read from config, not hardcoded).
Confirm: no "serious illness", no em dashes, no Cassini references.
Confirm: footer links all resolve.
Write Playwright test: full landing page flow including waitlist submit.
Commit to feat/landing-page-final.

---

## PHASE 4 — Polish and launch prep
## Polish runs alongside ongoing smoke test verification.

**S89** `feat/playwright-auth-suite`
Full Playwright auth suite.
Tests: sign up → onboarding → home, sign in email, sign in Google mock,
forgot password, MFA challenge, account locked after 5 attempts.
All run against https://clarifer.com.
Commit to feat/playwright-auth-suite.

**S90** `feat/playwright-symptom-suite`
Full symptom log Playwright suite.
Tests: open form, fill all 7 sections, save, verify entry in list,
open detail, share with care team, infection signs warning appears.
Commit to feat/playwright-symptom-suite.

**S91** `feat/playwright-document-suite`
Document upload and AI analysis Playwright suite.
Tests: upload PDF, verify progress, AI analysis triggers,
summary appears, share button works.
Commit to feat/playwright-document-suite.

**S92** `feat/playwright-medication-suite`
Medications Playwright suite.
Tests: add medication, mark taken, verify streak, interaction warning appears.
Commit to feat/playwright-medication-suite.

**S93** `feat/playwright-trials-suite`
Trials Playwright suite.
Tests: search, filter, save trial, dismiss, view detail.
Commit to feat/playwright-trials-suite.

**S94** `feat/playwright-family-update-suite`
Family update Playwright suite.
Tests: generate (WhatsApp + email format), copy, view history.
Commit to feat/playwright-family-update-suite.

**S95** `feat/playwright-emergency-suite`
Emergency card Playwright suite.
Tests: view card, QR code opens public URL, share card, offline render.
Commit to feat/playwright-emergency-suite.

**S96** `feat/playwright-provider-suite`
Provider flow Playwright suite.
Tests: provider login, view patient list, view patient detail, add note,
confirm caregiver cannot see notes.
Commit to feat/playwright-provider-suite.

**S97** `feat/npm-audit-fix`
Fix all critical and high npm vulnerabilities.
npm audit fix. Test after each fix: tsc + vitest pass.
If fix breaks something: log DISCOVERED ISSUE, revert that specific fix.
Commit to feat/npm-audit-fix.

**S98** `feat/performance-audit`
Lighthouse score >= 90 on landing page and /home.
Run: npx lighthouse https://clarifer.com --output json
Fix the top 3 performance issues found.
Commit to feat/performance-audit.

**S99** `feat/accessibility-audit`
All interactive elements have aria labels.
Add axe-core to Playwright tests: every page must pass accessibility scan.
Fix all critical and serious violations found.
Commit to feat/accessibility-audit.

**S100** `feat/image-optimization`
All images use next/image. All have descriptive alt text.
grep for <img tags. Replace with next/image.
Write Vitest test: no raw img tags in component files.
Commit to feat/image-optimization.

**S101** `feat/error-boundaries`
Every page has an error boundary component.
Create components/ErrorBoundary.tsx.
Wrap every page in app/(platform)/ with it.
Write Vitest test: error boundary renders fallback on thrown error.
Commit to feat/error-boundaries.

**S102** `feat/loading-states-audit`
Every data fetch has a skeleton or spinner.
Audit every page that fetches data. Add skeleton where missing.
Write Playwright test: skeleton visible before data loads.
Commit to feat/loading-states-audit.

**S103** `feat/empty-states-audit`
Every list has a warm, specific empty state. No blank screens.
Audit every list component. Add empty state where missing.
Copy: warm and specific, not generic. Reference the founding story tone.
Write Playwright test: empty state visible when list has no data.
Commit to feat/empty-states-audit.

**S104** `feat/404-500-pages`
Custom 404 and 500 pages.
app/not-found.tsx and app/error.tsx.
Branded, warm copy. Link back to /home.
Write Playwright test: 404 page renders for unknown routes.
Commit to feat/404-500-pages.

**S105** `feat/seo-robots-sitemap`
robots.txt and sitemap.xml correct for public pages.
Public pages: /, /about, /promise, /login, /download, /waitlist, legal pages.
Private pages: /home, /patients, /documents, /log, /tools, /chat, /hq.
Write Playwright test: /robots.txt returns 200, /sitemap.xml returns 200.
Commit to feat/seo-robots-sitemap.

**S106** `feat/opengraph-metadata`
Every public page has og:title, og:description, og:image.
Use Next.js metadata API. og:image hosted on Vercel.
Write Vitest test: metadata present on all public pages.
Commit to feat/opengraph-metadata.

**S107** `feat/favicon-app-icons`
All favicon sizes. All PWA icon sizes. Apple touch icon.
Apple Developer Team ID: PV8B2R8Y22.
Write Playwright test: favicon returns 200, manifest.json valid.
Commit to feat/favicon-app-icons.

**S108** `feat/env-vars-audit`
Audit all Vercel environment variables.
Confirm all required vars present in Production scope.
Confirm no secrets in NEXT_PUBLIC_ prefix.
Log as MANUAL REQUIRED: Samira verifies in Vercel dashboard.
Write list of all required env vars to docs/ENV_VARS.md.
Commit to feat/env-vars-audit.

**S109** `feat/supabase-connection-audit`
Confirm Supabase connection pooler in use for all serverless functions.
Check all Supabase client instantiation in API routes.
Confirm using pooler connection string, not direct connection.
Log as MANUAL REQUIRED: Samira confirms pooler URL in Supabase dashboard.
Commit to feat/supabase-connection-audit.

**S110** `feat/vercel-deployment-audit`
No build warnings. All routes resolve.
Run: vercel build (local) — confirm 0 errors, 0 warnings.
Check every route in app/ resolves to a real page.
Fix any broken routes found.
Commit to feat/vercel-deployment-audit.

**S111** `feat/ci-cd-audit`
All GitHub Actions passing.
Review all .github/workflows/ files.
Confirm: CI runs tsc + vitest + npm audit on every push.
Confirm: smoke tests run on every push to main.
Confirm: no failing or skipped steps.
Commit to feat/ci-cd-audit.

**S112** `feat/copy-final-pass`
Final copy audit.
grep -r "—" app/ components/ — must return 0 results.
grep -r "serious illness" app/ components/ — must return 0 results.
grep -r "Clarifier" app/ components/ — must return 0 results (wrong spelling).
grep -r "Cassini" app/ components/ — must return 0 results.
grep -r "profiles" app/api/ — must return 0 results (wrong table name).
Fix any violations found.
Commit to feat/copy-final-pass.

**S113** `feat/testflight-build`
Expo EAS build to TestFlight.
Build .github/workflows/testflight.yml.
Triggers on push to main.
Runs: eas build --platform ios --non-interactive.
Submits to TestFlight via eas submit.
Log as MANUAL REQUIRED: Samira adds EXPO_TOKEN and App Store Connect
API key to GitHub secrets.
Apple Developer Team ID: PV8B2R8Y22.
Commit to feat/testflight-build.

**S114** `feat/mobile-internal-testing`
Mobile app internal testing checklist.
Write docs/MOBILE_TEST_CHECKLIST.md covering:
  - Core caregiver flow on iOS
  - Core caregiver flow on Android
  - Push notification receipt
  - Offline emergency card
  - Camera/file picker for document upload
  - Biometric auth (Face ID / fingerprint)
Log as MANUAL REQUIRED: Samira tests on real device from TestFlight.
Commit to feat/mobile-internal-testing.

**S115** `feat/demo-account-reset`
Reset demo@clarifer.com to fresh, clean state.
Write script: scripts/reset-demo-account.ts
Deletes all demo data. Re-seeds with Carlos Rivera and realistic data:
  - 5 symptom log entries over last 2 weeks
  - 3 medications with adherence history
  - 2 uploaded documents with AI summaries
  - 1 care team member
  - 1 saved clinical trial
  - 1 family update sent
Log as MANUAL REQUIRED: Samira runs script against production.
Never run automatically.
Commit to feat/demo-account-reset.

**S116** `feat/ccf-dashboard-final`
Final CCF dashboard verification.
Confirm data for CCF research team presentation June 3-5.
Confirm aggregate data is meaningful and current.
Confirm no individual PHI visible at any point.
Write Playwright test: full CCF dashboard walkthrough passes.
THIS IS CCF DEMO CRITICAL. Run smoke tests after this session.
Commit to feat/ccf-dashboard-final.

**S117** `feat/waitlist-final-test`
Submit waitlist form, confirm Brevo email arrives.
Write Playwright test: waitlist submit → success state → email sent.
Run this test against production. Confirm email received.
Log as MANUAL REQUIRED: Samira submits a test email and confirms receipt.
Commit to feat/waitlist-final-test.

**S118** `feat/stripe-placeholder`
Stripe payment placeholder for hospital licensing.
If hospital licensing requires payment: add Stripe checkout placeholder.
If not required yet: add /admin/billing route with "Contact us" CTA.
No real Stripe integration — just the route and page.
Commit to feat/stripe-placeholder.

**S119** `feat/supabase-backup-confirm`
Supabase backup confirmation.
Write docs/BACKUP_POLICY.md documenting:
  - Supabase automatic daily backups (Pro plan)
  - Retention period
  - How to restore
  - Point-in-time recovery availability
Log as MANUAL REQUIRED: Samira confirms backup settings in Supabase dashboard.
Commit to feat/supabase-backup-confirm.

**S120** `feat/final-playwright-suite`
Full Playwright suite against production URL.
All tests from S89-S96 plus smoke tests run against https://clarifer.com.
Must all pass before launch.
Log any failures as DISCOVERED ISSUE. Do not fix inline.
Commit results to feat/final-playwright-suite.

**S121** `feat/final-tsc`
Final TypeScript check.
npx tsc --noEmit must return 0 errors.
Fix any errors found.
Commit to feat/final-tsc.

**S122** `feat/final-vitest`
Final unit test suite.
npx vitest run must show all tests passing.
Fix any failures. Do not skip or delete tests.
Commit to feat/final-vitest.

**S123** `feat/final-npm-audit`
Final npm audit.
npm audit must show 0 critical, 0 high vulnerabilities.
Fix any remaining vulnerabilities.
Commit to feat/final-npm-audit.

**S124** `feat/soft-launch`
Soft launch to waitlist.
Write docs/LAUNCH_CHECKLIST.md with every item verified.
Log as MANUAL REQUIRED: Samira sends Brevo campaign to waitlist.
Log as MANUAL REQUIRED: Samira posts on Substack (@sequinsam) and LinkedIn.
Commit docs to feat/soft-launch.

**S125** `feat/buffer-1`
Buffer session. Anything that slipped.
If nothing slipped: write docs/POST_LAUNCH_ROADMAP.md covering
next 90 days of product development.
Commit to feat/buffer-1.

**S126** `feat/buffer-2`
Buffer session. Anything that slipped.
If nothing slipped: write docs/INVESTOR_TECHNICAL_BRIEF.md covering
architecture, security posture, HIPAA compliance, and scalability.
Commit to feat/buffer-2.

---

## Session template — paste at start of every Claude Code session

Read docs/CLARIFER_BRAIN.md in full.
List all 10 rules back before writing any code.
Then run Step 0 and report results.
Then execute the assigned session task.

---

## MANUAL REQUIRED items — these require Samira, not Claude Code

These cannot be automated. Do them in parallel with the build.

URGENT (before any real caregiver uses the platform):
1. Email sales@anthropic.com — request Anthropic BAA
2. Email enterprise@supabase.com — request Supabase BAA
3. Add $120-200 API credits to console.anthropic.com

BEFORE CCF DEMO (June 3):
4. Run all pending SQL migrations in Supabase SQL Editor
5. Add GitHub secrets: DEMO_EMAIL, DEMO_PASSWORD, VERCEL_TOKEN, PERCY_TOKEN
6. Confirm clarifer.com/ccf-dashboard shows live aggregate data
7. Reset demo account (S115)

BEFORE LAUNCH (June 15):
8. Confirm Vercel environment variables all present
9. Confirm Supabase pooler connection in use
10. Add EXPO_TOKEN and App Store Connect key to GitHub secrets
11. Supabase backup settings confirmed
12. Send waitlist launch campaign

ONGOING:
13. Michael recruits 10 caregivers with documented feedback by July 15
14. CCF letter of support by June 1
15. SAM.gov UEI registration (needed for ACL grant)
