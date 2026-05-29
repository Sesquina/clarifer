/**
 * 07-research-page.spec.ts
 * Smoke: /research is public. Checks load, heading text, copy rules.
 * Tables: None
 * Auth: Public
 * HIPAA: No PHI; copy-rule checks (no em dash, no "serious illness")
 */
import { test, expect } from '@playwright/test';

test.describe('/research — public page', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('page loads with 200 (not 404)', async ({ page }) => {
    const response = await page.goto('/research');
    expect(response?.status()).not.toBe(404);
    expect(response?.status()).not.toBe(500);
    const body = await page.textContent('body');
    expect(body).not.toContain('This page could not be found');
  });

  test('heading contains caregiver, research, or Clarifer', async ({ page }) => {
    await page.goto('/research');
    const body = await page.textContent('body');
    const hasExpectedText =
      body!.toLowerCase().includes('caregiver') ||
      body!.toLowerCase().includes('research') ||
      body!.includes('Clarifer');
    expect(hasExpectedText).toBeTruthy();
  });

  test('no em dash character appears anywhere on the page', async ({ page }) => {
    await page.goto('/research');
    const body = await page.textContent('body');
    expect(body).not.toContain('—'); // em dash U+2014
  });

  test('the text "serious illness" does not appear', async ({ page }) => {
    await page.goto('/research');
    const body = await page.textContent('body');
    expect(body).not.toContain('serious illness');
  });
});
