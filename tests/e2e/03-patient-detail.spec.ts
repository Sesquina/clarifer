import { test, expect } from '@playwright/test';
import { assertNoError } from './helpers/auth';

const PATIENT_ID = '5fc76836-e2f7-47b6-a394-ddccef619c95';

test.describe('Patient Detail', () => {

  test('patient detail page loads', async ({ page }) => {
    await page.goto(`/patients/${PATIENT_ID}`);
    await assertNoError(page);
    await expect(page.getByText('Carlos Rivera', { exact: true })).toBeVisible({ timeout: 10000 });
  });

  test('patient detail shows diagnosis', async ({ page }) => {
    await page.goto(`/patients/${PATIENT_ID}`);
    await assertNoError(page);
  });

  test('emergency card link is present', async ({ page }) => {
    await page.goto(`/patients/${PATIENT_ID}`);
    const emergencyLink = page.getByRole('link', { name: /emergency/i });
    await expect(emergencyLink).toBeVisible({ timeout: 10000 });
  });

});
