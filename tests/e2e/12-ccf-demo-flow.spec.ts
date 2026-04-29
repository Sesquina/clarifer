import { test, expect } from '@playwright/test';
import { assertNoError } from './helpers/auth';

const PATIENT_ID = '5fc76836-e2f7-47b6-a394-ddccef619c95';
const BASE = 'https://clarifer.com';

test.describe('CCF Demo Flow -- Login', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('STEP 1: Demo login reaches home with patient loaded', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('input[type="email"]', { state: 'visible' });
    await page.fill('input[type="email"]', 'demo@clarifer.com');
    await page.fill('input[type="password"]', 'ClariferdDemo2026!');
    await page.click('button[aria-label="Sign in"]');
    await page.waitForURL('**/home', { timeout: 20000 });
    await expect(page.locator('p').filter({ hasText: 'Caring for Carlos Rivera' })).toBeVisible({ timeout: 10000 });
    console.log('STEP 1 PASS: Login and home dashboard');
  });
});

test.describe('CCF Demo Flow -- May 8 2026', () => {

  test('STEP 2: Emergency card loads with patient data', async ({ page }) => {
    await page.goto('/home');
    await page.goto(`/patients/${PATIENT_ID}/emergency-card`);
    await assertNoError(page);
    await expect(page.getByText('Carlos Rivera', { exact: true })).toBeVisible({ timeout: 10000 });
    console.log('STEP 2 PASS: Emergency card');
  });

  test('STEP 3: Biomarker tracker loads', async ({ page }) => {
    await page.goto('/home');
    await page.goto(`/patients/${PATIENT_ID}`);
    await assertNoError(page);
    const body = await page.textContent('body');
    expect(body).not.toContain('404');
    console.log('STEP 3 PASS: Patient detail and biomarkers');
  });

  test('STEP 4: Clinical trials page loads', async ({ page }) => {
    await page.goto('/home');
    await page.goto(`/patients/${PATIENT_ID}/trials`);
    await assertNoError(page);
    console.log('STEP 4 PASS: Clinical trials');
  });

  test('STEP 5: Family update generator loads with language options', async ({ page }) => {
    await page.goto('/home');
    await page.goto(`/patients/${PATIENT_ID}/family-update`);
    await assertNoError(page);
    const body = await page.textContent('body');
    const hasLanguage = body!.includes('English') || body!.includes('Spanish') || body!.includes('Español');
    expect(hasLanguage).toBe(true);
    console.log('STEP 5 PASS: Family update generator');
  });

  test('STEP 6: Documents page loads', async ({ page }) => {
    await page.goto('/home');
    await page.goto('/documents');
    await assertNoError(page);
    console.log('STEP 6 PASS: Documents');
  });

  test('STEP 7: Care team page loads', async ({ page }) => {
    await page.goto('/home');
    await page.goto(`/patients/${PATIENT_ID}/care-team`);
    await assertNoError(page);
    console.log('STEP 7 PASS: Care team');
  });

  test('STEP 8: Appointments page loads', async ({ page }) => {
    await page.goto('/home');
    await page.goto(`/patients/${PATIENT_ID}/appointments`);
    await assertNoError(page);
    console.log('STEP 8 PASS: Appointments');
  });

  test('STEP 9: Medications page loads', async ({ page }) => {
    await page.goto('/home');
    await page.goto('/tools/medications');
    await assertNoError(page);
    console.log('STEP 9 PASS: Medications');
  });

  test('STEP 10: Entire demo flow works on mobile screen size', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/home');
    await expect(page.locator('p').filter({ hasText: 'Caring for Carlos Rivera' })).toBeVisible({ timeout: 10000 });
    await page.goto(`/patients/${PATIENT_ID}/emergency-card`);
    await assertNoError(page);
    await page.goto(`/patients/${PATIENT_ID}/family-update`);
    await assertNoError(page);
    console.log('STEP 10 PASS: Full mobile flow');
  });

});
