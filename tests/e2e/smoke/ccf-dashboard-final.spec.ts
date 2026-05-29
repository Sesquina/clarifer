/**
 * tests/e2e/smoke/ccf-dashboard-final.spec.ts
 * Smoke test for the CCF Foundation dashboard -- June 3 2026 research presentation.
 * Verifies: page loads, no individual names visible, aggregate content present,
 * "Don't know where to start?" guide card present, access control blocks non-CCF users.
 * Auth: uses default storageState (demo@clarifer.com, in ALLOWED_EMAILS).
 */

import { test, expect } from "@playwright/test";

const PATH = "/ccf-dashboard";

// ── Authenticated suite (uses global storageState: demo@clarifer.com) ──────────

test.describe("CCF dashboard — authenticated (demo@clarifer.com)", () => {

  test("page loads and shows CCF Community Overview header", async ({ page }) => {
    await page.goto(PATH);
    await expect(page.getByText("CCF Community Overview")).toBeVisible({ timeout: 15000 });
  });

  test("no individual patient names visible on page load", async ({ page }) => {
    await page.goto(PATH);
    await page.waitForSelector('[aria-label="CCF Community Overview dashboard header"]', { timeout: 15000 });
    const body = await page.textContent("body");
    // Full names that should never appear on an aggregate dashboard
    expect(body).not.toContain("Carlos Rivera");
    expect(body).not.toContain("Rivera");
  });

  test("aggregate hero metric is visible and non-empty", async ({ page }) => {
    await page.goto(PATH);
    const heroSection = page.locator('[aria-label="Active CCA caregivers this month"]');
    await expect(heroSection).toBeVisible({ timeout: 15000 });
    // The number displayed must not be "0" -- either live data or demo fallback
    const heroText = await heroSection.textContent();
    expect(heroText).not.toMatch(/^0$/);
  });

  test("community metrics cards are all visible", async ({ page }) => {
    await page.goto(PATH);
    const metricsGrid = page.locator('[aria-label="Community metrics"]');
    await expect(metricsGrid).toBeVisible({ timeout: 15000 });
    for (const label of [
      "Symptom logs this month",
      "Trials saved this month",
      "Documents analyzed",
      "Logging at least weekly",
    ]) {
      await expect(page.getByText(label)).toBeVisible();
    }
  });

  test("'Don't know where to start?' guide card is present", async ({ page }) => {
    await page.goto(PATH);
    await expect(page.getByText("Don't know where to start?")).toBeVisible({ timeout: 15000 });
  });

  test("'Send to your community' section is present", async ({ page }) => {
    await page.goto(PATH);
    await expect(page.getByText("Send to your community")).toBeVisible({ timeout: 15000 });
  });

  test("page renders correctly at mobile viewport (375px)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(PATH);
    await expect(page.getByText("CCF Community Overview")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Don't know where to start?")).toBeVisible();
  });

});

// ── Unauthenticated access control ────────────────────────────────────────────

test.describe("CCF dashboard — unauthenticated access control", () => {
  // Clear any stored auth state for this suite
  test.use({ storageState: { cookies: [], origins: [] } });

  test("redirects to /login when not authenticated", async ({ page }) => {
    await page.goto(PATH);
    await page.waitForURL("**/login", { timeout: 10000 });
    expect(page.url()).toContain("/login");
  });

});
