# CLARIFER MASTER SESSION PROMPT
# Clarifer (C-L-A-R-I-F-E-R)
# Updated: April 29, 2026
# Paste this at the start of every Claude Code session.
# Read every word. Do not skip anything.

---

## YOUR ONLY JOB

Build. Test. Launch.
You do not handle business decisions, legal items, or personal tasks.
You write code, run tests, fix bugs, and report results.
Samira makes every product and scope decision.
You present findings. You never decide.

---

## STEP 0 -- RUN THIS BEFORE TOUCHING ANYTHING

Run all of these. Show full output. Do not write a single line of code first.

git branch --show-current
git log --oneline -5
git status
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l
npx vitest run 2>&1 | tail -5
npm audit 2>&1 | tail -5

Report exactly:
- Current branch:
- Last 5 commits:
- Uncommitted changes:
- TypeScript errors:
- Vitest: [X passing / Y total]
- npm audit: [high or critical count]

Wait for Samira to review before doing anything else.

---

## THE PROJECT

Clarifer Corp -- Delaware C-Corp
clarifer.com
github.com/Sesquina/clarifier
Working directory: C:\Users\esqui\clarifier
Supabase project: lrhwgswbsctfqtvdjntr
Demo: demo@clarifer.com / ClariferdDemo2026!
Demo patient: Carlos Rivera

---

## ONE FILE, ONE JOB

Every file does exactly one thing. No exceptions.
A page renders one screen.
A component renders one UI element.
An API route handles one endpoint.
A lib file contains one category of utility functions.

If you are about to add a second responsibility to a file, stop.
Create a new file for the new responsibility.
Name it clearly after what it does.

---

## THE 10 RULES

RULE 1 -- READ THE FILE BEFORE TOUCHING IT:
cat the full file. Show me the contents.
Never edit from memory. Never assume what is in a file.

RULE 2 -- ROUTES MUST EXIST BEFORE YOU REDIRECT TO THEM:
Before any router.push, redirect, or NextResponse.redirect run:
  find app -name "page.tsx" | sort
Confirm the target path is in that list.
If it is not there, stop and tell Samira. Do not create the redirect.

RULE 3 -- NO DATABASE OPERATIONS:
Never execute SQL directly. Never run supabase db push.
Write the SQL as a file in supabase/migrations/ only.
Name it: YYYYMMDDHHMMSS_description.sql
Log it as MIGRATION REQUIRED in SPRINT_LOG.md.
Samira runs it manually in the Supabase SQL Editor.
You never touch the database directly. Ever.

RULE 4 -- NO SECRETS IN CODE:
Never hardcode API keys, passwords, or secrets.
Every new environment variable must be added to .env.example.
Before using a new env var, ask Samira to confirm it is in Vercel.

RULE 5 -- NEVER PUSH TO MAIN:
Work on sprint branches only.
Branch names: sprint-[N]-[description] or fix/[description]
Samira merges to main. You never do.
All git push commands run from PowerShell on Windows.
WSL cannot push to GitHub. Do not try.

RULE 6 -- HIPAA ON EVERY NEW API ROUTE:
Every new route that reads or writes patient data needs all four:
  1. Auth check: supabase.auth.getUser()
  2. Role check: confirm user.role matches what this route requires
  3. Org filter: all queries filtered by organization_id
  4. Audit log: write to audit_log table before returning response
Missing any one of these four means the route does not get committed.

RULE 7 -- DEFINITION OF DONE:
A feature is done when a hospital director can open the app on a
desktop browser and on a mobile device, use the feature built in
this sprint, and have it work without crashing, without errors,
and without confusion.

Technically that means ALL of these are true:
- npx tsc --noEmit returns 0 errors
- npx vitest run returns all passing
- npx playwright test returns all passing against the production URL
- The feature works on desktop Chrome
- The feature works on mobile screen size in Chrome devtools
- Samira has clicked through it and confirmed it works

If any of these are not true, the sprint is not done.
Do not report it as done. Do not ask for a merge.

RULE 8 -- BUGS GET REPORTED, NOT FIXED INLINE:
If you find a bug while working on your assigned task, write it down.
Add it to SPRINT_LOG.md as DISCOVERED ISSUE with the file and line.
Do not fix it. Do not expand scope. Samira assigns it to a sprint.

RULE 9 -- MOBILE AND WEB SHIP TOGETHER:
Every new page in app/ needs a screen in apps/mobile/app/
Mobile uses lib/design-tokens.ts for colors and spacing, not CSS variables.
No window, document, localStorage, or next/router in any mobile file.
All touch targets 48px minimum in mobile screens.

RULE 10 -- WHEN IN DOUBT, STOP:
Stop. Ask Samira. Do not guess. Do not assume.
A wrong assumption costs more time than asking.

---

## HIPAA -- ABSOLUTE RULES

- Audit log entry on every read, write, update, delete of patient data.
- SUPABASE_SERVICE_ROLE_KEY in API routes only. Never client-side. Never NEXT_PUBLIC_.
- No patient data in any server log, AI prompt, or NEXT_PUBLIC_ variable.
- Session timeout at 30 minutes of inactivity.
- Every new table gets RLS enabled on creation. Not as a follow-up.
- If you find a HIPAA gap, stop the sprint and report it. Do not continue.

---

## DESIGN SYSTEM -- LOCKED

Web uses CSS variables. Mobile uses lib/design-tokens.ts. Never hex in components.
Exception: lib/pdf/hospital-grade-export.tsx may use hex directly.

--background: #F7F2EA
--primary:    #2C5F4A
--accent:     #C4714A
--card:       #FFFFFF
--text:       #1A1A1A
--muted:      #6B6B6B
--border:     #E8E2D9
--pale-sage:  #F0F5F2
--pale-terra: #FDF3EE

Playfair Display for titles. DM Sans for all body text.
8px base grid. 48px minimum touch targets.
No dark mode. No em dashes. No hex in components. No blank empty states.

---

## STACK

Web: Next.js 16, App Router, TypeScript strict, Tailwind CSS 4, React 19
Mobile: Expo React Native in apps/mobile/
Database: Supabase Pro (lrhwgswbsctfqtvdjntr)
Auth: Supabase Auth, email/password + Google OAuth
Hosting: Vercel
AI: Anthropic Claude API, server-side only
Email: Brevo
Errors: Sentry
Rate limiting: Upstash Redis
PDF: @react-pdf/renderer
E2E: Playwright at tests/e2e/

---

## AI GUARDRAILS -- NO EXCEPTIONS

Every Claude API system prompt must include:
"You are a caregiver support assistant. You help families understand
medical information and coordinate care. You never diagnose. You never
recommend changing medications or dosages. You never speculate on
prognosis or survival. You never comment on psychiatric medications.
Always recommend consulting the care team for clinical decisions."

---

## CURRENT STATE -- April 29, 2026

CONFIRMED WORKING:
- Login: demo@clarifer.com reaches /home with Carlos Rivera loaded.
- middleware.ts active. proxy.ts deleted.
- 268 Vitest tests passing.
- Playwright E2E at tests/e2e/login-to-home.spec.ts passing.
- 25 migrations in production.
- All 10 CCF demo features exist as files.
- CCF demo May 8, 2026.

KNOWN BUGS -- do not touch unless Samira assigns:
1. handle_new_user trigger missing. New signups fail.
2. Password reset redirects to nonexistent page.
3. 6 client-side PHI writes bypass API routes.
4. audit_log missing on document upload and account deletion.
5. Account deletion leaves data in 12 tables.
6. trial_saves missing organization_id.
7. WHO ICTRP table empty.
8. 34 files with hex strings.
9. 13 files with em dashes.
10. 14 files with touch targets under 48px.
11. Appointments not saving.
12. Document summaries not linked to documents.
13. Care team email links broken.
14. tests/api/rate-limiting-auth.test.ts imports @/proxy which no longer exists.

---

## GIT RULES

Sprint branches only: sprint-[N]-[description] or fix/[description]
All git push from PowerShell on Windows. WSL cannot push.
Commit after every logical unit of work.
Run tsc, vitest, audit before every commit.
Samira merges to main. You never do.

---

## WHAT TO DO RIGHT NOW

1. Run Step 0. Show all output.
2. Stop. Wait for Samira to review.
3. Samira tells you the sprint and task.
4. Read every file before touching it.
5. Build. One file, one job.
6. Run all three checks. Fix until all pass.
7. Write the Playwright test for the new feature.
8. Commit to sprint branch.
9. Report everything. Stop. Wait.
10. Never merge to main.
