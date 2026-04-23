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

## Running Migrations

All SQL migrations live in supabase/migrations/ and are applied via the Supabase CLI.
Samira runs these commands. Claude Code never runs them.

### One-time setup (per machine)
Required the first time on a new machine — installs the CLI, authenticates with
supabase.com, and links this working tree to the Clarifer production project.

1. cd C:\Users\esqui\clarifier
2. npm install (supabase is already listed in devDependencies)
3. npx supabase login
   (opens a browser; sign in to the Supabase account that owns the Clarifer project)
4. npx supabase link --project-ref <CLARIFER_PROD_PROJECT_REF>
   (project ref is in the Supabase dashboard → Project Settings → General)
   (this will prompt for the database password — use the one from the vault)

### Running pending migrations against production

npx supabase db push

This runs all pending migrations in supabase/migrations/ in order against the
linked production database. The CLI shows a diff and asks for confirmation
before applying.

Samira runs this command. Claude Code never runs this command.

### Inspecting before running
Before every push, verify what will run:

npx supabase migration list           # shows applied vs pending migrations
npx supabase db diff                  # shows the SQL about to be applied

### Rollback
Supabase migrations are forward-only. There is no `db pull --reverse`.
If a migration fails, write a NEW migration that reverses it and run `db push` again.

### Local development database (optional)
To test migrations against a local Postgres before pushing to prod:

npx supabase start                    # boots local stack in Docker
npx supabase db reset                 # applies every migration from scratch
npx supabase stop                     # shuts it down

Requires Docker Desktop running.
