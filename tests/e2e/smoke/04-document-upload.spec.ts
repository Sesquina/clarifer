import { test, expect } from '@playwright/test';
import { assertNoError } from '../helpers/auth';

test.describe('Document Upload — smoke', () => {

  test('documents page loads', async ({ page }) => {
    await page.goto('/documents');
    await assertNoError(page);
  });

  test('upload link is visible (rendered as <a>, not button)', async ({ page }) => {
    await page.goto('/documents');
    await assertNoError(page);
    await expect(page.getByRole('link', { name: /upload/i })).toBeVisible();
  });

});
