// Live-Check (Noah 20.10.2026 «2a»): after every going online, a robot opens the real app on GitHub
// Pages, as Noah's phone does: with the service worker on and empty browser data.
// It checks: Today opens without an error, Ich shows the version that just went online, and after
// one visit the app also starts without network (as on a tour without reception), Today and a
// second page alike. Only .github/workflows/live.yml runs it (LIVE=1); it reads nothing and writes
// nothing of Noah's: a fresh browser has its own empty data.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const URL_LIVE = process.env.LIVE_URL || 'https://noahdolmetsch-af.github.io/packgenerator/';
const WANT = process.env.EXPECT_VERSION || JSON.parse(readFileSync(new URL('../../../package.json', import.meta.url), 'utf8')).version;

test.use({ serviceWorkers: 'allow', baseURL: URL_LIVE });
test.setTimeout(15 * 60_000);

const watch = (page) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  return errors;
};

/** Today (or any page) has content and no error page. */
async function opens(page, hash = '') {
  await page.goto(`./${hash}`);
  await page.locator('main').waitFor({ timeout: 30_000 });
  await expect.poll(() => page.locator('main').innerText().then((s) => s.trim().length), { timeout: 30_000 }).toBeGreaterThan(20);
  await expect(page.locator('[data-error-page]')).toHaveCount(0);
}

test('Live: Today opens, Ich shows the new version, and the app starts without network', async ({ page, context }) => {
  const errors = watch(page);
  // GitHub Pages can take a few minutes until every copy shows the new version: try again for up to 10 minutes.
  let shown = '';
  for (let i = 0; i < 20; i++) {
    await opens(page, '#/me');
    shown = await page.locator('main').innerText();
    if (shown.includes(WANT)) break;
    await page.waitForTimeout(30_000);
    await context.clearCookies();
  }
  expect(shown, `Ich zeigt die Version ${WANT}`).toContain(WANT);
  await opens(page);

  // the service worker has taken over this page: the app is kept for offline use
  await expect
    .poll(() => page.evaluate(async () => !!(await navigator.serviceWorker?.ready)?.active), { timeout: 60_000 })
    .toBe(true);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker?.controller), { timeout: 30_000 }).toBe(true);
  // a later page is loaded only when used: open it once with network, so it is kept too
  await opens(page, '#/trips');

  await context.setOffline(true);
  await opens(page);
  await opens(page, '#/trips');
  await context.setOffline(false);
  expect(errors).toEqual([]);
});
