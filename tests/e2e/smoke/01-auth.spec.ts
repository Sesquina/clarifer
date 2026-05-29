/**
 * 01-auth.spec.ts
 * Auth setup: logs in as demo account, asserts home loads, saves session.
 * This file runs under the auth-setup project — no pre-loaded storageState.
 * Tables: None
 * Auth: Public (performs login)
 * HIPAA: No PHI in this file
 */
import { test, expect } from '@playwright/test';

test('auth setup: demo login reaches /home and Carlos is visible', async ({ page }) => {
  await page.goto('/login');
  await page.waitForSelector('input[type="email"]', { state: 'visible' });

  await page.fill('input[type="email"]', 'demo@clarifer.com');
  await page.fill('input[type="password"]', 'ClariferdDemo2026!');
  await page.click('button[aria-label="Sign in"]');

  await page.waitForURL('**/home', { timeout: 10000 });
  expect(page.url()).toContain('/home');

  await expect(page.getByText('Carlos', { exact: false }).first()).toBeVisible({ timeout: 10000 });

  await page.context().storageState({ path: 'playwright/.auth/demo.json' });
});
