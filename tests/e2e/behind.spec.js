// Hängt das Handy fest? (Noah 20.10.2026): when a newer version has been online for 15 minutes and this
// device still runs the old one, a bar says so, with «Jetzt laden» and «Später» (src/lib/behind.js).
import { test, expect } from '@playwright/test';
import { tr } from './home0460-fixture.js';
import { readFileSync } from 'node:fs';

// the key from the app source (behind.js imports the Svelte translation, so it is read, not imported)
const KEY = readFileSync(new URL('../../src/lib/behind.js', import.meta.url), 'utf8').match(/export const KEY = '([^']+)'/)[1];
const VERSION = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')).version;

const T = tr('de');

test('a device behind the online version for 15 minutes gets the bar; an up-to-date one does not', async ({ page, context }) => {
  test.setTimeout(90_000);
  let live = '9.9.9';
  await context.route(/\/version\.json/, (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ version: live }) }));
  await context.addInitScript(([k]) => {
    localStorage.setItem('lang', 'de');
    // seen behind long ago: the normal update had its time
    localStorage.setItem(k, JSON.stringify({ v: '9.9.9', at: 0 }));
  }, [KEY]);
  await page.goto('./#/');
  const bar = page.locator('[data-behind-bar]');
  await expect(bar).toBeVisible({ timeout: 40_000 });
  await expect(bar).toContainText(T('Version {v} is online, but this device still runs an older one.', { v: '9.9.9' }));
  await expect(bar.getByRole('button', { name: T('Load now|update') })).toBeVisible();
  await bar.getByRole('button', { name: T('Later|update') }).click();
  await expect(bar).toHaveCount(0);

  live = VERSION; // now the device is up to date
  await page.reload();
  await page.waitForTimeout(25_000);
  await expect(bar).toHaveCount(0);
  expect(await page.evaluate((k) => localStorage.getItem(k), KEY)).toBe(null);
});
