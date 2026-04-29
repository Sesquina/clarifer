import { test, expect } from '@playwright/test';
import { assertNoError } from './helpers/auth';

test.describe('Symptom Log', () => {

  test('symptom log page loads', async ({ page }) => {
    await page.goto('/log');
    await assertNoError(page);
  });

  test('symptom log form is visible', async ({ page }) => {
    await page.goto('/log');
    const body = await page.textContent('body');
    expect(body).not.toContain('404');
    expect(body).not.toContain('Application error');
  });

  test('symptom log loads on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/log');
    await assertNoError(page);
  });

});
