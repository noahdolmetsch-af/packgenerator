// v0.21.0 (Noah's decision 7a): a browser test of the whole trip loop on every pull request,
// so a broken flow (like "New → Packing list" doing nothing on 5 Oct) can never be merged again.
// Run with `npm run e2e`. It builds the app and serves it like GitHub Pages does (/packgenerator/).
import { defineConfig } from '@playwright/test';

// v0.24.1: E2E_PORT lets several checkouts run the tests at the same time.
const PORT = Number(process.env.E2E_PORT) || 4191;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/packgenerator/`,
    serviceWorkers: 'block', // the PWA worker would cache old builds between runs
    timezoneId: 'Europe/Zurich',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Locally a preinstalled Chromium can be used (PW_CHROMIUM=/path/to/chrome); CI installs its own.
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
  },
  projects: [
    { name: 'phone', use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/packgenerator/`,
    reuseExistingServer: false, // always test a fresh build
    timeout: 180_000,
  },
});
