/**
 * 04-document-upload.spec.ts
 * Smoke: /documents loads, upload button visible, pre-seeded doc exists, detail loads.
 * Tables: documents (read-only)
 * Auth: Required (storageState from auth-setup)
 * HIPAA: No PHI written; reads pre-seeded demo data
 */
import { test, expect } from '@playwright/test';

test.describe('/documents — authenticated', () => {
  test('page loads without redirecting', async ({ page }) => {
    await page.goto('/documents');
    expect(page.url()).not.toContain('/login');
    const body = await page.textContent('body');
    expect(body).not.toContain('Application error');
    expect(body).not.toContain('Internal Server Error');
  });

  test('upload button is visible and >= 48px tall', async ({ page }) => {
    await page.goto('/documents');
    const uploadButton = page.locator('button').filter({ hasText: /upload/i }).first();
    await expect(uploadButton).toBeVisible({ timeout: 10000 });
    const box = await uploadButton.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(48);
  });

  test('at least one pre-seeded document is visible', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    const body = await page.textContent('body');
    // Pre-seeded demo data must show at least one document entry
    expect(body).not.toContain('No documents');
    // There should be a link to at least one document detail page
    const docLinks = page.locator('a[href*="/documents/"]');
    const count = await docLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('clicking first document shows detail without raw error', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    const firstDocLink = page.locator('a[href*="/documents/"]').first();
    await expect(firstDocLink).toBeVisible({ timeout: 10000 });
    await firstDocLink.click();
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    const body = await page.textContent('body');
    expect(body).not.toContain('404');
    expect(body).not.toContain('Internal Server Error');
    expect(body).not.toContain('Application error');
    // Either AI summary is visible OR skeleton/loading state is shown
    const hasContentOrLoading =
      body!.toLowerCase().includes('summary') ||
      body!.toLowerCase().includes('loading') ||
      body!.toLowerCase().includes('analyzing') ||
      body!.length > 200;
    expect(hasContentOrLoading).toBeTruthy();
  });
});
