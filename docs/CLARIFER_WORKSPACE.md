# CLARIFER WORKSPACE SETUP
## HP Desktop (Windows)

Project root: C:\Users\esqui\clarifier\
This is the ONE source of truth for all Clarifer code.

Folder structure:
C:\Users\esqui\clarifier\
├── app/                    — Next.js web app
├── apps/mobile/            — Expo mobile app
├── components/             — Shared web components
├── lib/                    — Shared utilities
├── supabase/migrations/    — All SQL migrations (run manually)
├── tests/                  — All tests
├── docs/                   — All documentation
│   ├── CLARIFER_CLAUDE.md  — Agent spec
│   ├── CLARIFER_WORKSPACE.md — This file
│   └── legal/              — Privacy policy, ToS, HIPAA docs
├── .env.local              — Local environment variables (never committed)
└── apps/mobile/.env        — Mobile environment variables (never committed)

## MacBook
Clone location: ~/Desktop/clarifier/
Always pull from main before starting work on Mac.
git pull origin main

## Morning workflow
1. Open PowerShell
2. cd C:\Users\esqui\clarifier
3. git pull origin main
4. Review SPRINT_LOG.md for what Claude Code built overnight
5. Run: npm test (must be green before anything else)
6. Test the feature in browser (npx expo start --web)
7. If green: git push origin main
8. Start next sprint

## Running Database Migrations

NEVER run migrations automatically. Always review first.

### Setup (one time only)
1. Install Supabase CLI: already installed (devDependency, invoke via `npx supabase`)
2. Authenticate:
   npx supabase login
   (opens a browser — sign in with the account that owns the Clarifer project)
3. Link to production project:
   npx supabase link --project-ref lrhwgswbsctfqtvdjntr
   (enter database password when prompted)

### Running migrations (every sprint)
After Claude Code writes new migration files:

Option A — PowerShell (Windows HP):
   cd C:\Users\esqui\clarifier
   .\scripts\run-migrations.ps1

Option B — Terminal (MacBook):
   cd ~/Desktop/clarifier
   bash scripts/run-migrations.sh

Option C — Manual (Supabase dashboard):
   Open supabase.com → SQL Editor → New query
   Paste migration file → Run → confirm success

### Which migrations are pending?
Check SPRINT_LOG.md for lines starting with:
   MIGRATION REQUIRED:

### Rules
- NEVER run migrations on staging data with real patient names
- ALWAYS run migrations on staging before production
- ALWAYS verify success before starting next sprint
- Database password: stored in your password manager (NOT in git)
