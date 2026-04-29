import { test, expect } from '@playwright/test';
import { assertNoError } from './helpers/auth';

const PATIENT_ID = '5fc76836-e2f7-47b6-a394-ddccef619c95';

test.describe('Emergency Card', () => {

  test('emergency card page loads', async ({ page }) => {
    await page.goto(`/patients/${PATIENT_ID}/emergency-card`);
    await assertNoError(page);
  });

  test('emergency card shows patient name', async ({ page }) => {
    await page.goto(`/patients/${PATIENT_ID}/emergency-card`);
    await expect(page.getByText('Carlos Rivera', { exact: true })).toBeVisible({ timeout: 10000 });
  });

  test('emergency card loads on mobile size', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/patients/${PATIENT_ID}/emergency-card`);
    await assertNoError(page);
    await expect(page.getByText('Carlos Rivera', { exact: true })).toBeVisible({ timeout: 10000 });
  });

});
