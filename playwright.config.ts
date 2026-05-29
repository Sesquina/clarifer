import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  retries: 1,
  reporter: 'list',
  globalSetup: './tests/e2e/helpers/global-setup.ts',
  use: {
    baseURL: 'https://clarifer.com',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    // Runs before smoke: logs in as demo, persists session to playwright/.auth/demo.json
    {
      name: 'auth-setup',
      testDir: './tests/e2e/smoke',
      testMatch: /01-auth\.spec\.ts/,
    },
    // Production smoke suite — clarifer.com, no mocks, real accounts, real data
    {
      name: 'smoke',
      testDir: './tests/e2e/smoke',
      dependencies: ['auth-setup'],
      timeout: 60000,
      retries: 1,
      testIgnore: /01-auth\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://clarifer.com',
        storageState: 'playwright/.auth/demo.json',
      },
    },
    // Existing regression suite — Desktop + Mobile
    {
      name: 'Desktop Chrome',
      testIgnore: /smoke\//,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/helpers/.auth-state.json',
      },
    },
    {
      name: 'Mobile Chrome',
      testIgnore: /smoke\//,
      use: {
        ...devices['Pixel 5'],
        storageState: 'tests/e2e/helpers/.auth-state.json',
      },
    },
  ],
});
