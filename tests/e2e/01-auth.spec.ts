import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {

  test.use({ storageState: { cookies: [], origins: [] } });

  test('login page loads when not authenticated', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[aria-label="Sign in"]')).toBeVisible();
  });

  test('demo account logs in and reaches home', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('input[type="email"]', { state: 'visible' });
    await page.fill('input[type="email"]', 'demo@clarifer.com');
    await page.fill('input[type="password"]', 'ClariferdDemo2026!');
    await page.click('button[aria-label="Sign in"]');
    await page.waitForURL('**/home', { timeout: 20000 });
    expect(page.url()).toContain('/home');
  });

  test('home page shows Carlos Rivera after login', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('input[type="email"]', { state: 'visible' });
    await page.fill('input[type="email"]', 'demo@clarifer.com');
    await page.fill('input[type="password"]', 'ClariferdDemo2026!');
    await page.click('button[aria-label="Sign in"]');
    await page.waitForURL('**/home', { timeout: 20000 });
    await expect(page.locator('p').filter({ hasText: 'Caring for Carlos Rivera' })).toBeVisible({ timeout: 10000 });
  });

  test('signup page loads without errors', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

});

test.describe('Authentication -- Logged In Behavior', () => {
  test('logged in user is redirected away from login page', async ({ page }) => {
    await page.goto('/login');
    await page.waitForURL('**/home', { timeout: 10000 });
    expect(page.url()).toContain('/home');
  });
});
