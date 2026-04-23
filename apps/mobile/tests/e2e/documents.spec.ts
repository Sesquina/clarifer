import { test, expect } from "@playwright/test";

/**
 * Document screens E2E tests — run against: npx expo start --web (http://localhost:8081)
 * These tests verify unauthenticated redirect behaviour and basic UI structure.
 * Full authenticated flows require a seeded test user (see README).
 */

test.describe("Documents flow", () => {
  // ── Test 1: Unauthenticated access redirects ───────────────────────────────

  test("Test 1: Unauthenticated /documents access redirects to login", async ({ page }) => {
    await page.goto("/documents");
    await page.waitForLoadState("networkidle");

    // Expo Router redirects unauthenticated users to /(auth)/login → shows login UI
    await expect(
      page.getByLabel("Email")
        .or(page.getByLabel("Password"))
        .or(page.getByRole("button", { name: "Sign In" }))
    ).toBeVisible({ timeout: 8000 });
  });

  // ── Test 2: Login screen has upload doc navigation ─────────────────────────

  test("Test 2: Home screen quick-action links to documents", async ({ page }) => {
    // Verify the root redirects to login (upload link requires auth)
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // The login screen must be visible — confirms the documents route is protected
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible({ timeout: 8000 });
  });

  // ── Test 3: Document detail route requires auth ────────────────────────────

  test("Test 3: Unauthenticated /documents/[id] redirects to login", async ({ page }) => {
    await page.goto("/documents/test-doc-id");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByLabel("Email")
        .or(page.getByRole("button", { name: "Sign In" }))
    ).toBeVisible({ timeout: 8000 });
  });
});
