#!/bin/bash
# =============================================================================
# run-clarifer-session.sh
# Clarifer autonomous build system — session runner
#
# What this does:
#   1. Reads CURRENT_SESSION.md for the task
#   2. Runs Claude Code in headless mode with that task
#   3. Logs all output to clarifer-sessions.log
#   4. Sends you an email when done (via Brevo SMTP)
#   5. Calls advance-session.sh to queue the next session
#
# How to start it:
#   From phone via Termius SSH:
#     tmux new-session -d -s clarifer-build '/home/sesquina/scripts/run-clarifer-session.sh'
#     then detach: Ctrl+B then D
#
#   Or it runs automatically via cron at 6am on weekdays.
#
# To check on it from your phone:
#   tmux attach -t clarifer-build
#   Or: tail -f /home/sesquina/logs/clarifer-sessions.log
# =============================================================================

set -euo pipefail

# --- Paths ---
REPO="/mnt/c/Users/esqui/clarifer"
CURRENT_SESSION="$REPO/CURRENT_SESSION.md"
SPRINT_STATUS="$REPO/SPRINT_STATUS.md"
LOG="/home/sesquina/logs/clarifer-sessions.log"
SCRIPTS="/home/sesquina/scripts"
CLAUDE_BIN="/home/sesquina/.nvm/versions/node/v20.20.2/bin/claude"

# --- Load environment variables ---
# Your Anthropic API key must be in this file (one line: ANTHROPIC_API_KEY=sk-ant-...)
ENV_FILE="/home/sesquina/.clarifer-env"
if [ -f "$ENV_FILE" ]; then
  source "$ENV_FILE"
else
  echo "ERROR: $ENV_FILE not found. Create it with your ANTHROPIC_API_KEY."
  echo "  echo 'ANTHROPIC_API_KEY=sk-ant-your-key-here' > ~/.clarifer-env"
  echo "  chmod 600 ~/.clarifer-env"
  exit 1
fi

export ANTHROPIC_API_KEY

log() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') | $1" | tee -a "$LOG"
}

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
# STEP 3: Navigate to repo and confirm it is clean enough to start
# =============================================================================

cd "$REPO"

# Check we are not on main (safety check)
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "main" ]; then
  log "WARN: Currently on main branch. Claude Code should not be building on main."
  log "This is fine — Claude Code will create/checkout a sprint branch as part of its task."
fi

# Log current state
log "REPO: branch=$CURRENT_BRANCH tsc_errors=$(npx tsc --noEmit 2>&1 | grep -c 'error TS' || true)"

# =============================================================================
# STEP 4: Build the full prompt
# =============================================================================

FULL_PROMPT="You are running as an autonomous agent building Clarifer, a HIPAA-compliant caregiver intelligence platform.

Read docs/MASTER_SESSION_PROMPT.md in full before doing anything else.
List the 10 rules back to confirm you have read it.
Then run Step 0 (git status, tsc count, vitest tail).
Then execute the task in CURRENT_SESSION.md exactly as written.

CURRENT_SESSION.md contents:

${SESSION_CONTENT}

When the task is complete:
1. Run: npx tsc --noEmit (must be 0 errors)
2. Run: npx vitest run (must be all passing)
3. Commit to the sprint branch with a clear message
4. Add a line to SPRINT_STATUS.md: S[N] | [branch] | DONE | $(date '+%Y-%m-%d') | [summary]
5. Write a COMPLETION SUMMARY to SPRINT_LOG.md: what you built, what you tested, what you found
6. Stop. Do not start a new task. Do not push to main."

# =============================================================================
# STEP 5: Run Claude Code in headless mode
# =============================================================================

log "CLAUDE CODE: Starting headless session..."

"$CLAUDE_BIN" -p "$FULL_PROMPT" \
  --allowedTools "Read,Edit,Bash(git *),Bash(npx tsc*),Bash(npx vitest*),Bash(npx playwright*),Bash(grep *),Bash(find *),Bash(cat *),Bash(ls *),Bash(npm *),Bash(node *),Bash(mkdir *),Bash(touch *),Bash(cp *),Bash(mv *),Bash(echo *)" \
  --max-turns 50 \
  2>&1 | tee -a "$LOG"

EXIT_CODE=${PIPESTATUS[0]}

log "CLAUDE CODE: Exited with code $EXIT_CODE"

# =============================================================================
# STEP 6: Check results and send notification
# =============================================================================

# Parse the session number from CURRENT_SESSION.md
SESSION_NUM=$(grep "^# CURRENT SESSION:" "$CURRENT_SESSION" | grep -oE "S[0-9]+" | head -1)
BRANCH=$(grep "^# Branch:" "$CURRENT_SESSION" | awk '{print $3}' | head -1)

# Check if SPRINT_STATUS.md was updated (means Claude Code marked it done)
if grep -q "DONE" "$SPRINT_STATUS" 2>/dev/null && \
   grep -q "$SESSION_NUM" "$SPRINT_STATUS" 2>/dev/null; then
  STATUS="COMPLETED"
  log "RESULT: $SESSION_NUM marked DONE in SPRINT_STATUS.md."
else
  STATUS="UNCERTAIN — check SPRINT_LOG.md"
  log "RESULT: $SESSION_NUM not marked done. Check SPRINT_LOG.md for details."
fi

# Get last 30 lines of log for the notification email
TAIL_LOG=$(tail -30 "$LOG")

# Send email notification via msmtp (Brevo SMTP)
# Only runs if msmtp is configured. Fails silently if not.
if command -v msmtp &> /dev/null; then
  echo "Subject: Clarifer $SESSION_NUM $STATUS
From: team@clarifer.com
To: samira.esquina@clarifer.com

Session: $SESSION_NUM
Branch: $BRANCH
Status: $STATUS
Time: $(date)

Last 30 lines of build log:

$TAIL_LOG
" | msmtp samira.esquina@clarifer.com 2>/dev/null && log "NOTIFY: Email sent to samira.esquina@clarifer.com" || log "NOTIFY: Email failed (msmtp may not be configured yet)"
else
  log "NOTIFY: msmtp not installed — skipping email. Install with: sudo apt install msmtp msmtp-mta"
fi

# =============================================================================
# STEP 7: Advance the queue to the next session
# =============================================================================

log "ADVANCE: Calling advance-session.sh to queue the next session..."

if [ -f "$SCRIPTS/advance-session.sh" ]; then
  bash "$SCRIPTS/advance-session.sh" 2>&1 | tee -a "$LOG"
else
  log "WARN: advance-session.sh not found at $SCRIPTS/advance-session.sh"
  log "Run advance-session.sh manually to queue the next session."
fi

log "=========================================="
log "RUN COMPLETE. Check SPRINT_LOG.md for details."
log "=========================================="
