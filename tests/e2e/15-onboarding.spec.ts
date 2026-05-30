import { test, expect } from '@playwright/test';

test.describe('Onboarding — single-question redesign', () => {

  test.use({ storageState: { cookies: [], origins: [] } });

  // Login as demo account first (fast path — demo account is already onboarded,
  // so we test the onboarding page directly for UI correctness)
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('input[type="email"]', { state: 'visible' });
    await page.fill('input[type="email"]', 'demo@clarifer.com');
    await page.fill('input[type="password"]', 'ClariferdDemo2026!');
    await page.click('button[aria-label="Sign in"]');
    await page.waitForURL('**/home', { timeout: 20000 });
  });

  test('onboarding shows 1-question form, no 5-step fields', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');

    // Correct fields exist
    await expect(page.getByText('Who are you caring for?')).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder('First name')).toBeVisible();

    // Language toggle exists
    await expect(page.getByText('English')).toBeVisible();
    await expect(page.getByText('Español')).toBeVisible();

    // Removed fields must NOT exist
    await expect(page.getByPlaceholder(/diagnosis/i)).not.toBeVisible();
    await expect(page.getByPlaceholder(/date of birth/i)).not.toBeVisible();
    await expect(page.getByPlaceholder(/dob/i)).not.toBeVisible();
    await expect(page.getByPlaceholder(/city/i)).not.toBeVisible();
    await expect(page.getByPlaceholder(/location/i)).not.toBeVisible();
    await expect(page.getByText(/step \d of \d/i)).not.toBeVisible();
    await expect(page.getByText(/condition details/i)).not.toBeVisible();
    await expect(page.getByText(/tell us about you/i)).not.toBeVisible();

    // Button disabled until name entered
    const dashboardButton = page.getByRole('button', { name: /dashboard/i });
    await expect(dashboardButton).toBeDisabled();

    // Fill name → button enables
    await page.getByPlaceholder('First name').fill('Carlos');
    await expect(dashboardButton).toBeEnabled();
  });

  test('language toggle changes selection', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');

    // EN is default
    await expect(page.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');

    // Click ES
    await page.getByRole('button', { name: 'Español' }).click();
    await expect(page.getByRole('button', { name: 'Español' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'false');
  });

  test('submit button text says dashboard arrow', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');
    await page.getByPlaceholder('First name').fill('Carlos');
    await expect(page.getByRole('button', { name: /dashboard/i })).toContainText('dashboard');
  });

});
