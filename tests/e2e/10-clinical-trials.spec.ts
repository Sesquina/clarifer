import { test, expect } from '@playwright/test';
import { assertNoError } from './helpers/auth';

const PATIENT_ID = '5fc76836-e2f7-47b6-a394-ddccef619c95';

test.describe('Clinical Trials', () => {

  test('trials page loads', async ({ page }) => {
    await page.goto(`/patients/${PATIENT_ID}/trials`);
    await assertNoError(page);
  });

  test('trials page is not a 404', async ({ page }) => {
    await page.goto(`/patients/${PATIENT_ID}/trials`);
    const body = await page.textContent('body');
    expect(body).not.toContain('404');
  });

  test('trials loads on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/patients/${PATIENT_ID}/trials`);
    await assertNoError(page);
  });

});
