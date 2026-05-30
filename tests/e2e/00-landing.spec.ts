import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {

  test.use({ storageState: { cookies: [], origins: [] } });

  test('header contains "Sign in" link pointing to /login', async ({ page }) => {
    await page.goto('/');
    const signInLink = page.locator('a[aria-label="Sign in"]');
    await expect(signInLink).toBeVisible();
    const href = await signInLink.getAttribute('href');
    expect(href).toBe('/login');
  });

  test('"Sign in" link navigates to login page', async ({ page }) => {
    await page.goto('/');
    await page.click('a[aria-label="Sign in"]');
    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  test('"Join the waitlist" button is still present after Sign in link added', async ({ page }) => {
    await page.goto('/');
    const waitlistLink = page.locator('a[aria-label="Join the waitlist"]').first();
    await expect(waitlistLink).toBeVisible();
  });

});
