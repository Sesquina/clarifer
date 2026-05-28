# CURRENT SESSION: S-INFRA-1
# Generated: manually
# Branch: fix/core-smoke-tests

## Task

Build 5 Playwright smoke tests against https://clarifer.com using demo account.

Demo credentials:
  Email: demo@clarifer.com
  Password: ClariferdDemo2026!
  Patient: Carlos Rivera
  Patient ID: 5fc76836-e2f7-47b6-a394-ddccef619c95

Create tests/e2e/smoke/ directory.
Create tests/e2e/smoke/auth.setup.ts — logs in, saves auth state to playwright/.auth/demo.json.

TEST 1: tests/e2e/smoke/01-login.spec.ts
  Navigate to /login, fill credentials, assert URL contains /home, assert "Carlos" visible.

TEST 2: tests/e2e/smoke/02-symptom-log.spec.ts
  Login, navigate to /log, assert page loads, click add button, assert form opens.
  Do not submit.

TEST 3: tests/e2e/smoke/03-document-upload.spec.ts
  Login, navigate to /documents, assert upload button visible and >= 48px height.
  Do not upload.

TEST 4: tests/e2e/smoke/04-family-update.spec.ts
  Login, navigate to family update page for Carlos.
  Click generate, assert loading appears within 2s, assert content appears within 45s.
  Assert copy button visible. Assert AI disclaimer visible.
  Timeout for AI step: 45000ms.

TEST 5: tests/e2e/smoke/05-chat.spec.ts
  Login, navigate to /chat.
  Assert AI disclaimer visible ABOVE input bar.
  Type "What medications is Carlos taking?", submit.
  Assert response appears within 30s.
  Assert response does not contain "diagnose" or "prognosis".

Update playwright.config.ts:
  Add "smoke" project: baseURL https://clarifer.com, timeout 60000, retries 1.
  Auth state from playwright/.auth/demo.json.

Add to package.json:
  "test:smoke": "playwright test --project=smoke"
  "test:smoke:headed": "playwright test --project=smoke --headed"

Run all 5 tests against https://clarifer.com before committing.
If a test fails due to real bug: log DISCOVERED ISSUE in SPRINT_LOG.md.
If test fails due to selector: fix selector and retry.

tsc must be 0 errors.
Commit to fix/core-smoke-tests.
Append to SPRINT_STATUS.md:
S-INFRA-1 | fix/core-smoke-tests | DONE | 2026-05-28 | 5 production smoke tests passing against clarifer.com
