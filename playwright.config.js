// v0.21.0 (Noah's decision 7a): a browser test of the whole trip loop on every pull request,
// so a broken flow (like "New → Packing list" doing nothing on 5 Oct) can never be merged again.
// Run with `npm run e2e`. It builds the app and serves it like GitHub Pages does (/packgenerator/).
import { defineConfig } from '@playwright/test';
import { writeNewsIndex } from './scripts/news.mjs';

// Specs import whatsnew.js and the German texts, which read src/lib/news/index.gen.js (version at merge time).
writeNewsIndex();

// v0.24.1: E2E_PORT lets several checkouts run the tests at the same time.
const PORT = Number(process.env.E2E_PORT) || 4191;

// v0.45.1: the Gesamttest (tests/e2e/gesamttest, 700 fictional items, ~166 checks) runs in CI as its own
// sharded job; the regular e2e job leaves it out with E2E_SKIP_GESAMTTEST=1. Locally both run.
const skipGesamttest = !!process.env.E2E_SKIP_GESAMTTEST;
// Noah 20.10.2026 «1a 2a»: the nightly walk through every page (tests/e2e/nachtrundgang, RUNDGANG=1) and the
// check of the live app (tests/e2e/live, LIVE=1) run only in their own workflows, never in a pull request.
const ignore = [
  ...(skipGesamttest ? ['**/gesamttest/**'] : []),
  ...(process.env.RUNDGANG ? [] : ['**/nachtrundgang/**']),
  ...(process.env.LIVE ? [] : ['**/live/**']),
];

// 27.10.2026 (thread «Weg von gebaut zu online»): the tests never reach the real server packgen. On GitHub
// every page load of Heute asked it for the lake (well over 1000 calls per PR check), so the server's free daily
// cap was used up by the evening and the real app could not sync any more. A test that needs the server
// answers with its own route (page.route / context.route); everything else gets «no network», as locally.
// Only the check of the live app (LIVE=1) talks to the real server.
// 28.10.2026: the same for GitHub's public API (Ich asks it which merges are not online yet, versionline.js);
// without an account it answers 60 questions an hour, and that belongs to the real app too.
export const NO_REAL_SERVER = '--host-resolver-rules=MAP packgen-three.vercel.app ~NOTFOUND, MAP api.github.com ~NOTFOUND';
const browserArgs = process.env.LIVE ? [] : [NO_REAL_SERVER];

export default defineConfig({
  testDir: 'tests/e2e',
  testIgnore: ignore,
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
    // Heute's windows open by the clock (Wochenrückblick Sunday from 18:00, the evening before a trip from 17:00,
    // src/lib/home/HomeWindow.svelte): a test that does not test them must not depend on the hour it runs at.
    // The window specs switch them on again with test.use({ storageState: WINDOWS_ON }) from ./tests/e2e/settle.js.
    storageState: { cookies: [], origins: [{ origin: `http://localhost:${PORT}`, localStorage: [{ name: 'pg.windows', value: 'quiet' }] }] },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Locally a preinstalled Chromium can be used (PW_CHROMIUM=/path/to/chrome); CI installs its own.
    launchOptions: { args: browserArgs, ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}) },
  },
  projects: [
    { name: 'phone', use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } } },
  ],
  // LIVE=1 (tests/e2e/live): the live app on GitHub Pages and two builds the test serves itself; no server here.
  webServer: process.env.LIVE
    ? undefined
    : {
        command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
        url: `http://localhost:${PORT}/packgenerator/`,
        reuseExistingServer: false, // always test a fresh build
        timeout: 180_000,
      },
});
