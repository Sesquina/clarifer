// Auth state is pre-loaded via global-setup.ts
// loginAsDemo is kept as a fallback for tests that need a fresh session
// Most tests use the storageState from .auth-state.json automatically

import { Page } from '@playwright/test';

export async function loginAsDemo(page: Page) {
  await page.goto('/login');
  await page.waitForSelector('input[type="email"]', { state: 'visible' });
  await page.fill('input[type="email"]', 'demo@clarifer.com');
  await page.fill('input[type="password"]', 'ClariferdDemo2026!');
  await page.click('button[aria-label="Sign in"]');
  await page.waitForURL('**/home', { timeout: 15000 });
}

export async function assertNoError(page: Page) {
  const body = await page.textContent('body');
  if (!body) throw new Error('Page body is empty');
  const has404Page = body.includes('Page Not Found') || body.includes('This page could not be found') || body.includes('404 |') || body.includes('404: ');
  if (has404Page) throw new Error('Page shows 404');
  if (body.includes('Application error')) throw new Error('Page shows application error');
  if (body.includes('Internal Server Error')) throw new Error('Page shows server error');
  if (body.includes('contact support')) throw new Error('Page shows contact support error');
}

export async function clearAuth(page: Page) {
  await page.context().clearCookies();
  await page.context().clearPermissions();
}
