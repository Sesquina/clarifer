/**
 * 06-ccf-dashboard.spec.ts
 * Smoke: /ccf-dashboard is an aggregate view — no app auth, no individual names.
 * Tables: None (read-only page load)
 * Auth: Public (CCF dashboard has its own gate)
 * HIPAA: Asserts individual patient names are NOT exposed on this aggregate page
 */
import { test, expect } from '@playwright/test';

test.describe('/ccf-dashboard — no app auth', () => {
  // CCF dashboard has its own auth gate — clear app session
  test.use({ storageState: { cookies: [], origins: [] } });

  test('page loads without 404 or 500', async ({ page }) => {
    await page.goto('/ccf-dashboard');
    const body = await page.textContent('body');
    expect(body).not.toContain('404');
    expect(body).not.toContain('This page could not be found');
    expect(body).not.toContain('Internal Server Error');
    expect(body).not.toContain('Application error');
  });

  test('some aggregate content is visible', async ({ page }) => {
    await page.goto('/ccf-dashboard');
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    const body = await page.textContent('body');
    // Should contain charts, numbers, or meaningful aggregate content
    const hasContent =
      body!.includes('%') ||
      body!.includes('patient') ||
      body!.includes('Patient') ||
      body!.includes('CCF') ||
      body!.includes('caregiver') ||
      body!.length > 500;
    expect(hasContent).toBeTruthy();
  });

  test('individual patient name Carlos Rivera does not appear', async ({ page }) => {
    await page.goto('/ccf-dashboard');
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    const body = await page.textContent('body');
    expect(body).not.toContain('Carlos Rivera');
    expect(body).not.toContain('Rivera');
  });
});
