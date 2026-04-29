import { chromium } from '@playwright/test';

async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('https://clarifer.com/login');
  await page.waitForSelector('input[type="email"]', { state: 'visible' });
  await page.fill('input[type="email"]', 'demo@clarifer.com');
  await page.fill('input[type="password"]', 'ClariferdDemo2026!');
  await page.click('button[aria-label="Sign in"]');
  await page.waitForURL('**/home', { timeout: 20000 });

  await page.context().storageState({
    path: 'tests/e2e/helpers/.auth-state.json'
  });

  await browser.close();
  console.log('Auth state saved. All tests will reuse this session.');
}

export default globalSetup;
