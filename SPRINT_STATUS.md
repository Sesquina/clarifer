# Clarifer Sprint Status
# This file is the source of truth for what has been built.
# advance-session.sh reads this to determine the next session.
# Claude Code writes to this when a session completes.
#
# Format: S[number] | [branch] | DONE | [date] | [notes]
# SKIP means: session was skipped intentionally (add a reason)
#
# DO NOT edit the completed lines below — only add new ones at the bottom.

# ============================================================
# COMPLETED SESSIONS
# ============================================================

S1 | fix/password-reset-redirect | DONE | 2026-05-27 | Password reset redirect to nonexistent page fixed in mobile auth lib
S2 | fix/phi-client-writes-1 | DONE | 2026-05-27 | 2 PHI writes moved to server-side API routes (care_team insert + delete)
S3 | fix/phi-client-writes-2 | DONE | 2026-05-27 | 2 more PHI writes moved (medications insert, trial_saves upsert)
S4 | fix/phi-client-writes-3 | DONE | 2026-05-27 | Final PHI write moved (trial_saves delete) — 0 client-side PHI writes remain
S5 | fix/audit-log-missing | DONE | 2026-05-27 | audit_log writes completed on document upload and account deletion — written BEFORE deletion
S6 | fix/account-deletion-cascade | DONE | 2026-05-27 | Account deletion cascade for 12 tables — migration SQL written (not yet run)
S7 | fix/trial-saves-org-id | DONE | 2026-05-27 | trial_saves upsert org_id fix — 4 new tests passing
S8 | fix/vitest-failing-7 | DONE | 2026-05-27 | No failing tests found — 308 tests passing across 81 files
S9 | fix/em-dashes | DONE | 2026-05-27 | 26 em dashes across 18 files — all replaced
S10 | fix/hex-strings | DONE | 2026-05-27 | Hex color strings replaced with CSS variables
S11 | fix/touch-targets | DONE | 2026-05-27 | 9 touch targets under 48px across 8 files — all fixed

# ============================================================
# ADD NEW COMPLETED SESSIONS BELOW THIS LINE
# Format: S[N] | [branch] | DONE | [YYYY-MM-DD] | [one line summary]
# ============================================================
S14 | fix/session-timeout | DONE | 2026-05-27 | 30-min inactivity timeout added — components/SessionTimeout.tsx mounted in (platform) layout, signs out + redirects to /login?reason=session_timeout (matches existing banner); 1 vitest test with fake timers
S12 | fix/who-ictrp-empty | DONE | 2026-05-27 | WHO ICTRP seeded with 6 sample trials
S13 | fix/rls-audit | DONE | 2026-05-27 | RLS audit passed — 27 tables all have RLS
S15 | fix/supabase-baa-check | DONE | 2026-05-27 | PHI audit — 4 violations found and logged
S16 | fix/sentry-errors | DONE | 2026-05-27 | Sentry wired into top 3 silent error sources
S17 | fix/mobile-touch-audit | DONE | 2026-05-27 | Rule 9 audit -- 33 mobile-parity gaps logged, 2 DECISION REQUIRED
S18 | fix/onboarding-hardening | DONE | 2026-05-27 | /api/patients/create input validation hardened (length caps + enums + date format); 10 new tests (14/14); 2 issues logged: client-side users.role write enables self-elevation (S18-DI1, needs coordinated security sprint + DB trigger migration), refresh loses onboarding state (S18-DI2)
S19 | feat/notifications | DONE | 2026-05-27 | /notifications + bell badge (realtime) + mobile screen; GET/PATCH API with HIPAA 4/4 + per-row mark-read + audit_log; 11 new tests, all pass; pre-existing 10 PDF/export test failures unrelated (Blob.stream polyfill), logged as S19-DI1
