# CLARIFER MASTER DOCUMENT
Version 1.1 -- June 16, 2026
Start every new Claude project session by pasting this entire document.
This is the single source of truth for the company, product, codebase, infrastructure, and migration plan.

---

# PART 1: THE COMPANY

## Who we are

Clarifer is a caregiver intelligence platform. Free for caregivers. Always. Revenue comes from hospitals and research institutions.

The founding insight: on May 22, 2026, Samira Esquina spent one full day from Los Angeles navigating the US healthcare system for a family member in New York. In one day she identified insurance coverage, discovered Medicare does not cover home aides, submitted a Medicaid application, obtained a CIN number, identified a home care agency, faxed a medical power of attorney, and coordinated with three family members across two coasts. There was no tool built for what she was doing. She built one.

The product principle: Clarifer holds the caregiving logic so the caregiver can rest.

## Legal entity

Company name: Clarifer Corp. Spelled C-L-A-R-I-F-E-R. One word.
Entity type: Delaware C-Corp
Incorporated: April 22, 2026
Incorporated via: every.io
Domain: clarifer.com
Primary email: samira.esquina@clarifer.com
Team email: team@clarifer.com
Substack: @sequinsam

## People

Samira Esquina -- Founder and CEO. Final decision-maker on all product, technical, and business decisions. Background in healthcare technology and AI. Based in Los Angeles, CA. Runs all git operations from PowerShell on Windows.

Michael Barbara -- Co-Founder. Owns growth, partnerships, caregiver recruitment, and business development. No coding background. No authority over technical or product decisions. Email: michael.barbara@clarifer.com. Milestone-vested equity.

## Key relationships

Cholangiocarcinoma Foundation (CCF) -- founding partner community. Primary source for early caregiver research cohort.
- Melinda Bachini -- Chief Patient Officer, long-term CCA survivor
- Lourdes Rocha-Nussbaum -- Director of Patient Services, former caregiver
- Amanda Nottke -- Director of Research

Clinical advisor: James Whitfield -- reviews all clinical content. Must sign off on clinical feature data.
Academic contacts: Dr. Saeed Sadeghi and Dr. Slamon at UCLA oncology.
AI contacts: Tucker Stephenson at Tempus AI.
Latin America distribution: Ximena de Alba at Endeavor Aguascalientes, Mexico.

---

# PART 2: THE BUSINESS MODEL

## Revenue

Free for caregivers. Always. No ads. No freemium upsell. No paywalls.

Revenue stream 1: Hospital licensing. $150,000 to $300,000 per hospital per year. Sales cycle is 12 to 18 months. Target buyers are Chief Nursing Officers and VPs of Patient Experience.

Revenue stream 2: Research data partnerships. De-identified, aggregated caregiver data licensed to academic medical centers and pharmaceutical companies.

Revenue stream 3: Caregiver Support Fund. Minimum 5 percent of gross research licensing revenue flows back to caregivers as direct financial assistance. Transportation costs, respite care, medication costs, stipends. Governed by a Caregiver Advisory Committee. Admin costs capped at 10 percent. Annual public reporting. This is a structural commitment, not a marketing feature.

## Realistic path to $1M revenue

Months 1 to 6: Zero revenue. Target 500 active caregivers, 40 percent 90-day retention. This is the metric that unlocks everything else.

Months 6 to 12: First research data licensing agreement with an academic medical center, likely facilitated through CCF. Range $50,000 to $150,000 for a 12-month pilot dataset.

Months 12 to 18: First hospital pilot. 90-day outcomes-based, 50 to 100 caregivers, one service line. Range $50,000 to $100,000.

Months 18 to 24: Second hospital contract plus first full annual research licensing agreement. Combined $300,000 to $600,000. $1M total revenue is achievable by month 24 with two hospital licenses and one research partnership.

## Active grants

ACL Caregiver AI Challenge -- Phase 1 due July 31, 2026. Up to $100K base plus $50K merit. Requires: 10 caregivers with documented feedback (Michael's responsibility by July 15), FHIR interoperability, documented caregiver input, evaluation plan.

NIA SBIR -- September 5, 2026 deadline. Requires academic or clinical co-investigator.

SAM.gov UEI registration: required for ACL grant. Michael handles.

---

# PART 3: THE PRODUCT

## What it does

The platform is condition-agnostic. It speaks to the caregiving experience, never to diagnoses or medical conditions.

Core features confirmed built and working as of June 2026:
- Document upload and AI analysis in plain language
- AI chat with patient context and guardrails
- Symptom log with 7 structured sections and severity tracking
- Medication management with adherence tracking and drug interaction detection
- Clinical trials with real ClinicalTrials.gov API data and biomarker filtering
- Care team directory with quick-message templates
- Family update generator, streaming, English and Spanish
- Offline-capable emergency card for first responders
- Notifications
- CCF dashboard with aggregate de-identified research data
- Provider portal with patient notes
- Hospital admin command center at /hq
- Appointments tracking
- Patient hub with insurance waterfall

## User roles

Four roles: Caregiver (primary), Patient, Provider (physician/nurse), Hospital Administrator.

## Design system (locked, never change)

Colors -- web uses CSS variables, mobile uses lib/design-tokens.ts, never raw hex in components:
- --background: #F7F2EA (warm linen)
- --primary: #2C5F4A (dark sage)
- --accent: #C4714A (terracotta)
- --card: #FFFFFF
- --text: #1A1A1A
- --muted: #6B6B6B
- --border: #E8E2D9
- --pale-sage: #F0F5F2
- --pale-terra: #FDF3EE
- severity-high: #E24B4A
- severity-medium: #BA7517
- severity-ok: #0F6E56

Exception: lib/pdf/hospital-grade-export.tsx may use hex directly.

Fonts: Playfair Display for patient name hero and page titles. DM Sans for everything else.
Touch targets: 48px minimum on all tappable elements. Tab bar active indicator 4px minimum.
No dark mode. No blank empty states. No hex in components.

## Copy rules -- non-negotiable, applies to every file and every response

- NEVER use "serious illness" -- not in UI, marketing, emails, or any document
- Never reference illness, disease, or medical conditions in caregiver-facing copy
- No em dashes anywhere -- not in code, not in copy, not in AI responses
- No exclamation points in professional contexts
- No "journey," "space," "passionate about," "excited to share," "genuinely," "honestly"
- Patient first name only after initial greeting
- CCF card headline: always "Don't know where to start?" -- never "Are you newly diagnosed?"
- Infection signs warning: "Call 911 or go to the emergency room immediately." -- never "call the care team"
- Company name is always Clarifer. Spelled C-L-A-R-I-F-E-R.
- Free for caregivers. Always. -- not "free to use" or "at no cost"
- Logo: lighthouse with Rod of Asclepius. Never an anchor. Never removed from About page.
- Founding story: About page only. Never on the homepage.
- Cassini Design Group LLC must not appear anywhere. It is no longer the operating entity.
- Latin American Spanish: "agregar" not "añadir," "toca" not "haz clic," "correo" not "email"

## Demo account

Email: demo@clarifer.com
Password: ClariferdDemo2026!
Patient: Carlos Rivera
Patient ID: 5fc76836-e2f7-47b6-a394-ddccef619c95
Organization ID: fa731120-304a-48ba-889a-3be6431454f3
Appointments: Oncology follow-up June 18, Palliative care June 18 14:00
Medications: Omeprazole, Lorazepam, Ondansetron, Cisplatin, Gemcitabine
Care team: Dr. Sarah Chen (Oncology, Primary), Dr. Marcus Webb (Palliative)

---

# PART 4: THE CODEBASE

## Repository and hosting

Repository: github.com/Sesquina/clarifer (public)
Hosting: Vercel, auto-deploys on push to main
Working directory: C:\Users\esqui\clarifer (Windows PowerShell)
WSL path: /mnt/c/Users/esqui/clarifer
Claude Code runs in WSL. All git push commands run from PowerShell.

## Tech stack (current)

Web: Next.js 16 (App Router), TypeScript strict, Tailwind CSS 4, React 19
Mobile: Expo React Native in apps/mobile/
Database: Supabase PostgreSQL (project lrhwgswbsctfqtvdjntr, us-east-1) -- BEING REPLACED
Auth: Supabase Auth -- BEING REPLACED with Keycloak
Storage: Supabase Storage -- BEING REPLACED with MinIO
AI: Anthropic claude-sonnet-4-6, server-side only, standardized across all routes
Email: Brevo SMTP, smtp-relay.brevo.com:587, sender team@clarifer.com
Rate limiting: Upstash Redis, US-East-1 (iad1, matched to Vercel region)
PDF: @react-pdf/renderer
Error monitoring: Sentry
Analytics: PostHog (phc_BYx29TiALCuAcDBYC2HGgMwq7HQ626SMz7zHEaGDCp8o), Google Analytics (G-PNWK59ZSJW)
DNS and email: Hostinger
Apple Developer Team ID: PV8B2R8Y22

## What is actually built (confirmed from codebase)

Web pages in app/:
- / (landing page)
- /login, /signup, /update-password, /forgot-password
- /onboarding, /onboarding/complete
- /home
- /documents, /documents/[id], /documents/upload
- /log (symptom log)
- /chat
- /notifications
- /profile
- /tools, /tools/medications, /tools/trials
- /care-team
- /patients/[id], /patients/[id]/appointments, /patients/[id]/care-team
- /patients/[id]/emergency-card, /patients/[id]/family-update, /patients/[id]/trials
- /patients/new
- /provider, /provider/patients/[id]
- /ccf-dashboard, /ccf
- /hq (internal command center, allowlist only), /hq/agents, /hq/board, /hq/ccf, /hq/content, /hq/roadmap, /hq/sessions, /hq/sprints
- /about, /promise, /privacy, /privacy-notice, /terms, /security, /disclaimer, /data
- /waitlist, /download, /research

Mobile screens in apps/mobile/app/:
- Auth: login, signup, forgot-password, reset-password, verify-email, role-select
- Home: caregiver, patient, provider, admin
- App: care-team, chat, documents, log, medications, notifications, patients
- Provider portal, onboarding, modals

API routes confirmed in app/api/:
- /api/health
- /api/auth/demo-login, /api/auth/reset-password
- /api/ai/analyze-document, /api/ai/family-update, /api/ai/trial-summary
- /api/appointments, /api/appointments/[id]
- /api/biomarkers, /api/biomarkers/[id]
- /api/care-team, /api/care-team/create, /api/care-team/[id]
- /api/chat
- /api/documents/upload, /api/documents/[id], /api/documents/[id]/summary
- /api/export, /api/export/pdf
- /api/family-update, /api/family-update/generate
- /api/log/create
- /api/medications/create, /api/medications/[id], /api/medications/[id]/update
- /api/notifications, /api/notifications/[id]/read
- /api/patients/create, /api/patients/[id]
- /api/provider/patients, /api/provider/patients/[id], /api/provider/patients/[id]/notes
- /api/summarize, /api/symptoms, /api/symptom-summary
- /api/trials, /api/trials/search, /api/trials/save, /api/trials/saved
- /api/trial-saves/upsert, /api/trial-saves/delete
- /api/upload, /api/users/disclaimer, /api/waitlist
- /api/hq/* (internal admin routes, allowlist only)

## Database migrations (confirmed existing in supabase/migrations/)

Applied to production:
- 20260423000006_full_schema_baseline.sql
- 20260423000007_appointments_checklist.sql
- 20260423000008_emergency_card.sql
- 20260423000009_biomarkers.sql
- 20260423000010_newly_connected.sql
- 20260423000011_fix_users_rls_recursion.sql
- 20260424000005_command_center.sql
- 20260424000006_trials_family.sql
- 20260428000002_add_terms_accepted_at.sql
- 20260430000001_handle_new_user_trigger.sql
- 20260522000001_add_disclaimer_accepted.sql
- 20260522000002_add_language_preference.sql
- 20260526000001_account_deletion_cascade.sql
- 20260527000002_who_ictrp_seed.sql
- 20260530000001_waitlist_fields.sql
- 20260604000001_backfill_missing_users.sql

May not yet be applied to production (run in Supabase SQL Editor before cancelling Supabase):
- 20260428000003_who_ictrp_mirror.sql
- 20260428000004_care_team_directory.sql
- 20260428000005_appointments_action_items.sql
- 20260428000006_provider_portal.sql

## Vercel environment variables (Production required)

ANTHROPIC_API_KEY -- document analysis and chat. Missing = analysis broken.
NEXT_PUBLIC_SUPABASE_URL -- public
NEXT_PUBLIC_SUPABASE_ANON_KEY -- public
SUPABASE_SERVICE_ROLE_KEY -- secret, server-side only, never NEXT_PUBLIC_
UPSTASH_REDIS_REST_URL -- secret
UPSTASH_REDIS_REST_TOKEN -- secret
NEXT_PUBLIC_SITE_URL -- must be https://clarifer.com in production
BREVO_API_KEY -- secret
INTERNAL_API_SECRET -- secret, .env.local and Vercel Production only
INTERNAL_PASSCODE -- secret, protects /hq route

## Figma design reference

File key: RvUccT5yRPIMLMAYySg8W2
Handoff page node: 26:2
URL: https://www.figma.com/design/RvUccT5yRPIMLMAYySg8W2/Clarifer-Design-System---Screen-Reference?node-id=26-2
All Phase 0-2 caregiver screens are confirmed present in the handoff page.
Missing designs that must be created before their Flutter sessions: login screen, clinical trials detail, document AI output, HQ screens.

## Internal command center

URL: clarifer.com/hq
Auth: Google OAuth with hardcoded two-email allowlist
Allowed users: samira.esquina@clarifer.com, michael.barbara@clarifer.com
Michael's view: growth data only, no PHI

---

# PART 5: TARGET INFRASTRUCTURE

## The new stack

Hetzner server: clarifer-prod-1 at 87.99.152.26, CPX11 (needs upgrade to CPX21 before Keycloak install), Ubuntu 24.04, Ashburn VA (us-east), backups enabled, $22.99/month at CPX21.

PostgreSQL 16 with PgBouncer: replaces Supabase database
Keycloak: replaces Supabase Auth. Email/password and Google OAuth.
MinIO: replaces Supabase Storage. S3-compatible API.
Let's Encrypt: free SSL certificates.

Total infrastructure cost after migration: $22.99/month Hetzner + Anthropic API usage. No Supabase.

## HIPAA posture

Operating posture: personal care coordination tool for caregivers. Not currently a HIPAA covered entity. Hetzner does not sign BAAs. When the first hospital contract arrives, PHI-touching components move to AWS (BAA already signed). Hetzner is ISO 27001 certified. Data is encrypted in transit and at rest. Samira owns the server.

# PART 6: HIPAA RULES

- Audit log on every PHI read, write, update, delete
- Database service role key server-side only, never client-side, never in NEXT_PUBLIC_ variables
- No patient data in any log, prompt, or public variable
- No patient names or diagnoses in Anthropic prompts -- anonymized or summarized only
- Session timeout at 30 minutes inactivity
- Every new table gets RLS on creation
- organization_id filter on every query touching patient data
- If a HIPAA gap is found, stop the session and report it

Every Claude API system prompt must include: "You are a caregiver support assistant. You help families understand medical information and coordinate care. You never diagnose. You never recommend changing medications or dosages. You never speculate on prognosis or survival. You never comment on psychiatric medications. Always recommend consulting the care team for clinical decisions."

---

# PART 10: GIT AND SESSION RULES

## Git workflow

All git push commands run from PowerShell on Windows. Not WSL. WSL cannot push to GitHub.
Claude Code writes to sprint branches only. Never pushes to main.
Samira reviews commits and merges to main from PowerShell.
Branch format: fix/[description] or feat/[description]
Merge command: git merge --no-ff
Vercel auto-deploys on push to main.

Samira merges to main:
  git checkout main
  git merge [branch] --no-ff
  git push origin main

## Definition of done (all must be true before any commit)

- npx tsc --noEmit returns 0 new errors
- npx vitest run -- all passing, no new failures
- Feature works in a real browser on desktop and mobile
- Samira has verified it in a real browser
- No PHI in any log line

## Starting a Claude Code session

Paste this at the start of every Claude Code session:

Read docs/CLARIFER_BRAIN.md in full.
Confirm you have read it by listing the 10 rules back to me.
Then run Step 0:

git branch --show-current
git log --oneline -5
git status --short | head -20
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l
npx vitest run 2>&1 | tail -5

Report all results. Do not write any code. Wait for my instructions.

## What Claude Code never does

- Pushes to main
- Executes SQL or runs database migrations
- Hardcodes secrets or API keys
- Fixes bugs it was not assigned to fix
- Expands scope beyond the assigned task
- Reports a task as done before tsc and vitest pass

---

# PART 9: KEY DATES AND MILESTONES

June 16, 2026: CCF demo rescheduled. Target within 2 weeks.
July 15, 2026: Michael delivers 10 caregivers with documented feedback for ACL grant.
July 31, 2026: ACL Caregiver AI Challenge Phase 1 deadline.
September 5, 2026: NIA SBIR deadline.
Q3 2026: FHIR/Epic SMART on FHIR proof-of-concept.
Q3 2026: Public Benefit Corporation conversion.
Q3 2026: First hospital pilot, 90-day outcomes-based, 50 to 100 caregivers.
2027: Hospital licensing revenue target $150,000 to $300,000 per institution.

---

Clarifer Corp -- Confidential -- clarifer.com
Last updated: June 16, 2026
