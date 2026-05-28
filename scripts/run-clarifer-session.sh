#!/bin/bash
# =============================================================================
# run-clarifer-session.sh
# Clarifer autonomous build system — hardened session runner
# Version: 2 (2026-05-28)
#
# What this does:
#   1. HARD STOPS if the repo is on main (protects main from accidental builds)
#   2. Reads CURRENT_SESSION.md for the task and target branch
#   3. Creates or checks out the sprint branch FROM origin/main (never from HEAD)
#   4. Verifies the checked-out branch matches what CURRENT_SESSION.md specified
#   5. Runs npm install to ensure node_modules is current
#   6. Runs tsc --noEmit (if errors found: logs and aborts -- do not build on broken code)
#   7. Captures pre-session vitest baseline (counts pre-existing failures)
#   8. Runs Claude Code in headless mode with the full prompt
#   9. After Claude Code exits: runs vitest again, compares to baseline
#      If NEW failures introduced: logs REGRESSION DETECTED, does not mark DONE
#  10. Sends email notification with: session number, branch, new failures if any,
#      changed files, commit hash
#  11. Calls advance-session.sh to queue the next session
#
# How to start it:
#   From phone via Termius SSH:
#     tmux new-session -d -s clarifer '/home/sesquina/scripts/run-clarifer-session.sh'
#     then detach: Ctrl+B then D
#
#   Or it runs automatically via cron at 6am on weekdays.
#
# To check on it from your phone:
#   tmux attach -t clarifer
#   Or: tail -f /home/sesquina/logs/clarifer-sessions.log
#
# RULES (non-negotiable):
#   - Never build on main. main is read-only. Hard stop if on main.
#   - Never push to any remote.
#   - Never merge to main. Merging is Samira's job.
#   - Branch always created from origin/main, not from current HEAD.
# =============================================================================

set -euo pipefail

# --- Paths ---
REPO="/mnt/c/Users/esqui/clarifer"
CURRENT_SESSION="$REPO/CURRENT_SESSION.md"
SPRINT_STATUS="$REPO/SPRINT_STATUS.md"
SPRINT_LOG="$REPO/SPRINT_LOG.md"
LOG="/home/sesquina/logs/clarifer-sessions.log"
SCRIPTS="/home/sesquina/scripts"
CLAUDE_BIN="/home/sesquina/.nvm/versions/node/v20.20.2/bin/claude"

# --- Use Claude Max subscription (do not set API key) ---
# Exporting ANTHROPIC_API_KEY overrides Max subscription and triggers API billing.
# Claude Code authenticates via ~/.claude.json (Max subscription).
unset ANTHROPIC_API_KEY

log() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') | $1" | tee -a "$LOG"
}

mkdir -p "$(dirname "$LOG")"

# =============================================================================
# STEP 1: Confirm CURRENT_SESSION.md exists and has content
# =============================================================================

if [ ! -f "$CURRENT_SESSION" ]; then
  log "ERROR: CURRENT_SESSION.md not found. Run advance-session.sh first."
  exit 1
fi

SESSION_CONTENT=$(cat "$CURRENT_SESSION")
SESSION_LINE=$(head -1 "$CURRENT_SESSION")

if [ -z "$SESSION_CONTENT" ]; then
  log "ERROR: CURRENT_SESSION.md is empty. Run advance-session.sh first."
  exit 1
fi

# Check for unresolved git conflict markers (stash pop artifacts)
if grep -q "<<<<<<" "$CURRENT_SESSION" 2>/dev/null; then
  log "CRITICAL: CURRENT_SESSION.md contains git conflict markers."
  log "Resolve the conflict manually before running a session."
  log "File: $CURRENT_SESSION"
  exit 1
fi

log "=========================================="
log "SESSION STARTING: $SESSION_LINE"
log "=========================================="

# =============================================================================
# STEP 2: Check Claude Code binary exists
# =============================================================================

if [ ! -f "$CLAUDE_BIN" ]; then
  log "ERROR: Claude Code not found at $CLAUDE_BIN"
  log "Run: which claude  (to find the correct path)"
  log "Then update CLAUDE_BIN in this script."
  exit 1
fi

# =============================================================================
# STEP 3: Navigate to repo
# =============================================================================

cd "$REPO"

# =============================================================================
# PROTECTION 1: HARD STOP if on main
# =============================================================================

CURRENT_BRANCH=$(git branch --show-current)

if [ "$CURRENT_BRANCH" = "main" ]; then
  log "CRITICAL: Runner is on main branch. Stopping immediately."
  log "The runner must never build on main. Check out a sprint branch first."
  log "Run: cd $REPO && git checkout -b <branch-name>"
  exit 1
fi

log "BRANCH CHECK: Current branch is '$CURRENT_BRANCH' (not main -- safe to proceed)"

# =============================================================================
# PROTECTION 2: Extract target branch from CURRENT_SESSION.md and check it out
# from origin/main (never from current HEAD)
# =============================================================================

# Extract branch name from the "# Branch: <name>" line in CURRENT_SESSION.md
TARGET_BRANCH=$(grep "^# Branch:" "$CURRENT_SESSION" | awk '{print $3}' | head -1 | tr -d '[:space:]')

if [ -z "$TARGET_BRANCH" ]; then
  log "ERROR: Could not extract branch name from CURRENT_SESSION.md."
  log "Expected a line like: # Branch: fix/my-branch"
  exit 1
fi

log "TARGET BRANCH: $TARGET_BRANCH"

# If we're not already on the target branch, check it out
if [ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]; then
  log "BRANCH: Not on $TARGET_BRANCH. Switching..."

  # Fetch latest from origin so origin/main is up to date
  git fetch origin main --quiet 2>&1 | while read -r line; do log "GIT: $line"; done || true

  # Create branch from origin/main (NOT from current HEAD) if it does not exist
  if git show-ref --quiet "refs/heads/$TARGET_BRANCH"; then
    log "BRANCH: $TARGET_BRANCH already exists locally. Checking it out."
    git checkout "$TARGET_BRANCH"
  else
    log "BRANCH: Creating $TARGET_BRANCH from origin/main (clean base)."
    git checkout -b "$TARGET_BRANCH" origin/main
  fi
fi

# =============================================================================
# PROTECTION 3: Verify branch after checkout
# =============================================================================

ACTUAL_BRANCH=$(git branch --show-current)

if [ "$ACTUAL_BRANCH" != "$TARGET_BRANCH" ]; then
  log "CRITICAL: Branch verification failed."
  log "  Expected: $TARGET_BRANCH"
  log "  Actual:   $ACTUAL_BRANCH"
  log "Stopping to prevent building on the wrong branch."
  exit 1
fi

if [ "$ACTUAL_BRANCH" = "main" ]; then
  log "CRITICAL: On main after checkout attempt. This should never happen."
  log "Stopping immediately."
  exit 1
fi

log "BRANCH VERIFIED: On '$ACTUAL_BRANCH' -- safe to proceed"

# =============================================================================
# STEP 4: npm install (ensure node_modules is current before any build work)
# =============================================================================

log "DEPS: Running npm install to ensure node_modules is current..."
npm install --silent 2>&1 | tail -3

# =============================================================================
# STEP 5: Pre-flight tsc check (abort if TypeScript errors already exist)
# =============================================================================

log "TSC: Running pre-session tsc check..."
TSC_ERRORS=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || true)

if [ "$TSC_ERRORS" -gt 0 ]; then
  log "TSC: $TSC_ERRORS TypeScript error(s) found BEFORE this session started."
  log "TSC: These are pre-existing errors. Logging and proceeding."
  log "TSC: (Claude Code must not introduce additional errors.)"
  npx tsc --noEmit 2>&1 | grep "error TS" | while read -r line; do
    log "TSC_ERROR: $line"
  done
fi

log "TSC: Pre-session error count = $TSC_ERRORS"

# =============================================================================
# STEP 6: Capture pre-session vitest baseline
# =============================================================================

log "VITEST: Capturing pre-session test baseline..."
PRE_VITEST_OUTPUT=$(npx vitest run 2>&1 || true)
PRE_VITEST_FAILURES=$(echo "$PRE_VITEST_OUTPUT" | grep -c "FAIL " || true)
PRE_VITEST_PASSES=$(echo "$PRE_VITEST_OUTPUT" | grep -c "PASS " || true)

log "VITEST: Pre-session baseline: $PRE_VITEST_PASSES passing, $PRE_VITEST_FAILURES failing"

if [ "$PRE_VITEST_FAILURES" -gt 0 ]; then
  log "VITEST: Pre-existing test failures detected (not caused by this session)."
  log "VITEST: Claude Code must not introduce any NEW failures."
  echo "$PRE_VITEST_OUTPUT" | grep "FAIL " | while read -r line; do
    log "PRE_FAIL: $line"
  done
fi

# =============================================================================
# STEP 7: Build the full prompt
# =============================================================================

SESSION_ID=$(grep "^# CURRENT SESSION:" "$CURRENT_SESSION" | sed 's/^# CURRENT SESSION: //' | tr -d '[:space:]')

FULL_PROMPT="You are running as an autonomous agent building Clarifer, a HIPAA-compliant caregiver intelligence platform.

Read docs/CLARIFER_BRAIN.md in full before doing anything else.
List the 10 rules back to confirm you have read it.
Then run Step 0 (git status, tsc count, vitest tail).
Then execute the task in CURRENT_SESSION.md exactly as written.

CURRENT_SESSION.md contents:

${SESSION_CONTENT}

When the task is complete:
1. Run: npx tsc --noEmit (must be 0 errors)
2. Run: npx vitest run (must be all passing -- no new failures)
3. Commit to the sprint branch with format: fix(SN): [what you built]
4. Add a line to SPRINT_STATUS.md: ${SESSION_ID} | ${TARGET_BRANCH} | DONE | $(date '+%Y-%m-%d') | [summary]
5. Write COMPLETION SUMMARY to SPRINT_LOG.md: what you built, files changed, tests added, migrations required, issues discovered
6. Stop. Do not start a new task. Do not push to main. Do not merge."

# =============================================================================
# STEP 8: Run Claude Code in headless mode
# =============================================================================

log "CLAUDE CODE: Starting headless session..."
log "CLAUDE CODE: Session=$SESSION_ID Branch=$TARGET_BRANCH"

"$CLAUDE_BIN" -p "$FULL_PROMPT" \
  --allowedTools "Read,Edit,Write,Bash(git *),Bash(npx tsc*),Bash(npx vitest*),Bash(npx playwright*),Bash(grep *),Bash(find *),Bash(cat *),Bash(ls *),Bash(npm *),Bash(node *),Bash(mkdir *),Bash(touch *),Bash(cp *),Bash(mv *),Bash(echo *),Bash(sed *),Bash(awk *)" \
  --max-turns 80 \
  2>&1 | tee -a "$LOG"

EXIT_CODE=${PIPESTATUS[0]}
log "CLAUDE CODE: Exited with code $EXIT_CODE"

# =============================================================================
# STEP 9: Post-session checks — detect regressions
# =============================================================================

log "POST: Running post-session checks..."

# tsc post-check
POST_TSC_ERRORS=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || true)
log "POST TSC: $POST_TSC_ERRORS error(s) (was $TSC_ERRORS before session)"

if [ "$POST_TSC_ERRORS" -gt "$TSC_ERRORS" ]; then
  log "REGRESSION: TSC errors increased from $TSC_ERRORS to $POST_TSC_ERRORS"
  log "REGRESSION: Claude Code introduced TypeScript errors. Check SPRINT_LOG.md."
fi

# vitest post-check
log "POST: Running vitest post-session check..."
POST_VITEST_OUTPUT=$(npx vitest run 2>&1 || true)
POST_VITEST_FAILURES=$(echo "$POST_VITEST_OUTPUT" | grep -c "FAIL " || true)
POST_VITEST_PASSES=$(echo "$POST_VITEST_OUTPUT" | grep -c "PASS " || true)

log "POST VITEST: $POST_VITEST_PASSES passing, $POST_VITEST_FAILURES failing"

NEW_FAILURES=$((POST_VITEST_FAILURES - PRE_VITEST_FAILURES))

if [ "$NEW_FAILURES" -gt 0 ]; then
  log "REGRESSION DETECTED: $NEW_FAILURES new test failure(s) introduced by this session."
  log "REGRESSION: This session will not be marked DONE automatically."
  log "REGRESSION: Review SPRINT_LOG.md and fix the regressions before re-running."
  echo "$POST_VITEST_OUTPUT" | grep "FAIL " | while read -r line; do
    log "POST_FAIL: $line"
  done
  REGRESSION=true
else
  REGRESSION=false
  log "POST: No new test failures. Session passed regression check."
fi

# =============================================================================
# STEP 10: Determine session status
# =============================================================================

# Get the latest commit info
COMMIT_HASH=$(git log --format="%H" -1 2>/dev/null || echo "no-commit")
COMMIT_MSG=$(git log --format="%s" -1 2>/dev/null || echo "no-commit")
CHANGED_FILES=$(git diff --name-only HEAD~1 2>/dev/null | tr '\n' ' ' | cut -c1-200 || echo "unknown")

if grep -q "DONE" "$SPRINT_STATUS" 2>/dev/null && \
   grep -q "$SESSION_ID" "$SPRINT_STATUS" 2>/dev/null && \
   [ "$REGRESSION" = "false" ]; then
  STATUS="COMPLETED"
  log "RESULT: $SESSION_ID marked DONE in SPRINT_STATUS.md. No regressions."
elif [ "$REGRESSION" = "true" ]; then
  STATUS="REGRESSION DETECTED — not marked done. Fix failures and re-run."
  log "RESULT: $SESSION_ID has regressions. Not marking done."
else
  STATUS="UNCERTAIN — check SPRINT_LOG.md"
  log "RESULT: $SESSION_ID not marked done. Check SPRINT_LOG.md for details."
fi

# =============================================================================
# STEP 11: Email notification
# =============================================================================

TAIL_LOG=$(tail -40 "$LOG")

if command -v msmtp &> /dev/null; then
  {
    echo "Subject: Clarifer $SESSION_ID $STATUS"
    echo "From: team@clarifer.com"
    echo "To: samiraesquina@gmail.com"
    echo ""
    echo "Session:       $SESSION_ID"
    echo "Branch:        $TARGET_BRANCH"
    echo "Status:        $STATUS"
    echo "Time:          $(date)"
    echo "Commit:        $COMMIT_HASH"
    echo "Commit msg:    $COMMIT_MSG"
    echo "Changed files: $CHANGED_FILES"
    echo ""
    echo "Pre-session:  $PRE_VITEST_PASSES passing, $PRE_VITEST_FAILURES failing"
    echo "Post-session: $POST_VITEST_PASSES passing, $POST_VITEST_FAILURES failing"
    echo "TSC errors:   before=$TSC_ERRORS after=$POST_TSC_ERRORS"
    echo ""
    if [ "$REGRESSION" = "true" ]; then
      echo "*** REGRESSION DETECTED: $NEW_FAILURES new failure(s). Do not merge. ***"
      echo ""
    fi
    echo "Last 40 lines of build log:"
    echo ""
    echo "$TAIL_LOG"
  } | msmtp samiraesquina@gmail.com 2>/dev/null \
    && log "NOTIFY: Email sent to samiraesquina@gmail.com" \
    || log "NOTIFY: Email failed (msmtp may not be configured)"
else
  log "NOTIFY: msmtp not installed. Install with: sudo apt install msmtp msmtp-mta"
fi

# =============================================================================
# STEP 12: Advance the queue (only if no regression and session marked done)
# =============================================================================

if [ "$STATUS" = "COMPLETED" ]; then
  log "ADVANCE: Calling advance-session.sh to queue the next session..."
  if [ -f "$SCRIPTS/advance-session.sh" ]; then
    bash "$SCRIPTS/advance-session.sh" 2>&1 | tee -a "$LOG"
  else
    log "WARN: advance-session.sh not found at $SCRIPTS/advance-session.sh"
    log "Run advance-session.sh manually to queue the next session."
  fi
else
  log "ADVANCE: Skipping advance-session.sh — session not cleanly completed."
fi

log "=========================================="
log "RUN COMPLETE. Status: $STATUS"
log "Check SPRINT_LOG.md for details."
log "=========================================="
