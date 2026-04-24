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

## Development Pipeline

### Three environments

1. **LOCAL (your PC)** — `npm run dev` → localhost:3000
   - Uses: `.env.local` (real production Supabase for now, staging when ready)

2. **PREVIEW / STAGING (Vercel preview URL)** — auto-deploys on sprint branch push
   - URL: `[sprint-name]-clarifer-[hash].vercel.app`
   - Uses: Preview environment variables in Vercel dashboard
   - Database: staging Supabase (when created), production until then

3. **PRODUCTION (clarifer.com)** — deploys ONLY when `main` passes CI
   - URL: clarifer.com
   - Uses: Production environment variables
   - Database: production Supabase

### The only safe deployment flow

1. Claude Code builds on a sprint branch (`sprint-9-*`, `sprint-10-*`, etc.)
2. Claude Code pushes the sprint branch to GitHub
3. Vercel auto-deploys the sprint branch to a preview URL
4. CI runs tests on the PR automatically
5. Samira reviews the preview URL — confirms the feature works
6. Samira merges to `main` (GitHub PR or local `git merge`)
7. CI runs tests again on `main`
8. If tests pass → Vercel deploys to clarifer.com
9. If tests fail → deployment blocked, production untouched

### What Claude Code NEVER does

- Never pushes directly to `main` (sprint branches only)
- Never bypasses CI
- Never runs migrations against production automatically
- Never deploys to production directly

### What Samira does to merge

**Option A (GitHub PR — safest):**
- Go to github.com/Sesquina/clarifer
- Open the PR for the sprint branch
- Review the preview URL
- Click "Merge pull request"

**Option B (local merge — fast):**
```
npm test            # must be green
git checkout main
git merge sprint-[name]
git push origin main
# CI runs automatically, Vercel deploys if green
```

### Emergency rollback

If production breaks after a merge:
- vercel.com → Clarifer → Deployments
- Find the last good deployment
- Click the three dots → "Promote to Production"
- Production is restored in ~30 seconds

## Morning workflow
1. Open PowerShell
2. `cd C:\Users\esqui\clarifier`
3. `git pull origin main`
4. Review `SPRINT_LOG.md` for what Claude Code built overnight
5. Review the Vercel preview URL for each open sprint branch
6. Run: `npm test` (must be green before merging)
7. If green and preview looks right: merge sprint branch → main (PR or local merge above)
8. Start next sprint

## Running Database Migrations

NEVER run migrations automatically. Always review first.
Run against staging before production, always.

### Setup (one time only)
1. Supabase CLI: already installed (devDependency, invoke via `npx supabase`)
2. Authenticate:
   `npx supabase login`
   (opens a browser — sign in with the account that owns the Clarifer project)
3. Link to production project:
   `npx supabase link --project-ref lrhwgswbsctfqtvdjntr`
   (enter database password when prompted)

### Running migrations (every sprint)
After Claude Code writes new migration files:

**Option A — PowerShell (Windows HP):**
```
cd C:\Users\esqui\clarifier
.\scripts\run-migrations.ps1
```

**Option B — Terminal (MacBook):**
```
cd ~/Desktop/clarifier
bash scripts/run-migrations.sh
```

**Option C — Manual (Supabase dashboard):**
- Open supabase.com → SQL Editor → New query
- Paste migration file → Run → confirm success

### Which migrations are pending?
Check `SPRINT_LOG.md` for lines starting with:
`MIGRATION REQUIRED:`

### Rules
- NEVER run migrations on staging data with real patient names
- ALWAYS run migrations on staging before production
- ALWAYS verify success before starting next sprint
- Database password: stored in your password manager (NOT in git)
