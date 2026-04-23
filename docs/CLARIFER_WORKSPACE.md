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
