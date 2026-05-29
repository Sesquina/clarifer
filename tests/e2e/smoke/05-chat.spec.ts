/**
 * 05-chat.spec.ts
 * Smoke: /chat loads, guardrail is visible, AI responds without diagnostic language.
 * Tables: chat_messages (read/write via API)
 * Auth: Required (storageState from auth-setup)
 * HIPAA: Demo patient only; response checked for guardrail compliance
 */
import { test, expect } from '@playwright/test';

test.describe('/chat — authenticated', () => {
  test('page loads without redirecting', async ({ page }) => {
    await page.goto('/chat');
    expect(page.url()).not.toContain('/login');
    const body = await page.textContent('body');
    expect(body).not.toContain('Application error');
  });

  test('AI disclaimer or guardrail text is visible above the input', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    const body = await page.textContent('body');
    const hasGuardrail =
      body!.includes('diagnose') ||
      body!.includes('doctor') ||
      body!.includes('care team');
    expect(hasGuardrail).toBeTruthy();
  });

  test('input field is visible and >= 48px tall', async ({ page }) => {
    await page.goto('/chat');
    const input = page.locator('input[type="text"], textarea').first();
    await expect(input).toBeVisible({ timeout: 10000 });
    const box = await input.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(48);
  });

  test('AI responds within 30 seconds without diagnostic language or stack trace', async ({ page }) => {
    await page.goto('/chat');
    const input = page.locator('input[type="text"], textarea').first();
    await expect(input).toBeVisible({ timeout: 10000 });
    await input.fill('What medications is Carlos taking?');

    const bodyBefore = await page.textContent('body');
    const initialLength = bodyBefore?.length ?? 0;

    // Submit via Enter (works for both input and textarea chat patterns)
    await input.press('Enter');

    // Wait for body to grow substantially — response is streaming in
    await page.waitForFunction(
      (len) => (document.body.textContent?.length ?? 0) > len + 50,
      initialLength,
      { timeout: 30000 },
    );

    // Check for guardrail compliance in the AI response elements
    // Try to target the assistant turn specifically; fall back to body if unavailable
    const assistantMsgs = page.locator('[data-role="assistant"], [class*="assistant"], [class*="ai-message"]');
    const assistantCount = await assistantMsgs.count();

    let responseText: string;
    if (assistantCount > 0) {
      responseText = (await assistantMsgs.last().textContent()) ?? '';
    } else {
      responseText = (await page.textContent('body')) ?? '';
    }

    expect(responseText).not.toContain('prognosis');
    // Check for stack trace pattern (lines starting with "at ")
    expect(responseText).not.toMatch(/\bat [A-Za-z]+\s*\(/);
  });
});
