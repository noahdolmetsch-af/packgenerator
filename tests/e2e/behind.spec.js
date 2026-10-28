// Hängt das Handy fest? (Noah 20.10.2026): when a newer version has been online for a while (2 minutes since 27.10.2026) and this
// device still runs the old one, a bar says so, with «Jetzt laden» and «Später» (src/lib/behind.js).
import { test, expect } from './clock.js';
import { appVersion } from '../../scripts/news.mjs';
import { tr } from './home0460-fixture.js';
import { readFileSync } from 'node:fs';

// the key from the app source (behind.js imports the Svelte translation, so it is read, not imported)
const KEY = readFileSync(new URL('../../src/lib/behind.js', import.meta.url), 'utf8').match(/export const KEY = '([^']+)'/)[1];
// autofresh.js (27.10.2026): its key, read the same way
const FRESH = readFileSync(new URL('../../src/lib/autofresh.js', import.meta.url), 'utf8').match(/export const KEY = '([^']+)'/)[1];
// since 27.10.2026 the version comes from the order of merges (scripts/news.mjs), not package.json
const VERSION = appVersion();

const T = tr('de');

test('a device behind the online version for a while gets the bar; an up-to-date one does not', async ({ page, context }) => {
  test.setTimeout(120_000);
  let live = '9.9.9';
  await context.route(/\/version\.json/, (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ version: live }) }));
  await context.addInitScript(([k, f]) => {
    localStorage.setItem('lang', 'de');
    // seen behind long ago: the normal update had its time
    localStorage.setItem(k, JSON.stringify({ v: '9.9.9', at: 0 }));
    // and the one fresh load at the start (autofresh.js) was already tried for this version
    localStorage.setItem(f, '9.9.9');
  }, [KEY, FRESH]);
  await page.goto('./#/');
  const bar = page.locator('[data-behind-bar]');
  await expect(bar).toBeVisible({ timeout: 40_000 });
  await expect(bar).toContainText(T('Version {v} is online, but this device still runs an older one.', { v: '9.9.9' }));
  await expect(bar.getByRole('button', { name: T('Load now|update') })).toBeVisible();
  await bar.getByRole('button', { name: T('Later|update') }).click();
  await expect(bar).toHaveCount(0);

  live = VERSION; // now the device is up to date
  await page.reload();
  await page.waitForTimeout(35_000);
  await expect(bar).toHaveCount(0);
  expect(await page.evaluate((k) => localStorage.getItem(k), KEY)).toBe(null);
});

test('a newer version online that has not arrived loads the app fresh once, 30 seconds after the start', async ({ page, context }) => {
  test.setTimeout(120_000);
  await context.route(/\/version\.json/, (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ version: '9.9.9' }) }));
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  let loads = 0;
  page.on('load', () => loads++);
  await page.goto('./#/');
  await expect.poll(() => loads, { timeout: 45_000 }).toBe(2);
  await expect.poll(() => page.evaluate((f) => localStorage.getItem(f), FRESH)).toBe('9.9.9');
  // only once per version: no further load
  await page.waitForTimeout(35_000);
  expect(loads).toBe(2);
});
