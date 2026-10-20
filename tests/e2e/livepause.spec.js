// Live-Karte Teil 1 (Noah 20.10.2026): «Pausieren» with a band and a clock that stands, the auto-pause with
// its own km/h limit, the sensors box, the Garmin-like data pages (swipe, the three ready pages, the
// editor). Fake GPS, every outside request mocked or blocked (openHome); no sideways scroll.
import { test, expect } from '@playwright/test';
import { openHome } from './home0460-fixture.js';

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const noSideways = async (page, where = '') => {
  const over = await page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    const bad = [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right + scrollX > w + 1 && !e.closest('[data-dp-pager]'));
    return { d: document.documentElement.scrollWidth - w, bad: bad.slice(0, 6).map((e) => `${e.tagName}.${e.className} ${Math.round(e.getBoundingClientRect().right)}`) };
  });
  expect(over.d, `${where} ${over.bad.join(' | ')}`).toBeLessThanOrEqual(1);
};
const recRow = (page) =>
  page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open('pack-generator');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const g = req.result.transaction('tracks').objectStore('tracks').getAll();
          g.onsuccess = () => resolve(g.result.find((r) => r.kind === 'rec' && r.open) ?? null);
          g.onerror = () => reject(g.error);
        };
      }),
  );

async function startRide(page, context, info) {
  const T = await openHome(page, context, info);
  await context.route(/tiles\.openfreemap\.org|wmts\.geo\.admin\.ch|tile\.openstreetmap\.org|opentopomap|rainviewer/, (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PNG }));
  await context.route(/overpass/, (route) => route.fulfill({ json: { elements: [] } }));
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 46.95, longitude: 7.45, accuracy: 8 });
  await page.goto('./#/live');
  await tap(page.locator('[data-live-start]'), info);
  await expect(page.locator('[data-live-full]')).toBeVisible();
  return T;
}

test('Pause: the band says «Paused», the riding time stands, the pause is kept, go on', async ({ page, context }, info) => {
  const T = await startRide(page, context, info);
  await expect(page.locator('[data-live-pause]')).toBeVisible();
  await tap(page.locator('[data-live-pause]'), info);
  const band = page.locator('[data-live-paused="hand"]');
  await expect(band).toBeVisible();
  await expect(band).toContainText(T('Paused|ride'));
  await expect(band).toContainText(T('The riding time stands. Nothing is recorded until you go on.'));
  const row = await recRow(page);
  expect(row.breaks).toHaveLength(1);
  expect(row.breaks[0][1]).toBe(null);
  await noSideways(page, 'paused');
  await tap(page.locator('[data-live-resume]'), info);
  await expect(band).toBeHidden();
  await expect(page.locator('[data-live-pause]')).toBeVisible();
  const after = await recRow(page);
  expect(after.breaks[0][1]).toBeGreaterThanOrEqual(after.breaks[0][0]);
});

test('Auto-pause with your own limit, the sensors box, the data pages', async ({ page, context }, info) => {
  const T = await startRide(page, context, info);
  // the settings in the sheet: auto-pause on, limit 6 km/h (a comma works)
  await tap(page.locator('[data-live-sheet-toggle]'), info);
  await tap(page.locator('[data-live-sheet-toggle]'), info);
  const opts = page.locator('[data-live-sheet] [data-live-options]');
  await opts.locator('summary').scrollIntoViewIfNeeded();
  await tap(opts.locator('summary'), info);
  await opts.locator('[data-live-opt="autoPause"]').check();
  const lim = opts.locator('[data-live-opt="autoKmh"]');
  await expect(lim).toHaveValue('4');
  await lim.fill('6');
  await lim.press('Tab');
  await expect.poll(async () => page.evaluate(() => new Promise((r) => { const q = indexedDB.open('pack-generator'); q.onsuccess = () => { const g = q.result.transaction('settings').objectStore('settings').get('live'); g.onsuccess = () => r(g.result?.value?.autoKmh); }; }))).toBe(6);

  // the sensors: connect buttons, or the line that this browser cannot
  const box = page.locator('[data-live-sensors]');
  await box.scrollIntoViewIfNeeded();
  const can = await page.evaluate(() => !!navigator.bluetooth?.requestDevice);
  if (can) await expect(box.locator('[data-live-sensor-add]')).toHaveCount(3);
  else await expect(box.locator('[data-live-sensors-none]')).toBeVisible();

  // standing still (no new fix): the auto-pause comes by itself, the band says so
  await expect(page.locator('[data-live-paused="auto"]')).toBeVisible({ timeout: 40_000 });
  await expect(page.locator('[data-live-paused="auto"]')).toContainText(T('Auto-pause'));

  // the data pages: the map is page 0, «next» shows the ready page «Ride»
  await tap(page.locator('[data-live-sheet-toggle]'), info);
  const pager = page.locator('[data-dp-pager]');
  await expect(pager).toHaveAttribute('data-dp-index', '0');
  await tap(page.locator('[data-dp-next]'), info);
  await expect(pager).toHaveAttribute('data-dp-index', '1');
  await expect(page.locator('[data-dp-page="ride"]')).toBeVisible();
  await expect(page.locator('[data-dp-page="ride"]')).toContainText(T('Ride|page'));
  await noSideways(page, 'data page');
  await tap(page.locator('[data-dp-dot="0"]'), info);
  await expect(pager).toHaveAttribute('data-dp-index', '0');
});
