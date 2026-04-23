import { test, expect } from "@playwright/test";

/**
 * Auth flow E2E tests — run against: npx expo start --web (http://localhost:8081)
 *
 * React Native Web maps:
 *   accessibilityLabel → aria-label
 *   accessibilityRole="button" → role="button"
 */

test.describe("Auth flow", () => {
  // ── Test 1: Login screen loads ─────────────────────────────────────────────

  test("Test 1: Login screen loads with email, password, and sign-in button", async ({ page }) => {
    await page.goto("/");

    // Wait for React hydration
    await page.waitForLoadState("networkidle");

    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });

  // ── Test 2: Signup flow ────────────────────────────────────────────────────

  test("Test 2: Signup flow navigates to email verification or role selection", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.click("text=Don't have an account? Sign up");

    await page.waitForLoadState("networkidle");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByLabel("Confirm password")).toBeVisible();

    await page.fill('[aria-label="Email"]', "testcaregiver@clarifer-test.com");
    await page.fill('[aria-label="Password"]', "TestPassword123!");
    await page.fill('[aria-label="Confirm password"]', "TestPassword123!");

    await page.getByRole("button", { name: "Create Account" }).click();

    // Should reach email verification or role select
    await expect(
      page.locator("text=Check your email").or(page.locator("text=Who are you?"))
    ).toBeVisible({ timeout: 10000 });
  });

  // ── Test 3: Invalid credentials show error ────────────────────────────────

  test("Test 3: Login with invalid credentials shows error message", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.fill('[aria-label="Email"]', "wrong@email.com");
    await page.fill('[aria-label="Password"]', "wrongpassword");
    await page.getByRole("button", { name: "Sign In" }).click();

    // Error text appears below the inputs (styled red in login.tsx)
    await expect(
      page.locator('[aria-label="Email"]')
        .locator("..") // parent
        .locator("..")
        .locator("text=/invalid|credentials|error|password/i")
        .or(page.locator('[style*="color: rgb(192, 57, 43)"]'))
    ).toBeVisible({ timeout: 8000 });
  });

  // ── Test 4: Medical disclaimer screen is reachable ────────────────────────

  test("Test 4: Medical disclaimer screen renders with accept button", async ({ page }) => {
    // Navigate directly to the disclaimer route
    // In Expo Router, (modals) group prefix is stripped from the URL
    await page.goto("/medical-disclaimer");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("text=Medical Disclaimer")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /I Agree/i })
    ).toBeVisible();
  });
});
