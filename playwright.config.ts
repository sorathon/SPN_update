import { defineConfig, devices } from '@playwright/test';
const baseURL = new URL(process.env.SPN_BASE_URL ?? 'https://spnb.nbgwhosting.com/QA/spn/');
// Accept either the application folder or the full login.php URL.
if (!baseURL.pathname.endsWith('/') && !baseURL.pathname.endsWith('.php')) {
  baseURL.pathname += '/';
}
export default defineConfig({
  testDir: './tests/function',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: baseURL.href,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
