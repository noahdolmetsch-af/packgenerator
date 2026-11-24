// «Pfad auf jeder Seite» Schritt 5 (Noah 28.10.2026): Ich › Karte der App lists the places with their functions
// and paths, a search narrows it and a tap goes there. German UI, no network, fictional data only (an empty app).
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');

test('the map of the app lists places, searches and leads to a function', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/me');
  await ready(page);
  await page.locator('[data-me-row="karte"]').click();
  await expect(page.locator('[data-appmap]')).toBeVisible();
  expect(await page.locator('[data-am-place]').count()).toBeGreaterThan(2);
  // the sketch (Noah 23.11.2026): the places of the bar, each with its pages as points, a mark on every point
  await expect(page.locator('[data-am-place="today"]')).toBeVisible();
  await expect(page.locator('[data-am-place="me"]')).toBeVisible();
  // the tree (Noah 24.11.2026): closed places first, each names its tabs; a place opens to its tabs, a tab to its pages
  await expect(page.locator('[data-am-place="week"] [data-am-tabs]')).toContainText(T('Training|tab'));
  expect(await page.locator('[data-am-place][open]').count()).toBe(0);
  await page.locator('[data-am-place="trips"] > summary').click();
  await expect(page.locator('[data-am-place="trips"] [data-am-tab="dreams"]')).toBeVisible();
  expect(await page.locator('[data-am-point]:not([data-am-mark])').count()).toBe(0);
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/karte-${page.viewportSize().width}.png`, fullPage: false });
  await page.locator('[data-am-filter="never"]').click();
  // a filter opens every place, so what is left is visible at once
  expect(await page.locator('[data-am-point]').count()).toBeGreaterThan(30);
  expect(await page.locator('[data-am-mark="open"]').count()).toBe(0);
  await page.locator('[data-am-filter="all"]').click();
  await expect(page.locator('[data-am-place="trips"]')).not.toHaveAttribute('open', '');
  await page.locator('[data-am-place="trips"] > summary').click();
  // a page opened on this device turns its point into a filled dot
  await page.locator('[data-am-point="#/trips/vorschlaege"]').click();
  // the visit counts once the title of the page stands still (PinMarks.svelte, about 1 s) and is then written to the settings:
  // wait for that entry itself, not for a guessed time (a fixed 1.5 s ran out on the loaded CI machines)
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const db = await new Promise((ok) => (indexedDB.open('pack-generator').onsuccess = (e) => ok(e.target.result)));
          const get = (key) => new Promise((ok) => (db.transaction('settings').objectStore('settings').get(key).onsuccess = (e) => ok(e.target.result)));
          const mine = [await get('quickLinks.used.phone'), await get('quickLinks.used.computer')];
          db.close();
          return mine.some((r) => r?.value?.opened?.['#/trips/vorschlaege']);
        }),
      { message: 'the opened page is remembered on this device' },
    )
    .toBe(true);
  await page.goto('./#/me/karte');
  await expect(page.locator('[data-am-point="#/trips/vorschlaege"]')).toHaveAttribute('data-am-mark', 'open');

  await page.locator('[data-am-search]').fill('datenschutz');
  const item = page.locator('[data-am-item="f.privacy"]');
  await expect(item).toBeVisible();
  await expect(item).toContainText(`${T('Me|place')} › ${T('Privacy and terms')}`);
  await item.locator('a').click();
  await expect(page.locator('[data-privacy]')).toBeVisible();
});
