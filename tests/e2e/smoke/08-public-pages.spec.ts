/**
 * 08-public-pages.spec.ts
 * Smoke: all public pages load with 200, no Cassini, no em dash, no "serious illness".
 * Tables: None
 * Auth: Public
 * HIPAA: No PHI; copy-rule validation
 */
import { test, expect } from '@playwright/test';

const PUBLIC_PAGES = [
  { name: 'landing', path: '/' },
  { name: 'login', path: '/login' },
  { name: 'privacy', path: '/privacy' },
  { name: 'terms', path: '/terms' },
  { name: 'research', path: '/research' },
];

test.describe('Public pages — no auth', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const { name, path } of PUBLIC_PAGES) {
    test(`${name} (${path}): loads 200, no Cassini, no em dash, no "serious illness"`, async ({ page }) => {
      const response = await page.goto(`https://clarifer.com${path}`);
      expect(response?.status()).toBeLessThan(400);

      const body = await page.textContent('body');
      expect(body!.length).toBeGreaterThan(100);
      expect(body).not.toContain('Cassini');
      expect(body).not.toContain('—'); // em dash U+2014
      expect(body).not.toContain('serious illness');
    });
  }
});
