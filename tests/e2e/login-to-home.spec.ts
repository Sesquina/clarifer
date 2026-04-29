import { test, expect } from '@playwright/test';

test('demo login reaches home with patient loaded', async ({ page }) => {
  // Step 1: Load login page
  await page.goto('https://clarifer.com/login');
  await expect(page.locator('input[type="email"]')).toBeVisible();

  // Step 2: Fill credentials
  await page.fill('input[type="email"]', 'demo@clarifer.com');
  await page.fill('input[type="password"]', 'ClariferdDemo2026!');

  // Step 3: Sign in
  await page.click('button[aria-label="Sign in"]');

  // Step 4: Wait for navigation
  await page.waitForURL('**/home', { timeout: 15000 });

  // Step 5: Confirm we are not broken
  await expect(page).not.toHaveURL(/.*404.*/);
  const bodyText = await page.textContent('body');
  expect(bodyText).not.toContain('contact support');
  expect(bodyText).not.toContain('role-select');

  // Step 6: Confirm patient data loaded
  await expect(page.getByText('Carlos Rivera')).toBeVisible({ timeout: 10000 });

  console.log('FINAL URL:', page.url());
  console.log('PASS: demo login reached home with patient loaded');
});
