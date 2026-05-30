import { test, expect } from '@playwright/test';

test.describe('app/(app) layout chrome', () => {

  test.beforeEach(async ({ page }) => {
    // Use demo credentials (same as other e2e tests)
    await page.goto('/login');
    await page.waitForSelector('input[type="email"]', { state: 'visible' });
    await page.fill('input[type="email"]', 'demo@clarifer.com');
    await page.fill('input[type="password"]', 'ClariferdDemo2026!');
    await page.click('button[aria-label="Sign in"]');
    await page.waitForURL('**/home', { timeout: 20000 });
  });

  test('desktop: nav rail is visible at 1280px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    // Navigate to a patient page (which now has the (app) layout)
    await page.goto('/home');
    // Nav rail: look for the Desktop navigation landmark
    const nav = page.locator('nav[aria-label="Desktop navigation"]');
    await expect(nav).toBeVisible({ timeout: 10000 });
  });

  test('desktop: nav rail has Home, Log, Documents, Tools links', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/home');

    const nav = page.locator('nav[aria-label="Desktop navigation"]');
    await expect(nav).toBeVisible({ timeout: 10000 });
    await expect(nav.locator('a[aria-label="Home"]')).toBeVisible();
    await expect(nav.locator('a[aria-label="Log"]')).toBeVisible();
    await expect(nav.locator('a[aria-label="Documents"]')).toBeVisible();
    await expect(nav.locator('a[aria-label="Tools"]')).toBeVisible();
  });

  test('mobile: bottom nav is visible at 390px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/home');
    const bottomNav = page.locator('nav[aria-label="Tab bar"]');
    await expect(bottomNav).toBeVisible({ timeout: 10000 });
  });

  test('mobile: nav rail is hidden at 390px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/home');
    const desktopNav = page.locator('nav[aria-label="Desktop navigation"]');
    await expect(desktopNav).toBeHidden({ timeout: 10000 });
  });

});
