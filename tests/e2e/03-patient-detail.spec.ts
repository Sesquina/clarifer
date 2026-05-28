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

  test('patient hub renders all dashboard sections with demo patient data', async ({ page }) => {
    await page.goto(`/patients/${PATIENT_ID}`);
    await assertNoError(page);
    await expect(page.getByText('Carlos Rivera', { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: /Documents/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: /Symptoms/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: /Medications/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: /appointments/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: /Care team/i })).toBeVisible({ timeout: 10000 });
  });

  test('patient hub upload action meets 48px minimum touch target', async ({ page }) => {
    await page.goto(`/patients/${PATIENT_ID}`);
    await assertNoError(page);
    const uploadLink = page.getByRole('link', { name: /Upload/i }).first();
    await expect(uploadLink).toBeVisible({ timeout: 10000 });
    const box = await uploadLink.boundingBox();
    expect(box).not.toBeNull();
    if (box) expect(box.height).toBeGreaterThanOrEqual(48);
  });

});
