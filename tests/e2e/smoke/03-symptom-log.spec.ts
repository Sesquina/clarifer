/**
 * 03-symptom-log.spec.ts
 * Smoke: /log loads, add button meets 48px touch target, clicking opens form.
 * Tables: None (does not submit)
 * Auth: Required (storageState from auth-setup)
 * HIPAA: No PHI written
 */
import { test, expect } from '@playwright/test';

test.describe('/log — authenticated', () => {
  test('page loads without redirecting', async ({ page }) => {
    await page.goto('/log');
    expect(page.url()).not.toContain('/login');
    const body = await page.textContent('body');
    expect(body).not.toContain('404');
    expect(body).not.toContain('Application error');
    expect(body).not.toContain('Internal Server Error');
  });

  test('add or log-symptom button is visible and >= 48px tall', async ({ page }) => {
    await page.goto('/log');
    const addButton = page.locator('button').filter({ hasText: /add|log symptom/i }).first();
    await expect(addButton).toBeVisible({ timeout: 10000 });
    const box = await addButton.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(48);
  });

  test('clicking add button opens a form with at least one input field', async ({ page }) => {
    await page.goto('/log');
    const addButton = page.locator('button').filter({ hasText: /add|log symptom/i }).first();
    await expect(addButton).toBeVisible({ timeout: 10000 });
    await addButton.click();
    const inputField = page.locator('input, textarea, select').first();
    await expect(inputField).toBeVisible({ timeout: 3000 });
  });
});
