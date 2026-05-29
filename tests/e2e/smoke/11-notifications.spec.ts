/**
 * tests/e2e/smoke/11-notifications.spec.ts
 * Smoke: /notifications loads for authenticated demo account.
 * Asserts the page renders data or the correct empty state — never a blank
 * screen or a redirect to /login.
 * Auth: uses global storageState (demo@clarifer.com)
 * HIPAA: no PHI asserted — only structural/UI elements checked
 */
import { test, expect } from "@playwright/test";

test.describe("/notifications — authenticated demo account", () => {
  test("page loads and stays on /notifications", async ({ page }) => {
    await page.goto("/notifications");
    await page.waitForLoadState("networkidle", { timeout: 10000 });
    expect(page.url()).toContain("/notifications");
    expect(page.url()).not.toContain("/login");

    const body = await page.textContent("body");
    expect(body).not.toContain("Application error");
    expect(body).not.toContain("Internal Server Error");
  });

  test("at least one notification item or correct empty state is visible", async ({ page }) => {
    await page.goto("/notifications");
    await page.waitForLoadState("networkidle", { timeout: 10000 });

    // The page must show either a notification card or the empty state copy.
    // A blank screen or a loading spinner that never resolves both fail this.
    const notificationCard = page.locator("[class*='Card'], [class*='card']").first();
    const emptyState = page.getByText("You are all caught up.", { exact: true });

    await expect(notificationCard.or(emptyState)).toBeVisible({ timeout: 10000 });
  });

  test("page heading is visible", async ({ page }) => {
    await page.goto("/notifications");
    await expect(
      page.getByRole("heading", { name: "Notifications" })
    ).toBeVisible({ timeout: 10000 });
  });
});
