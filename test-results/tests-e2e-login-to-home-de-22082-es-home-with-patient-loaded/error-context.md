# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\e2e\login-to-home.spec.ts >> demo login reaches home with patient loaded
- Location: tests\e2e\login-to-home.spec.ts:3:5

# Error details

```
TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/home" until "load"
  navigated to "https://www.clarifer.com/patients"
  navigated to "https://www.clarifer.com/patients"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - img [ref=e4]
    - heading "Page not found" [level=1] [ref=e7]
    - paragraph [ref=e8]: The page you are looking for does not exist.
    - link "Back to home" [ref=e9] [cursor=pointer]:
      - /url: /
  - alert [ref=e10]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('demo login reaches home with patient loaded', async ({ page }) => {
  4  |   // Step 1: Load login page
  5  |   await page.goto('https://clarifer.com/login');
  6  |   await expect(page.locator('input[type="email"]')).toBeVisible();
  7  | 
  8  |   // Step 2: Fill credentials
  9  |   await page.fill('input[type="email"]', 'demo@clarifer.com');
  10 |   await page.fill('input[type="password"]', 'ClariferdDemo2026!');
  11 | 
  12 |   // Step 3: Sign in
  13 |   await page.click('button[aria-label="Sign in"]');
  14 | 
  15 |   // Step 4: Wait for navigation
> 16 |   await page.waitForURL('**/home', { timeout: 15000 });
     |              ^ TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
  17 | 
  18 |   // Step 5: Confirm we are not broken
  19 |   await expect(page).not.toHaveURL(/.*404.*/);
  20 |   const bodyText = await page.textContent('body');
  21 |   expect(bodyText).not.toContain('contact support');
  22 |   expect(bodyText).not.toContain('role-select');
  23 | 
  24 |   // Step 6: Confirm patient data loaded
  25 |   await expect(page.getByText('Carlos Rivera')).toBeVisible({ timeout: 10000 });
  26 | 
  27 |   console.log('FINAL URL:', page.url());
  28 |   console.log('PASS: demo login reached home with patient loaded');
  29 | });
  30 | 
```