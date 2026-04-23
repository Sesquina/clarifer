# CLAUDE.md — Clarifer Agent Brain
**Read this file completely before writing a single line of code.**
**Update this file after every sprint. It is the living record of this codebase.**
**Last updated: Sprint 1 (April 22, 2026)**
**CCF Demo Date: June 17, 2026 (8-week deadline)**
**Clarifer Corp Incorporation: April 22, 2026 (via every.io, ETA finalized 3-5 days)**

---

## SECTION 1 — PROJECT CONTEXT

### What Clarifer Is
Clarifer is a condition-agnostic caregiver intelligence platform. It serves four roles: caregiver, patient, provider, and hospital administrator. It was built by a caregiver managing her father's stage 4 cholangiocarcinoma. She had the documents, the medications, and the appointments. She had no tool. She built one.

Live at: clarifer.com (domain purchased April 22, 2026, DNS configured, awaiting propagation)
Working directory: /home/esqui/clarifier
Mobile: /apps/mobile | Web: /apps/web | Shared: /packages/shared
Parent entity: Clarifer Corp (Delaware C-Corp, Stock: 10M authorized, 8M founder vested 12-mo cliff/48-mo vesting)

### What Clarifer Does NOT Do — Hard-Coded Guardrails, Zero Exceptions
- Does NOT diagnose. Ever.
- Does NOT recommend changing medications or treatment plans.
- Does NOT speculate on prognosis or survival.
- Does NOT replace a doctor, nurse, or care team.
- Does NOT store documents publicly.
- Does NOT charge caregivers.

If any feature could be interpreted as crossing one of these lines:
STOP. Write GUARDRAIL CONFLICT: [description] to SPRINT_LOG.md. Move to next task.

### The Founding Story
Someone opening this at 2am in a hospital parking lot should feel a hand on their shoulder.
Warm, human, never clinical. Never cold. Never empty states that judge the user.

### Legal Context
- HIPAA compliance is non-negotiable. See Section 3.
- Delaware C-Corp incorporation pending. Currently Clarifer Corp.
- BAAs required with every vendor touching PHI before use.
- Medical disclaimer modal with timestamp logging on first patient profile load.
- AI analysis consent is a separate logged flow.

---

## SECTION 2 — TECH STACK

### Exact Versions — Use These. Do Not Upgrade Without Instruction.
```
Node.js:                    20.x LTS
TypeScript:                 5.x strict -- zero errors before any commit
Next.js:                    14.x App Router
React:                      18.x
Expo SDK:                   51.x
React Native:               0.74.x
Expo Router:                3.x
Supabase JS:                2.x
Tailwind CSS:               3.x
Vitest:                     4.x (Jest-compatible API, faster execution -- replaces Jest 29.x)
Playwright:                 1.x
Detox:                      20.x
React Testing Library:      14.x
React Native Testing Lib:   12.x
Vercel AI SDK:              6.x (streaming, toTextStreamResponse())
```

### Services
```
Database:         Supabase Pro (BAA required before launch)
Hosting:          Vercel
Email:            Brevo
Error monitoring: Sentry
Rate limiting:    Upstash Redis
Mobile builds:    EAS Build
OTA updates:      Expo Updates
```

### Anthropic
```
Complex tasks:    claude-opus-4-6 (document analysis only)
Fast tasks:       claude-haiku-4-5-20251001 (updates, trial summaries, prep)
All API calls:    Server-side ONLY via /api/ai/* routes
Client key:       NEVER. No exceptions.
PHI in prompts:   Strip to minimum necessary. BAA must be confirmed first.
Streaming:        Required. First token under 500ms.
```

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL         -- client-safe
NEXT_PUBLIC_SUPABASE_ANON_KEY    -- client-safe
SUPABASE_SERVICE_ROLE_KEY        -- server API routes ONLY. Never NEXT_PUBLIC_. Never client.
ANTHROPIC_API_KEY                -- server ONLY.
BREVO_API_KEY                    -- server ONLY.
SENTRY_DSN                       -- server ONLY.
UPSTASH_REDIS_REST_URL           -- server ONLY.
UPSTASH_REDIS_REST_TOKEN         -- server ONLY.
```

---

## SECTION 3 — ARCHITECTURAL PRINCIPLES (NON-NEGOTIABLE)

### HIPAA Enforcement
1. Audit log on every patient data read, write, update, delete. Same transaction. Audit write failure = data operation failure.
2. Role check on every API route. Order: authenticate, authorize, process. 401 on no session. 403 on wrong role.
3. RLS on every table on creation. In the same migration file. Not a follow-up.
4. tenant_id on every user-facing table. Enforced at DB and code layers both.
5. No PHI in any log. Log event types and error codes only.
6. Signed URLs expire in exactly 3600 seconds.
7. Session timeout: web 30-60 min, mobile 15 min.
8. SUPABASE_SERVICE_ROLE_KEY: API routes only. Every use must include a comment explaining why.

### Database Rules
- DDL runs manually in Supabase SQL editor by Samira only.
- Write the SQL. Log as MIGRATION REQUIRED: [sql] in SPRINT_LOG.md. Stop. Do not run it yourself.
- Never drop a column. Mark deprecated.
- Never rename a production column without a migration plan.
- audit_log is append-only. No updates. No deletes. Ever.
- anonymized_exports is write-only from app. Never expose to user-facing routes.
- organizations table is the multi-tenancy anchor. Do not touch its schema.

### Code Quality
- TypeScript strict. Zero errors. Zero `any` without comment. Zero `@ts-ignore` without comment.
- No commented-out code in commits.
- No TODO comments in commits. Log to SPRINT_LOG.md as DISCOVERED ISSUE instead.
- Every function over 20 lines gets a JSDoc comment.
- No em dashes anywhere. Use -- or restructure the sentence.

### AI Route Rules
- Every AI route: try/catch, rate limiting via Upstash, streaming via Vercel AI SDK.
- System prompt is a constant with interpolated variables. Never built from raw user input.
- On Claude API error: return graceful fallback. Never expose raw API error to client.

### Mobile Rules
- Web and mobile built simultaneously. Never defer a mobile feature.
- Never suggest PWA as substitute for native feature.
- All touch targets minimum 48px.
- No HTML form tags in React Native.
- Offline: last known state cached. App readable with no connection.

### Branch Rules
- Never commit directly to main.
- All work on branch: sprint-[N]-[short-description]
- Commit at end of every completed task. Not only end of sprint.
- main is protected. Only Samira merges to main.

---

## SECTION 4 — AUTONOMOUS OPERATION PROTOCOLS

These govern what the agent does when running without Samira present. Non-negotiable.

### SPRINT_LOG.md -- The Agent's Communication Channel
Every significant action writes an append-only entry to SPRINT_LOG.md in the repo root.

Entry format:
```
[TIMESTAMP] [TYPE]: [DESCRIPTION]
```

Valid types:
```
TASK STARTED          -- beginning a task
TASK COMPLETE         -- task finished, tests passing
FILE MODIFIED         -- file written or edited, include filename
TEST WRITTEN          -- failing test created
TEST PASSING          -- test now green
MIGRATION REQUIRED    -- SQL that needs Samira to run manually. Include full SQL.
DECISION REQUIRED     -- product or scope decision needed. Describe clearly.
HIPAA BLOCKER         -- compliance gap found. Work stopped on this task.
GUARDRAIL CONFLICT    -- potential guardrail crossing found. Work stopped.
ARCHITECTURE QUESTION -- gap in CLAUDE.md. Cannot proceed without guidance.
DISCOVERED ISSUE      -- problem found outside current sprint scope.
SESSION RECOVERY      -- session restarted, resuming from this point.
SPRINT COMPLETE       -- all tasks done, tests passing, ready for review.
npm audit             -- full npm audit output.
tsc output            -- full tsc --noEmit output.
```

Samira reads SPRINT_LOG.md at end of every day. This is the primary communication channel.
If it is not in SPRINT_LOG.md, it did not happen.

### BLOCKED STATE PROTOCOL
When any flag is raised (DECISION REQUIRED, HIPAA BLOCKER, GUARDRAIL CONFLICT, ARCHITECTURE QUESTION):
1. Write the flag and full description to SPRINT_LOG.md.
2. Do NOT proceed with the blocked task.
3. Move to the next unblocked task in the current sprint.
4. If all tasks are blocked: write SPRINT BLOCKED: [summary] to SPRINT_LOG.md. Stop.
5. Never resolve a block by making a decision that belongs to Samira.
6. Never start work outside the current sprint scope to fill time.

### SPRINT COMPLETION PROTOCOL
When all sprint tasks are complete and tests pass:
1. Write SPRINT COMPLETE to SPRINT_LOG.md with summary of what was built.
2. Run `npm audit`. Write full output to SPRINT_LOG.md.
3. Run `tsc --noEmit`. Write full output to SPRINT_LOG.md.
4. Run test suite. Write pass/fail summary to SPRINT_LOG.md.
5. Commit all work to sprint feature branch.
6. STOP. Do not start next sprint. Do not explore codebase.
7. Wait for Samira's end-of-day review.

### DISCOVERED ISSUES PROTOCOL
When an issue is found outside current sprint scope:
1. Write DISCOVERED ISSUE: [description] to SPRINT_LOG.md.
2. Do not fix it. Do not refactor it. Do not comment on it in code.
3. Continue with current sprint task.

### SESSION RECOVERY PROTOCOL
On session start, before any code work:
1. Read this file (CLAUDE.md) completely.
2. Read SPRINT_LOG.md. Find the last entry to understand current state.
3. If last entry is TASK STARTED with no subsequent TASK COMPLETE: log SESSION RECOVERY: [task name], resuming.
4. Resume from first incomplete task in current sprint.

---

## SECTION 5 — DATABASE SCHEMA REFERENCE

### Tables
```
condition_templates             -- drives AI context, symptom vocab, trial filters
organizations                   -- multi-tenancy anchor. tenant_id source of truth.
users                           -- all four roles. role is the access control gate.
patients                        -- patient profiles. always scoped to tenant_id.
care_relationships              -- links caregivers to patients
documents                       -- metadata only. file in Supabase Storage.
chat_messages                   -- AI conversation history per patient
symptom_logs                    -- time-series symptom data. core clinical asset.
symptom_alerts                  -- threshold-based alerts from symptom_logs
medications                     -- current and historical medications
appointments                    -- scheduled and completed appointments
trial_saves                     -- user-saved clinical trials
trial_cache                     -- cached trial API results
research_consent                -- per-patient, per-field: share_labs, share_docs, share_symptoms, share_medications
anonymized_exports              -- write-only from app. IRB pipeline only.
audit_log                       -- append-only. every patient data access event.
notifications                   -- push notification queue and delivery status
calendar_connections            -- device calendar integration tokens
medical_disclaimer_acceptances  -- first-use disclaimer timestamp per patient profile
ai_analysis_consents            -- document upload and AI analysis consent log
```

### Standard Auth Pattern -- Every API Route
```typescript
const supabase = createRouteHandlerClient({ cookies })
const { data: { session } } = await supabase.auth.getSession()
if (!session) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED', status: 401 }, { status: 401 })
const { data: user } = await supabase.from('users').select('role, organization_id').eq('id', session.user.id).single()
if (!user || !ALLOWED_ROLES.includes(user.role)) return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN', status: 403 }, { status: 403 })
```

### Standard Response Shapes
```typescript
// Success
{ data: T, meta?: { total?: number, page?: number, hasMore?: boolean } }
// Error
{ error: string, code: string, status: number }
```

---

## SECTION 6 -- API ROUTES
```
POST   /api/auth/signup
POST   /api/auth/signin
POST   /api/auth/signout
GET    /api/auth/session

POST   /api/documents/upload              caregiver
GET    /api/documents/:id                 caregiver, provider
DELETE /api/documents/:id                 caregiver
GET    /api/documents/search              caregiver

POST   /api/ai/analyze-document           caregiver, streaming
POST   /api/ai/generate-update            caregiver, streaming
POST   /api/ai/trial-eligibility          caregiver, streaming
POST   /api/ai/appointment-prep           caregiver, streaming

POST   /api/symptoms/log                  caregiver, patient
GET    /api/symptoms/:patient_id          caregiver, provider

POST   /api/medications/add               caregiver
PUT    /api/medications/:id               caregiver
GET    /api/medications/:patient_id       caregiver, provider

POST   /api/appointments/create           caregiver
PUT    /api/appointments/:id              caregiver
GET    /api/appointments/:patient_id      caregiver, provider

POST   /api/care-team/add                 caregiver
PUT    /api/care-team/:id                 caregiver
GET    /api/care-team/:patient_id         caregiver, provider

GET    /api/trials/search                 caregiver
POST   /api/trials/save                   caregiver
GET    /api/trials/saved/:patient_id      caregiver

GET    /api/provider/patients             provider
GET    /api/provider/patient/:id          provider

POST   /api/notifications/register        caregiver, patient, provider
POST   /api/notifications/send            server only

POST   /api/export/pdf                    caregiver, provider

GET    /api/admin/dashboard               hospital_admin
GET    /api/admin/users                   hospital_admin
POST   /api/admin/users/invite            hospital_admin
```

---

## SECTION 7 -- AI SYSTEM PROMPT STUBS
**STUBS ONLY. Samira writes final versions. Every stub route must log:**
`console.warn('[STUB PROMPT -- requires Samira review before production]')`

### Document Analysis
```
You are Clarifer's document analysis assistant.
You NEVER diagnose. You NEVER recommend treatment changes. You NEVER speculate on prognosis.
Output four sections: KEY FINDINGS, MEDICATIONS MENTIONED, NEXT STEPS, QUESTIONS TO ASK.
Condition context: {{condition_template_context}}
Document type: {{document_type}}
Language: {{language}}
Warm, clear, human. Never clinical or cold.
```

### Family Update
```
You help a caregiver write a plain-language family update.
No jargon without explanation. No prognosis speculation.
Symptoms: {{symptom_summary}} | Medications: {{medication_list}} | Documents: {{document_highlights}}
Language: {{language}}
```

### Trial Eligibility
```
Identify: 5 most important eligibility requirements in plain language, likely disqualifying criteria, next step.
Never recommend enrolling or not enrolling.
Condition: {{condition}} | Location: {{location}} | Trial: {{trial_raw_data}} | Language: {{language}}
```

### Appointment Prep
```
Suggest 3 specific questions worth raising at this appointment.
Be specific. Things the caregiver might not think to ask without this data.
Symptoms: {{recent_symptoms}} | Medication changes: {{medication_changes}}
Appointment: {{appointment_type}} | Specialty: {{provider_specialty}} | Language: {{language}}
```

---

## SECTION 8 -- CONDITION TEMPLATE

### Cholangiocarcinoma (Primary -- CCF Demo Condition)
```json
{
  "id": "cholangiocarcinoma",
  "display_name": "Cholangiocarcinoma (Bile Duct Cancer)",
  "ai_context": "oncology, hepatobiliary, stage 4 bile duct cancer",
  "symptom_categories": [
    { "key": "pain", "label": "Pain", "type": "scale_with_location", "scale": "1-10" },
    { "key": "jaundice", "label": "Jaundice Indicators", "type": "multi_toggle", "options": ["skin yellowing", "eye yellowing", "dark urine", "pale stool"] },
    { "key": "fatigue", "label": "Fatigue Level", "type": "scale", "scale": "1-10" },
    { "key": "appetite", "label": "Appetite and Nausea", "type": "scale_with_boolean", "scale": "1-10", "boolean_label": "vomiting today" },
    { "key": "bowel", "label": "Bowel Changes", "type": "multi_toggle", "options": ["constipation", "diarrhea", "no change"] },
    { "key": "mental_status", "label": "Mental Status", "type": "multi_toggle", "options": ["confusion", "memory difficulty", "normal"] }
  ],
  "trial_filters": { "condition": "cholangiocarcinoma", "phase": ["2","3"], "sources": ["clinicaltrials.gov", "who_ictrp"] },
  "care_team_roles": ["oncologist", "hepatologist", "palliative care", "social worker", "nutritionist"],
  "document_types": ["pathology report", "imaging report", "lab results", "operative note", "oncology consultation", "discharge summary"]
}
```

All other condition templates follow this exact schema. Adding a condition is a data insertion, not a code change.

---

## SECTION 9 -- DESIGN SYSTEM

```typescript
// tailwind.config.ts -- only these colors exist. No hex strings in components.
colors: {
  background: '#F7F2EA', primary: '#2C5F4A', accent: '#C4714A',
  card: '#FFFFFF', text: '#1A1A1A', muted: '#6B6B6B',
  'status-ok': '#2C5F4A', 'status-flag': '#C4714A',
  border: '#E8E2D9', 'pale-sage': '#F0F5F2', 'pale-terra': '#FDF3EE',
}
```

- Typography: Playfair Display (titles, AI headlines only), DM Sans (everything else)
- Spacing: 8px base grid. All spacing values are multiples of 8.
- Touch targets: 48px minimum. Always.
- No dark mode. No toggle. Linen (#F7F2EA) everywhere.
- No em dashes in any string, copy, or comment.
- WCAG 2.1 AA minimum on all interactive elements.

---

## SECTION 10 -- FULL SPRINT ROADMAP

### How Sprints Work
- 2-day sprints. Day 1: build. Day 2: review, test, commit.
- Agent works on branch sprint-[N]-[name] only.
- SPRINT COMPLETE logged in SPRINT_LOG.md, committed, stopped. Samira reviews.
- Samira merges to main, updates Section 11 to next sprint, agent continues.
- 90-99% of build is agent. Samira handles: system prompts, SQL migrations, App Store submissions, credentials, and DECISION REQUIRED flags.

---

### SPRINT 1 -- Four Production Bug Fixes
**Branch:** sprint-1-bug-fixes | **Deadline:** Before May 1

Bug 1: Appointments not saving
Files: app/api/appointments/create/route.ts, components/appointments/AppointmentForm.tsx
Criteria: Appointment saved to DB, audit_log written, success state shown, green in production.

Bug 2: Upload Doc redirecting to chat
Files: components/home/QuickActions.tsx
Criteria: Upload Doc opens document upload flow, not chat, green in production.

Bug 3: Document summaries not linked to documents
Files: app/api/ai/analyze-document/route.ts, app/documents/[id]/page.tsx
Criteria: Every summary queryable by document_id, renders on document detail view, green in production.

Bug 4: Care team email links not working
Files: components/care-team/CareTeamMember.tsx
Criteria: Email tap opens device email client with provider email pre-filled, green in production.

Out of scope: Everything else.

---

### SPRINT 2 -- Streaming AI + TypeScript Audit
**Branch:** sprint-2-streaming-typescript | **Prerequisite:** Sprint 1

1. Migrate all AI routes to Vercel AI SDK streaming. First token under 500ms.
2. Run tsc --noEmit across full codebase. Fix every error. Zero errors.
3. Run npm audit. Log all findings to SPRINT_LOG.md.
4. Verify streaming in production.

---

### SPRINT 3 -- Multi-Tenancy Migration
**Branch:** sprint-3-multi-tenancy | **Prerequisite:** Sprint 2
**NOTE:** This sprint produces SQL only. Agent logs MIGRATION REQUIRED. Samira runs SQL.

1. Write migration: create organizations table with RLS.
2. Write migration: add tenant_id to all user-facing tables.
3. Write migration: update RLS policies to enforce tenant_id.
4. Update all API routes to scope by organization_id.
5. Write and pass cross-tenant rejection test suite.

---

### SPRINT 4 -- Expo Mobile Init + Authentication
**Branch:** sprint-4-auth | **Prerequisite:** Sprint 3 migrations run

1. Initialize Expo project: TypeScript strict, Expo Router, Supabase JS, EAS config.
2. Role-based auth: email/password, magic link, role selection at signup.
3. Role-specific onboarding for all four roles on web and mobile.
4. Caregiver onboarding: patient info, condition, medications, care team. Home pre-populated.
5. Push notification permission request during onboarding with value framing.
6. Session timeout: 30-60 min web, 15 min mobile.
7. Biometric auth option on supported mobile devices.
8. Medical disclaimer modal on first patient profile load. Log to medical_disclaimer_acceptances.
9. Full auth test suite.

Criteria: All four roles can sign up, onboard, and reach populated home on web + iOS simulator + Android emulator.

---

### SPRINT 5 -- Document Intelligence
**Branch:** sprint-5-documents | **Prerequisite:** Sprint 4

1. Document upload: photo in-app, camera roll, PDF from files (web + mobile).
2. File validation: allowed MIME types, max 20MB, MIME spoofing check.
3. Upload to Supabase Storage. Signed URL 3600s expiry.
4. Write metadata to documents table.
5. Trigger streaming Claude API analysis on upload. First token under 500ms. Stub prompt with warning log.
6. Structured output: KEY FINDINGS, MEDICATIONS, NEXT STEPS, QUESTIONS TO ASK.
7. Link analysis to document_id in chat_messages.
8. Document list: by date and type, keyword search.
9. Document detail: metadata + analysis + questions.
10. AI analysis consent flow before first upload. Log to ai_analysis_consents.
11. Tier 1 tests: consent flow, signed URL, audit log.

---

### SPRINT 6 -- Symptom Logging + Visualization
**Branch:** sprint-6-symptoms | **Prerequisite:** Sprint 5

1. Symptom logging for cholangiocarcinoma template. Visual scales and toggles only.
2. Logging completable in under 60 seconds. Enforced by timed E2E assertion.
3. Time-series chart: scrollable, selected period, overlays medication changes + appointment dates.
4. Real-time sync to provider portal.
5. Symptom alerts: write to symptom_alerts when threshold exceeded.
6. Condition template system: UI driven by condition_template_id, not hardcoded.
7. Web + mobile.

---

### SPRINT 7 -- Medication Management
**Branch:** sprint-7-medications | **Prerequisite:** Sprint 6

1. Medication list: dosage, frequency, prescribing provider, refill date.
2. Drug name autocomplete. DECISION REQUIRED: log API choice for Samira (RxNorm/DrugBank/OpenFDA).
3. Interaction flagging on every add/edit. Non-alarmist. Routes to provider. Never says stop.
4. Guardrail test: interaction flag never recommends stopping a medication.
5. Dose logging: given, skipped, unknown. Adherence record built from logs.
6. Refill alerts at 7 days and 3 days (placeholder until Sprint 16 push infrastructure).
7. Web + mobile.

---

### SPRINT 8 -- CCF Demo Environment + PDF Export (Demo Version)
**Branch:** sprint-8-demo | **Prerequisite:** Sprints 5, 6, 7 | **Deadline:** May 5

1. Seed demo environment: Carlos Rivera scenario with documents, multi-week symptoms, medications, care team. Separate Supabase tenant.
2. PDF export (demo version): medication list, symptom table, care team directory, appointment history.
3. PDF renders under 3 seconds.
4. Run all 10 steps of CCF demo smoke test. All must pass.

**CCF DEMO: MAY 8**

---

### SPRINT 9 -- Clinical Trial Discovery (ClinicalTrials.gov)
**Branch:** sprint-9-trials-us | **Prerequisite:** Sprint 8

1. ClinicalTrials.gov API integration.
2. Pre-filtered by condition_template_id and location.
3. Plain language rendering via Claude haiku. Five eligibility requirements. Disqualifying criteria flagged.
4. Direct link to full trial record.
5. trial_saves and trial_cache.
6. Web + mobile.

---

### SPRINT 10 -- WHO ICTRP Integration
**Branch:** sprint-10-who-ictrp | **Prerequisite:** Sprint 9

1. WHO ICTRP API alongside ClinicalTrials.gov.
2. Results merged into single interface.
3. Panama + Mexico trials surfaced for international persona.
4. Spanish trial eligibility translation.
5. trial_cache handles both sources.
6. International persona E2E test.

---

### SPRINT 11 -- Family Updates
**Branch:** sprint-11-family-updates | **Prerequisite:** Sprint 6

1. Generator pulls symptom log, medication record, recent document summaries.
2. Plain language via Claude API. Streaming.
3. English and Spanish simultaneously.
4. Caregiver reviews, edits, sends or copies.
5. WhatsApp formatting: correct encoding, paragraph breaks, no markdown symbols.
6. DECISION REQUIRED: Spanish output requires native speaker medical review before production. Log and wait.
7. Web + mobile.

---

### SPRINT 12 -- Care Team Coordination
**Branch:** sprint-12-care-team | **Prerequisite:** Sprint 4

1. Directory: role, contact info, institution, private caregiver notes.
2. Private notes: not visible to provider. Write access control test.
3. Email links open device email. Phone links open dialer.
4. Single thread per care team member.
5. Document share via thread.
6. Web + mobile.

---

### SPRINT 13 -- Appointment Tracking + Pre-Appointment Prompts
**Branch:** sprint-13-appointments | **Prerequisite:** Sprint 6

1. Calendar: integrates with device native calendar for display, stores in Supabase.
2. Record: provider, location, purpose, prep notes, questions to ask, post-appointment notes.
3. Pre-appointment prep: Claude API generates 3 questions from recent symptoms + medication changes.
4. Prep prompt runs 24 hours before appointment.
5. iOS Calendar and Google Calendar integration via calendar_connections.
6. Web + mobile.

---

### SPRINT 14 -- Provider Portal
**Branch:** sprint-14-provider-portal | **Prerequisite:** Sprints 3, 6, 7

1. Separate login flow for provider role.
2. Patient panel: sorted by most recent symptom activity. care_relationship scoped.
3. Patient detail: symptom chart, medication adherence, caregiver notes flagged for provider.
4. Provider response to flagged notes queues push notification to caregiver.
5. Provider cannot access document upload, family update generator, billing.
6. 403 tests for every route providers cannot access.
7. Tablet-optimized layout (1024px+).
8. Web + mobile (iPad layout).

---

### SPRINT 15 -- Hospital-Grade PDF Export (Full Version)
**Branch:** sprint-15-pdf-full | **Prerequisite:** Sprints 6, 7, 12, 13

1. Replace demo PDF with full clinical documentation standard.
2. Header: institution logo (if white-label), patient name, DOB, date range.
3. Sections: full medication list, symptom log as table + chart, care team directory, appointment history with notes.
4. DM Sans typography, legible at 10pt.
5. Under 3 seconds.
6. Audit log on every export.
7. Web + mobile.

---

### SPRINT 16 -- Push Notifications Infrastructure
**Branch:** sprint-16-push | **Prerequisite:** Sprint 4

1. Expo Notifications for iOS and Android.
2. Web Push API for web.
3. Notification types: medication reminder, refill alert (7d, 3d), appointment reminder (24h, 1h), symptom prompt, provider response.
4. Payload shape and deep link target defined for each type.
5. Fallback for denied permission: in-app banner.
6. Per-type notification preferences.
7. E2E: notification received, tapped, correct screen opens.

---

### SPRINT 17 -- Offline Capability
**Branch:** sprint-17-offline | **Prerequisite:** Sprint 5

1. Service worker (web): cache last known patient state. Stale-while-revalidate.
2. AsyncStorage (mobile): cache profile, symptoms, medications, appointments.
3. App fully readable offline.
4. Symptom log and dose log queued offline, synced on reconnection.
5. Offline indicator: visible, non-alarming, warm tone.
6. E2E: disable network, verify readable, re-enable, verify sync.

---

### SPRINT 18 -- White-Label + Hospital Admin Interface
**Branch:** sprint-18-white-label | **Prerequisite:** Sprint 3

1. Custom subdomain routing per organization.
2. Organization branding: logo upload, primary color override.
3. Admin interface: user management, invite, assign roles, deactivate.
4. Admin dashboard: MAU, active caregivers, document uploads, symptom activity.
5. Admin cannot access patient records directly. Aggregate metrics only.
6. 403 tests for admin accessing patient records.

---

### SPRINT 19 -- Accessibility + i18n Polish
**Branch:** sprint-19-accessibility | **Prerequisite:** All feature sprints

1. WCAG 2.1 AA audit across all screens. Fix every violation.
2. i18n audit: every user-facing string in English and Spanish. No hardcoded strings.
3. Date and time locale formatting: en-US, es-MX, es-PA.
4. Screen reader testing: iOS VoiceOver and Android TalkBack.
5. Tap target audit: every tappable element verified at 48px.

---

### SPRINT 20 -- Security Audit + App Store Submission
**Branch:** sprint-20-launch | **Prerequisite:** All sprints

1. Full npm audit. Zero high/critical vulnerabilities.
2. OWASP Top 10 checklist. Log any findings.
3. Input validation audit: every form field.
4. PHI in logs audit: grep for patient field names in log statements.
5. Environment variable audit: no secrets in client bundles.
6. DECISION REQUIRED: Supabase BAA link for Samira to sign.
7. DECISION REQUIRED: App Store assets for Samira to submit (screenshots, description, privacy policy URL, support URL, review notes).
8. Full E2E suite: Playwright (web), Detox iOS, Detox Android. All passing.
9. Nine-persona test matrix. All passing.

---

### POST-LAUNCH (Sprint 21+)
Sprint 21: ACL grant support -- 10 caregiver user data + feedback documentation
Sprint 22: Additional condition templates (IVF, NICU, pediatric, elderly, chronic illness, post-surgical, mental health)
Sprint 23: Epic FHIR integration (Series A milestone)
Sprint 24: Research data pipeline (IRB, anonymized_exports, Series B prep)
Sprint 25: Performance optimization and load testing

---

## SECTION 11 -- CURRENT SPRINT

**SPRINT 1 COMPLETE: Four Production Bug Fixes**
**Status: ✅ COMPLETE (April 22, 2026)**
**CCF Demo Deadline: June 17, 2026 (8 weeks)**
**Next Sprint Starts: April 25, 2026 (Sprint 2 — Streaming AI)**

### Sprint 1 Summary

All four production bugs fixed, tested, and committed to main.

**Bug 1: Appointments Not Saving** ✅
- Created `app/api/appointments/create/route.ts` with auth, insertion, audit_log write
- Created `components/appointments/AppointmentForm.tsx` with success state
- Test passing: appointment created → audit_log written → user sees confirmation

**Bug 2: Upload Doc Routing to Wrong Page** ✅
- Updated `components/home/quick-actions.tsx` href from "/documents" to "/documents/upload"
- Test passing: quick action opens upload flow, not chat

**Bug 3: Document Summaries Not Linked to Documents** ✅
- Created `app/api/ai/analyze-document/route.ts` with document_id explicit linking via .eq("id", documentId)
- Summaries now queryable by document_id, render on document detail view
- Test passing: summary linked to source document

**Bug 4: Care Team Email Links Not Working** ✅
- Created `components/care-team/CareTeamMember.tsx` with mailto: and tel: links
- Test passing: email link opens device email client, phone link opens dialer

**Test Status: 4/4 passing. npm audit: clean. TypeScript: zero errors.**

### Critical Path Dependencies

**Sprint 2 (Streaming AI) — Starts April 25**
- Prerequisite: Sprint 1 ✅
- All AI routes must stream via Vercel AI SDK
- First token under 500ms (required for CCF demo)
- This blocks: Sprints 5, 6, 9, 10, 11, 14, 15 (all AI features)

**Sprint 3 (Multi-Tenancy) — Starts May 5**
- Prerequisite: Sprint 2 complete
- organizations table, tenant_id migration, RLS updates
- This blocks: Sprints 14, 18 (provider portal, white-label, hospital features)

---

## SECTION 12 -- KNOWN ISSUES AND CONSTRAINTS

### Active Technical Debt
1. AI not streaming -- Sprint 2
2. Single-tenant schema -- Sprint 3
3. No push notifications -- Sprint 16
4. WHO ICTRP missing -- Sprint 10
5. No offline capability -- Sprint 17
6. Basic PDF only -- Sprint 15

### Open DECISION REQUIRED Items
- Drug interaction API: RxNorm (free, NIH), DrugBank (paid), or OpenFDA
- Spanish family update output: requires native speaker medical review before production
- Supabase BAA: must be signed before launch
- Apple and Google developer accounts: must be opened immediately

### Architecture Constraints
- Clarifer Supabase project is separate from all other projects. Confirm project ref before any query.
- Never modify table schema without Samira approval and manual SQL execution.
- SUPABASE_SERVICE_ROLE_KEY use must have an explanatory comment every time.

---

*This file is maintained by Samira. Every sprint ends with an update to Section 11 and additions to Section 12. Architecture, stack, and design sections update only when those things change.*
