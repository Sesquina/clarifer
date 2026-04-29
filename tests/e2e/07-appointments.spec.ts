import { test, expect } from '@playwright/test';
import { assertNoError } from './helpers/auth';

const PATIENT_ID = '5fc76836-e2f7-47b6-a394-ddccef619c95';

test.describe('Appointments', () => {

  test('appointments page loads', async ({ page }) => {
    await page.goto(`/patients/${PATIENT_ID}/appointments`);
    await assertNoError(page);
  });

  test('appointments page is not a 404', async ({ page }) => {
    await page.goto(`/patients/${PATIENT_ID}/appointments`);
    const body = await page.textContent('body');
    expect(body).not.toContain('404');
  });

  test('appointments loads on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/patients/${PATIENT_ID}/appointments`);
    await assertNoError(page);
  });

});
