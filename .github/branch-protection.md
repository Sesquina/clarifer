# Branch Protection — Manual GitHub Configuration

Configure at: github.com/Sesquina/clarifer → Settings → Branches → Add rule

## Rule for `main`

- **Require a pull request before merging:** YES
- **Require status checks to pass before merging:** YES
  - Required checks: `test` and `mobile-test` (from `.github/workflows/ci.yml`)
- **Require branches to be up to date before merging:** YES
- **Do not allow bypassing the above settings:** YES
- **Restrict who can push to matching branches:** NO (solo dev)

## What this enforces

- Claude Code pushes to sprint branches (`sprint-9-*`, `sprint-10-*`, etc.), never directly to `main`.
- Sprint branches auto-deploy to Vercel preview URLs, never to production.
- Samira reviews the preview URL.
- Samira merges to `main` via GitHub PR (or `git merge` locally after confirming).
- A merge to `main` triggers CI → if CI passes → Vercel deploys to production.

## Emergency bypass

Only the repo owner can temporarily disable the rule for an emergency hotfix.
Re-enable immediately after.
