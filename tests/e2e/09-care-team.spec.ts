import { test, expect } from '@playwright/test';
import { assertNoError } from './helpers/auth';

const PATIENT_ID = '5fc76836-e2f7-47b6-a394-ddccef619c95';

test.describe('Care Team', () => {

  test('care team page loads', async ({ page }) => {
    await page.goto(`/patients/${PATIENT_ID}/care-team`);
    await assertNoError(page);
  });

  test('care team page is not a 404', async ({ page }) => {
    await page.goto(`/patients/${PATIENT_ID}/care-team`);
    const body = await page.textContent('body');
    expect(body).not.toContain('404');
  });

  test('care team loads on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/patients/${PATIENT_ID}/care-team`);
    await assertNoError(page);
  });

});
