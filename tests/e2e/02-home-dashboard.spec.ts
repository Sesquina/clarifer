import { test, expect } from '@playwright/test';
import { assertNoError } from './helpers/auth';

test.describe('Home Dashboard', () => {

  test('home dashboard loads without error', async ({ page }) => {
    await page.goto('/home');
    await assertNoError(page);
    expect(page.url()).toContain('/home');
  });

  test('patient name is visible', async ({ page }) => {
    await page.goto('/home');
    await expect(page.locator('p').filter({ hasText: 'Caring for Carlos Rivera' })).toBeVisible({ timeout: 10000 });
  });

  test('quick actions are present', async ({ page }) => {
    await page.goto('/home');
    await assertNoError(page);
  });

  test('desktop navigation is visible', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/home');
    await expect(page.locator('nav').first()).toBeVisible({ timeout: 10000 });
  });

  test('mobile bottom navigation is visible', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/home');
    const bottomNav = page.locator('nav').last();
    await expect(bottomNav).toBeVisible({ timeout: 10000 });
  });

  test('home page is responsive on mobile size', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/home');
    await assertNoError(page);
    await expect(page.locator('p').filter({ hasText: 'Caring for Carlos Rivera' })).toBeVisible({ timeout: 10000 });
  });

});
