import { test, expect } from '@playwright/test';
import { assertNoError } from '../helpers/auth';

test.describe('Chat — smoke', () => {

  test('chat page loads', async ({ page }) => {
    await page.goto('/chat');
    await assertNoError(page);
  });

  test('chat textarea meets 48px minimum touch target', async ({ page }) => {
    await page.goto('/chat');
    await assertNoError(page);
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible();
    const box = await textarea.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(48);
  });

});
