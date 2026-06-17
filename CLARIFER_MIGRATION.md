# CLARIFER MIGRATION AND FLUTTER REBUILD
Version 1.0 -- June 16, 2026
This document covers the full infrastructure migration to Hetzner and the Flutter frontend rebuild.
Read alongside CLARIFER_MASTER.md and the Figma design file.

---

# PART 1: WHY WE ARE MIGRATING

The current stack uses Supabase for database, auth, and storage. Supabase Auth has been unreliable since May 26, 2026 -- three weeks of continuous instability that blocked caregivers from using the platform and caused a missed CCF demo. The decision to migrate was made June 8, 2026.

Target: zero Supabase dependencies. Own the entire stack.

What is being replaced:
- Supabase Auth -- replaced by Keycloak on Hetzner
- Supabase PostgreSQL -- replaced by PostgreSQL 16 on Hetzner
- Supabase Storage -- replaced by MinIO on Hetzner

What stays:
- Next.js frontend on Vercel
- Anthropic claude-sonnet-4-6
- Brevo email
- Upstash Redis for rate limiting
- Vercel hosting

---

# PART 2: HETZNER SERVER

## Server details

Provider: Hetzner Cloud
Server name: clarifer-prod-1
IP: 87.99.152.26
Current spec: CPX11, 2 vCPU, 2GB RAM, 40GB disk (needs upgrade before Keycloak)
Target spec: CPX21, 3 vCPU, 4GB RAM, 80GB disk
OS: Ubuntu 24.04 LTS
Location: Ashburn, VA (us-east, matched to Vercel iad1 region)
Backups: enabled
Monthly cost at CPX21: $22.99

## First step before any installation

Upgrade from CPX11 to CPX21 in the Hetzner console. Keycloak requires at minimum 1.5GB RAM. CPX11 has 2GB total which is not enough when running Postgres and MinIO simultaneously.

Hetzner console: clarifer-prod-1 -> Rescale tab -> select CPX21 -> confirm. Takes 2 minutes. No data loss.

## Software stack on Hetzner

PostgreSQL 16: the database. Same SQL as Supabase, direct connection, no vendor layer.
PgBouncer: connection pooler in front of Postgres. Handles Vercel serverless connection spikes.
Keycloak: open-source identity provider. Replaces Supabase Auth. Handles email/password, Google OAuth, JWT issuance.
MinIO: S3-compatible object storage. Replaces Supabase Storage. Document uploads go here.
Nginx: reverse proxy. Routes traffic to Keycloak (port 8080) and MinIO (port 9000).
Let's Encrypt (Certbot): free SSL certificates. Auto-renews.
Fail2ban: blocks brute force SSH and auth attempts.
UFW firewall: allows only ports 22 (SSH), 80 (HTTP), 443 (HTTPS). Postgres and Keycloak are not exposed to the public internet -- Vercel connects via secure internal API.

## HIPAA posture on Hetzner

Hetzner does not sign BAAs. Current operating posture: Clarifer is a personal care coordination tool for caregivers, not a HIPAA covered entity, until BAA infrastructure is funded.

Hetzner is ISO 27001 certified. Data is encrypted in transit (TLS) and at rest (disk encryption). Samira owns the server. No vendor has access.

When the first hospital contract arrives: PHI-touching components move to AWS (BAA already signed). Non-PHI workloads stay on Hetzner.

---

# PART 3: INFRASTRUCTURE MIGRATION SESSIONS

Six sessions. Do them in order. Do not skip steps.

## What Samira does (7 things total, nothing else)

1. Upgrade server to CPX21 in Hetzner console before Session 1.
2. Run SSH commands Claude Code provides, one at a time, paste output back.
3. Export Supabase database with pg_dump (Claude Code provides the exact command).
4. Configure Google OAuth credentials in Google Cloud Console (Claude Code walks you through it, 15 minutes).
5. Update Vercel environment variables after Session 4 (Claude Code provides the new values).
6. Verify the full product works in your browser after Session 6.
7. Cancel Supabase subscription.

## Session 1: Server hardening

Goal: locked-down production server with SSH key authentication and firewall.

What Claude Code does:
- Creates non-root user with sudo access
- Sets up SSH key authentication and disables password login
- Configures UFW firewall (allow 22, 80, 443 -- deny everything else)
- Installs fail2ban with SSH protection
- Enables automatic security updates
- Installs Nginx

Estimated time: 45 minutes.
You paste SSH commands Claude Code gives you, paste output back after each one.

## Session 2: PostgreSQL 16 and PgBouncer

Goal: your database running on Hetzner with all production data imported.

What Claude Code does:
- Installs PostgreSQL 16
- Creates clarifer database and clarifer_app user
- Runs all migrations in order from supabase/migrations/
- Configures PgBouncer with transaction pooling
- Provides the pg_dump command for you to run against Supabase
- Imports your data after you paste the dump file to the server
- Verifies row counts match exactly for every table

Estimated time: 60 minutes.

## Session 3: Keycloak

Goal: working auth that replaces Supabase Auth completely.

What Claude Code does:
- Installs Keycloak (Docker or standalone, Claude Code decides based on memory)
- Creates clarifer realm
- Configures email/password authentication
- Configures Google OAuth (Claude Code tells you exactly what to click in Google Cloud Console)
- Creates demo@clarifer.com account with correct role
- Tests login end to end and confirms JWT token is issued correctly
- Configures Nginx reverse proxy for Keycloak

What you do: configure Google OAuth in Google Cloud Console when Claude Code tells you.

Estimated time: 60 to 90 minutes.

## Session 4: Next.js API migration

Goal: the existing Next.js app points at Hetzner, not Supabase.

What Claude Code does:
- Updates all database connection strings in Vercel env vars (provides new values)
- Updates auth verification middleware to validate Keycloak JWTs instead of Supabase JWTs
- Updates the Supabase client instantiation to use direct Postgres connection
- Runs the full test suite -- zero new failures allowed
- Updates lib/supabase/server.ts and middleware.ts

What you do: update Vercel environment variables with values Claude Code provides.

Estimated time: 60 minutes.

## Session 5: MinIO

Goal: document storage on Hetzner, no Supabase Storage.

What Claude Code does:
- Installs MinIO on Hetzner
- Creates clarifer-documents bucket
- Updates all document upload routes to use MinIO instead of Supabase Storage
- Migrates existing documents from Supabase Storage to MinIO
- Configures Nginx to proxy MinIO API
- Tests document upload and retrieval end to end

Estimated time: 45 minutes.

## Session 6: Verification and Supabase cancellation

Goal: every feature verified, Supabase cancelled.

What Claude Code does:
- Runs full test suite against production
- Tests demo account login end to end
- Tests document upload and AI analysis
- Tests family update generation
- Tests CCF dashboard
- Confirms all 375 tests passing

What you do: walk through the full demo script in your browser. When satisfied, cancel Supabase.

Estimated time: 30 minutes verification, then you cancel Supabase.

---

# PART 4: FLUTTER REBUILD

## Why Flutter

Single codebase for iOS, Android, and web. The current Next.js app has parity issues between web and mobile that Flutter eliminates. Flutter renders pixel-identical UI across all platforms. Claude Code knows Dart well. The rebuild was validated in DartPad in June 8 session.

## What stays the same

The Next.js API (all /api/ routes) remains as the backend during and after the Flutter rebuild. Flutter replaces only the frontend. The database, auth (Keycloak), storage (MinIO), and all business logic stay unchanged.

## Design reference

Figma file key: RvUccT5yRPIMLMAYySg8W2
Handoff node: 26:2
URL: https://www.figma.com/design/RvUccT5yRPIMLMAYySg8W2/Clarifer-Design-System---Screen-Reference?node-id=26-2

Screens confirmed designed in Figma (Phase 0 to 2): all caregiver core screens with hover states, loading skeletons, and empty states.

Screens missing that must be designed before their sessions:
- Login screen
- Clinical trials detail
- Document AI output
- HQ screens

## Master documents for Flutter sessions

Google Drive folder: Clarifer Flutter Migration

FLUTTER_BRAIN.md: 17 rules, design tokens, session templates, HIPAA rules, AI guardrails. Claude Code reads this at the start of every Flutter session.

Session Plan: all 47 sessions with exact screen names, file paths, API contracts, and verification gates.

Infrastructure Migration Plan: the 6-session Hetzner migration above in detail.

Sprint Log: Claude Code fills in after every session.

## 47 sessions across 6 phases

### Phase 0: Foundation (5 sessions)

F-01: Flutter project setup. Folder structure, pubspec.yaml, design token imports from Figma, base theme.
F-02: API client. Dart HTTP client, Keycloak JWT handling, request/response models matching exact API shapes.
F-03: Navigation. GoRouter setup, all routes defined, auth guard, deep links.
F-04: Design tokens. All colors, typography, spacing from CLARIFER_MASTER.md implemented as Dart constants.
F-05: Shared components. Button, card, input, badge, avatar, empty state, error state, skeleton loader.

### Phase 1: Auth (6 sessions)

A-01: Login screen. Email/password form, Google OAuth button, forgot password link. Connected to Keycloak.
A-02: Signup screen. Name, email, password, terms checkbox, Google OAuth. Creates Keycloak account.
A-03: Email verification. Verify screen, resend code, confirmation.
A-04: Onboarding. "Who are you caring for?" -- patient first name and language. Single screen. POST /api/patients/create.
A-05: Session management. JWT storage (flutter_secure_storage), refresh token handling, 30-minute inactivity timeout, sign out.
A-06: Account locked and MFA. Locked state screen, MFA challenge screen, recovery code flow.

### Phase 2: Core screens (10 sessions)

C-01: Home screen. "CARING FOR [name]" hero, priority card, family update button, care timeline, CCF card, bottom nav.
C-02: Symptom log -- list view. Log entries with severity color, date, summary. Empty state: warm prompt to log.
C-03: Symptom log -- add form. All 7 sections. Single long scroll. Autosave every 30 seconds. Infection signs warning.
C-04: Medications list. Medication cards, mark taken, adherence bar. Optimistic UI with undo.
C-05: Medications add. Name autocomplete against FDA drug list, dose, frequency. Drug interaction detection.
C-06: Documents list. Cards with AI analyzed badge, category filter pills, upload button.
C-07: Document detail. AI summary, plain language explanation, share button, view original.
C-08: Document upload. Native file picker, progress bar, multipart upload to MinIO, analysis trigger.
C-09: AI chat. Message bubbles, streaming response, suggested questions, disclaimer above input, blinking cursor during generation.
C-10: Notifications. List, mark read, unread badge on tab bar.

### Phase 3: Extended features (8 sessions)

E-01: Clinical trials list. Biomarker filters, search, trial cards with save and discuss buttons.
E-02: Clinical trials detail. Full description, eligibility, site locations, contact info, save, share.
E-03: Care team list. Provider cards with phone, email, quick messages.
E-04: Care team add. Name, role, phone, email, NPI. Sends invite email via Brevo.
E-05: Family update composer. Format toggle (WhatsApp/email), language toggle (EN/ES), generate button, streaming output, copy button with friction label.
E-06: Family update history. Past updates list with date, format, preview.
E-07: Emergency card. Medications with dosage and frequency, allergies, blood type, primary care, caregiver contact. Offline capable. QR code to public URL.
E-08: Patient hub. Insurance waterfall, coverage waterfall, authorization wallet, income cliff alert.

### Phase 4: Institutional (6 sessions)

I-01: CCF dashboard. Aggregate data only. Total caregivers, active this month, symptom severity trend, top symptoms, adherence. No individual PHI.
I-02: Provider portal -- patient list. Paginated list with alert status, last activity, adherence.
I-03: Provider portal -- patient detail. 7-day symptom trend chart, medication list, provider notes with timestamps. Notes not visible to caregivers.
I-04: Hospital admin -- outcomes. Readmission rate, medication adherence, caregiver burden. Aggregate only.
I-05: Hospital admin -- white label. Display name, tagline, logo upload, accent color. Live preview.
I-06: Hospital admin -- caregiver list. Paginated table, aggregate data only, no individual PHI.

### Phase 5: Validation (5 sessions)

V-01: Full integration tests against Hetzner stack. Every API endpoint tested with real data.
V-02: Playwright E2E suite. All core caregiver flows automated.
V-03: Real device testing on iOS. TestFlight build, full flow verification on physical device.
V-04: Real device testing on Android. Play Store internal testing build, full flow verification.
V-05: Performance audit. App startup time, first meaningful paint, API response times. All under thresholds.

### Phase 6: Launch (7 sessions)

L-01: Flutter analyze clean. 0 errors, 0 warnings across full codebase.
L-02: Full test suite. All unit tests, widget tests, integration tests passing. No skipped tests.
L-03: App Store build -- iOS. Xcode archive, TestFlight to App Store. Apple Developer Team ID: PV8B2R8Y22.
L-04: Play Store build -- Android. Signed APK/AAB, Play Store submission.
L-05: Flutter web deploy. Build, deploy to Vercel or Hetzner nginx. clarifer.com serves Flutter web.
L-06: Demo account reset. Fresh realistic data for Carlos Rivera. 5 symptoms, 3 medications, 2 documents, 1 care team member, 1 family update.
L-07: Soft launch. Brevo waitlist campaign sent. Substack post published. LinkedIn post published.

---

# PART 5: SESSION RULES FOR FLUTTER BUILD

Every Flutter session starts with:
Read docs/FLUTTER_BRAIN.md in full. List all 17 rules. Run Step 0. Report. Then execute.

Step 0 for Flutter:
  git branch --show-current
  git log --oneline -5
  git status --short
  flutter analyze 2>&1 | tail -5
  flutter test 2>&1 | tail -5

Definition of done for Flutter:
- flutter analyze returns 0 errors, 0 warnings
- flutter test -- all passing, no new failures
- Screen matches Figma exactly -- Samira verifies in a real device or emulator
- All touch targets 48px minimum
- No hex color strings -- design tokens only
- No hardcoded strings -- all copy in constants file

One session. One screen. Fully verified. Then next session.

---

# PART 6: WHAT MAKES $1M POSSIBLE

The infrastructure migration is not just about uptime. It is about what becomes possible after:

The product becomes demonstrable to CCF on any rescheduled date without risk of auth failure.

The hospital sales cycle shortens because the platform runs on infrastructure Samira fully controls. No dependency on a third-party that can go down during a procurement demo.

The research data pipeline becomes credible. Academic medical centers and pharma companies do due diligence on data infrastructure. Owning your own Postgres with PgBouncer and a documented schema is more credible than "we use Supabase."

The grant applications strengthen. The ACL grant and NIA SBIR both evaluate technical infrastructure. Self-hosted, owned infrastructure with documented security posture is a stronger narrative than managed SaaS.

The cost structure becomes permanent. $22.99/month is the infrastructure bill forever, regardless of how many caregivers use the platform. Supabase scales costs with usage. Hetzner does not.

---

Clarifer Corp -- Confidential -- clarifer.com
Last updated: June 16, 2026
