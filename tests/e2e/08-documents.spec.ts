import { test, expect } from '@playwright/test';
import { assertNoError } from './helpers/auth';

test.describe('Documents', () => {

  test('documents page loads', async ({ page }) => {
    await page.goto('/documents');
    await assertNoError(page);
  });

  test('documents page is not a 404', async ({ page }) => {
    await page.goto('/documents');
    const body = await page.textContent('body');
    expect(body).not.toContain('404');
  });

  test('document upload page loads', async ({ page }) => {
    await page.goto('/documents/upload');
    await assertNoError(page);
  });

  test('documents loads on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/documents');
    await assertNoError(page);
  });

});
