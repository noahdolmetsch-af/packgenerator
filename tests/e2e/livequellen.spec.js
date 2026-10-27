// Live-Karte Teil 3 (Noah 20.10.2026): the public transport near you in the sheet (stops, then the next
// departures; the timetable answered by the test), an own place by a tap on the live map, and the picture
// to share after the ride. Fake GPS, every outside request mocked or blocked (openHome); no sideways scroll.
import { test, expect } from '@playwright/test';
import { openHome } from './home0460-fixture.js';

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
const HERE = { lat: 46.95, lon: 7.45 };
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

async function startRide(page, context, info) {
  const T = await openHome(page, context, info);
  await context.route(/tiles\.openfreemap\.org|wmts\.geo\.admin\.ch|tile\.openstreetmap\.org|opentopomap|rainviewer/, (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PNG }));
  await context.route(/overpass/, (route) => route.fulfill({ json: { elements: [] } }));
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: HERE.lat, longitude: HERE.lon, accuracy: 8 });
  await page.goto('./#/live');
  await tap(page.locator('[data-live-start]'), info);
  await expect(page.locator('[data-live-full]')).toBeVisible();
  return T;
}
// a tap on the handle: peek → half → full
const openSheet = async (page, info) => {
  const sh = page.locator('[data-live-sheet]');
  for (let i = 0; i < 3 && (await sh.getAttribute('data-live-sheet')) !== 'full'; i++) {
    const was = await sh.getAttribute('data-live-sheet');
    await tap(page.locator('[data-live-sheet-toggle]'), info);
    await expect(sh).not.toHaveAttribute('data-live-sheet', was);
  }
  await expect(sh).toHaveAttribute('data-live-sheet', 'full');
};

test('Public transport near you: stops nearest first, then the next departures', async ({ page, context }, info) => {
  const T = await startRide(page, context, info);
  const now = await page.evaluate(() => Date.now());
  const calls = [];
  await context.route(/packgen-three\.vercel\.app\/api\/lake\?action=ov-/, (route) => {
    const url = route.request().url();
    calls.push(url);
    if (url.includes('ov-stops')) {
      return route.fulfill({
        json: {
          stops: [
            { id: '8500001', name: 'test_data_gtp_ Bahnhof', lat: 46.951, lon: 7.451, distM: 140, kind: 'train' },
            { id: '8500002', name: 'test_data_gtp_ Dorfplatz', lat: 46.953, lon: 7.452, distM: 380, kind: 'bus' },
          ],
        },
      });
    }
    const at = (min) => new Date(now + min * 60000).toISOString();
    return route.fulfill({
      json: {
        stop: { id: '8500001', name: 'test_data_gtp_ Bahnhof' },
        departures: [
          { at: at(7), time: '09:07', line: 'S1', category: 'S', to: 'test_data_gtp_ Ziel', platform: '2', platformChanged: false, delayMin: 0, expected: '' },
          { at: at(19), time: '09:19', line: 'IR 15', category: 'IR', to: 'test_data_gtp_ Stadt', platform: '3', platformChanged: true, delayMin: 2, expected: '09:21' },
        ],
      },
    });
  });
  await openSheet(page, info);
  const ov = page.locator('[data-live-sheet] [data-ov-nearby]');
  await ov.scrollIntoViewIfNeeded();
  await expect(ov).toBeVisible();
  // nothing is asked by itself
  expect(calls).toHaveLength(0);
  await tap(ov.getByRole('button', { name: T('Find stops') }), info);
  await expect(ov.locator('[data-ov-stop]')).toHaveCount(2);
  await expect(ov.locator('[data-ov-stop]').first()).toContainText('test_data_gtp_ Bahnhof');
  expect(calls[0]).toContain(`lat=${HERE.lat}`);
  await tap(ov.locator('[data-ov-stop="8500001"]'), info);
  await expect(ov.locator('[data-ov-dep]')).toHaveCount(2);
  await expect(ov.locator('[data-ov-dep]').first()).toContainText('S1');
  await expect(ov.locator('[data-ov-dep]').nth(1)).toContainText('+2');
  await noSideways(page, 'public transport');

  // SchweizMobil: the cycling routes as a layer on the map, switched on in the «…» menu
  const velo = [];
  page.on('request', (r) => r.url().includes('ch.astra.veloland') && velo.push(r.url()));
  await tap(page.locator('[data-live-menu]'), info);
  const chip = page.locator('[data-live-menu-panel] [data-map-layer="veloland"]');
  await chip.scrollIntoViewIfNeeded();
  await expect(chip).toHaveAttribute('aria-pressed', 'false');
  await tap(chip, info);
  await expect(chip).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => velo.length, { timeout: 15_000 }).toBeGreaterThan(0);
  expect(velo[0]).toMatch(/wmts\.geo\.admin\.ch\/1\.0\.0\/ch\.astra\.veloland\/default\/current\/3857\/\d+\/\d+\/\d+\.png/);
});

test('An own place by a tap on the live map, then the picture to share after the ride', async ({ page, context }, info) => {
  // the share sheet is left out, so the picture comes as a download on every device
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
  });
  const T = await startRide(page, context, info);
  await openSheet(page, info);
  const panel = page.locator('[data-poi-panel]');
  await panel.scrollIntoViewIfNeeded();
  await tap(panel.locator('[data-poi-own-toggle]'), info);
  const add = panel.locator('[data-poi-own-add-tap]');
  await add.scrollIntoViewIfNeeded();
  await tap(add, info);
  // the sheet goes down so the map is free; a tap on the map opens the new place
  await expect(page.locator('[data-live-sheet]')).toHaveAttribute('data-live-sheet', 'peek');
  const map = page.locator('[data-live-full] .maplibregl-canvas').first();
  await expect(map).toBeVisible();
  const box = await map.boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 3);
  const sheet = page.locator('dialog[open]');
  await expect(sheet.locator('[data-own-name]')).toBeVisible();
  await sheet.locator('[data-own-name]').fill('test_data_gtp_ Rastplatz');
  await sheet.getByRole('button', { name: T('Save'), exact: true }).click();
  await openSheet(page, info);
  await expect(panel.locator('[data-poi-own-row]')).toHaveCount(1);
  await expect(panel.locator('[data-poi-own-row]')).toContainText('test_data_gtp_ Rastplatz');

  // ride a little, stop, the picture
  await context.setGeolocation({ latitude: HERE.lat + 0.01, longitude: HERE.lon, accuracy: 8 });
  await expect(page.locator('[data-live-km]')).not.toContainText(/^0([.,]0)?\b/, { timeout: 10_000 });
  await page.locator('[data-live-stop]').scrollIntoViewIfNeeded();
  await tap(page.locator('[data-live-stop]'), info);
  await tap(page.locator('[data-live-end-yes]'), info); // «Fahrt beenden?» asks once (M9)
  const after = page.locator('[data-after-share]');
  await after.scrollIntoViewIfNeeded();
  await expect(after).toBeVisible();
  await expect(after.locator('[data-after-share-line]')).toBeChecked();
  const [dl] = await Promise.all([page.waitForEvent('download'), tap(after.locator('[data-after-share-btn]'), info)]);
  expect(dl.suggestedFilename()).toMatch(/^fahrt-.*\.png$/);
  const file = await dl.path();
  const { readFileSync } = await import('node:fs');
  const head = readFileSync(file).subarray(0, 8);
  expect(head.toString('hex')).toBe('89504e470d0a1a0a');
  await expect(after.locator('[data-after-share-done]')).toContainText(T('Saved as a picture in your downloads.'));
  await noSideways(page, 'after ride');
});
