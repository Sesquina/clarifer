/**
 * 13-password-reset.spec.ts
 * E2E tests for the password-reset flow.
 *
 * Full flow:
 *   /forgot-password -> submit email -> confirmation state
 *   email link -> /auth/callback?code=...&next=/update-password
 *               -> /update-password
 *               -> (on success) /home
 *
 * Note: the live email + Supabase code exchange cannot be exercised in CI.
 * These tests verify:
 *   1. The forgot-password page renders and accepts input.
 *   2. Submitting shows the confirmation state (no redirect to nonexistent page).
 *   3. /update-password (the post-callback landing page) renders correctly.
 *   4. /update-password validates input before calling updateUser.
 *   5. /auth/reset-password (the old broken redirect target) does not exist.
 */
import { test, expect } from "@playwright/test";

test.describe("Password reset -- forgot-password page", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("forgot-password page renders email input and submit button", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[aria-label="Send reset link"]')).toBeVisible();
  });

  test("submitting a valid email shows confirmation state -- no redirect to nonexistent page", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.fill('input[type="email"]', "test@example.com");
    await page.click('button[aria-label="Send reset link"]');
    // Supabase always returns success (avoids account enumeration).
    // The page should stay on /forgot-password and show the sent state.
    // It must NOT redirect to /auth/reset-password (which does not exist).
    await expect(page.locator("text=Check your email")).toBeVisible({ timeout: 10000 });
    expect(page.url()).not.toContain("/auth/reset-password");
  });

  test("confirmation state shows the submitted email address", async ({ page }) => {
    const email = "caregiver@example.com";
    await page.goto("/forgot-password");
    await page.fill('input[type="email"]', email);
    await page.click('button[aria-label="Send reset link"]');
    await expect(page.locator(`text=${email}`)).toBeVisible({ timeout: 10000 });
  });

  test("confirmation state has a link back to sign in", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.fill('input[type="email"]', "anyone@example.com");
    await page.click('button[aria-label="Send reset link"]');
    await expect(page.locator("text=Check your email")).toBeVisible({ timeout: 10000 });
    const backLink = page.locator('a[href="/login"]');
    await expect(backLink).toBeVisible();
  });
});

test.describe("Password reset -- update-password page", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("/update-password renders the set-password form", async ({ page }) => {
    await page.goto("/update-password");
    await expect(page.locator('input[aria-label="New password"]')).toBeVisible();
    await expect(page.locator('input[aria-label="Confirm new password"]')).toBeVisible();
    await expect(page.locator('button[aria-label="Update password"]')).toBeVisible();
  });

  test("/update-password rejects passwords shorter than 8 characters", async ({ page }) => {
    await page.goto("/update-password");
    await page.fill('input[aria-label="New password"]', "short");
    await page.fill('input[aria-label="Confirm new password"]', "short");
    await page.click('button[aria-label="Update password"]');
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[role="alert"]')).toContainText("at least 8 characters");
  });

  test("/update-password rejects mismatched passwords", async ({ page }) => {
    await page.goto("/update-password");
    await page.fill('input[aria-label="New password"]', "StrongPass1!");
    await page.fill('input[aria-label="Confirm new password"]', "DifferentPass1!");
    await page.click('button[aria-label="Update password"]');
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[role="alert"]')).toContainText("do not match");
  });
});

test.describe("Password reset -- broken redirect target no longer exists", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("/auth/reset-password (old broken redirect) returns 404 or redirects -- not a valid destination", async ({ page }) => {
    const response = await page.goto("/auth/reset-password");
    // The old RESET_PASSWORD_REDIRECT pointed here. It must not be a working
    // password-reset page -- either 404 or redirect away is correct.
    // A 200 with a password form here would mean two conflicting reset pages.
    const url = page.url();
    const hasPasswordForm = await page.locator('input[type="password"]').count();
    // Either the page 404s or redirects to login/home -- not a password reset form.
    expect(
      response?.status() === 404 ||
      url.includes("/login") ||
      url.includes("/home") ||
      hasPasswordForm === 0
    ).toBeTruthy();
  });
});
