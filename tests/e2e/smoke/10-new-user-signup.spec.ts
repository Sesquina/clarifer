/**
 * 10-new-user-signup.spec.ts
 * Smoke: fresh signup flow reaches /onboarding or shows email confirmation.
 * Tables: None (Supabase Auth handles signup)
 * Auth: None — tests unauthenticated signup path
 * HIPAA: No PHI; test uses a throwaway mailinator address
 */
import { test, expect } from '@playwright/test';

test.describe('New user signup flow — no auth', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('signup reaches /onboarding or shows email confirmation', async ({ page }) => {
    const testEmail = `test-${Date.now()}@mailinator.com`;

    await page.goto('/login');
    // Click the signup link
    const signupLink = page.locator('a[href="/signup"]').first();
    await expect(signupLink).toBeVisible({ timeout: 10000 });
    await signupLink.click();

    await page.waitForURL('**/signup', { timeout: 10000 });
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'TestPassword123!');

    // Submit — find the signup/create button
    const submitButton = page
      .locator('button')
      .filter({ hasText: /sign up|create account|get started/i })
      .first();
    await expect(submitButton).toBeVisible({ timeout: 5000 });
    await submitButton.click();

    // Wait for redirect or confirmation message (up to 15 seconds)
    await page.waitForTimeout(5000);

    const url = page.url();
    const body = await page.textContent('body');

    if (url.includes('/onboarding')) {
      console.log(`[10-signup] Result: redirected to /onboarding`);
      // Onboarding form must be visible
      const inputCount = await page.locator('input').count();
      expect(inputCount).toBeGreaterThan(0);
    } else {
      console.log(`[10-signup] Result: on ${url} — checking for confirmation message`);
      // Supabase email-confirm flow: a message should indicate next step
      const hasConfirmation =
        body!.toLowerCase().includes('confirm') ||
        body!.toLowerCase().includes('check your email') ||
        body!.toLowerCase().includes('email sent') ||
        body!.toLowerCase().includes('verification') ||
        body!.toLowerCase().includes('link');
      expect(hasConfirmation).toBeTruthy();
    }
  });
});
