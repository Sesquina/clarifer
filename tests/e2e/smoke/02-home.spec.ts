/**
 * 02-home.spec.ts
 * Smoke: /home loads for authenticated demo user without errors.
 * Tables: None (read-only page load)
 * Auth: Required (storageState from auth-setup)
 * HIPAA: No PHI written
 */
import { test, expect } from '@playwright/test';

test.describe('/home — authenticated', () => {
  test('loads within 5 seconds without redirecting to login', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('networkidle', { timeout: 5000 });
    expect(page.url()).toContain('/home');
    expect(page.url()).not.toContain('/login');
  });

  test('patient name Carlos is visible', async ({ page }) => {
    await page.goto('/home');
    await expect(page.getByText('Carlos', { exact: false }).first()).toBeVisible({ timeout: 10000 });
  });

  test('at least one navigation element is visible', async ({ page }) => {
    await page.goto('/home');
    await expect(page.locator('nav').first()).toBeVisible({ timeout: 10000 });
  });

  test('no TypeError or Cannot-read console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('TypeError') || text.includes('Cannot read')) {
          errors.push(text);
        }
      }
    });
    await page.goto('/home');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    expect(errors).toHaveLength(0);
  });
});
