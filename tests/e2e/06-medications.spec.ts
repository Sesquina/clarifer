import { test, expect } from '@playwright/test';
import { assertNoError } from './helpers/auth';

test.describe('Medications', () => {

  test('medications page loads', async ({ page }) => {
    await page.goto('/tools/medications');
    await assertNoError(page);
  });

  test('medications page is not a 404', async ({ page }) => {
    await page.goto('/tools/medications');
    const body = await page.textContent('body');
    expect(body).not.toContain('404');
  });

  test('medications loads on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tools/medications');
    await assertNoError(page);
  });

});
