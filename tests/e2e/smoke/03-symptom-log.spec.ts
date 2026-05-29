import { test, expect } from '@playwright/test';
import { assertNoError } from '../helpers/auth';

test.describe('Symptom Log — smoke', () => {

  test('symptom log page loads', async ({ page }) => {
    await page.goto('/log');
    await assertNoError(page);
  });

  test('save button is visible (label: Save log)', async ({ page }) => {
    await page.goto('/log');
    await assertNoError(page);
    await expect(page.getByRole('button', { name: /save log/i })).toBeVisible();
  });

});
