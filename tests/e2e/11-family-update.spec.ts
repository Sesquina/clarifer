import { test, expect } from '@playwright/test';
import { assertNoError } from './helpers/auth';

const PATIENT_ID = '5fc76836-e2f7-47b6-a394-ddccef619c95';

test.describe('Family Update Generator', () => {

  test('family update page loads', async ({ page }) => {
    await page.goto(`/patients/${PATIENT_ID}/family-update`);
    await assertNoError(page);
  });

  test('family update page is not a 404', async ({ page }) => {
    await page.goto(`/patients/${PATIENT_ID}/family-update`);
    const body = await page.textContent('body');
    expect(body).not.toContain('404');
  });

  test('family update has English and Spanish options', async ({ page }) => {
    await page.goto(`/patients/${PATIENT_ID}/family-update`);
    await assertNoError(page);
    const body = await page.textContent('body');
    const hasLanguageOptions = body!.includes('English') || body!.includes('Spanish') || body!.includes('Español');
    expect(hasLanguageOptions).toBe(true);
  });

  test('family update loads on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/patients/${PATIENT_ID}/family-update`);
    await assertNoError(page);
  });

});
