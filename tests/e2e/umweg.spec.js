// Paket X «Umweg neu planen» (Noah 20.10.2026 «unbedingt umsetzen»): on the live map «⋯ › Neu planen zu …»,
// choose a stop around you, the (mocked) bike router answers, the detour shows with km and «GPX für Garmin»,
// and it can be removed. Made-up places only; every outside request is mocked or blocked (openHome).
import { test, expect } from '@playwright/test';
import { openHome } from './home0460-fixture.js';

const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

test('Live map: plan a new way to a shop, see it, save it for the Garmin, remove it', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await context.route(/tiles\.openfreemap\.org|wmts\.geo\.admin\.ch|tile\.openstreetmap\.org|opentopomap|rainviewer/, (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PNG }));
  await context.route(/overpass/, (route) =>
    route.fulfill({
      json: {
        elements: [
          { type: 'node', id: 1, lat: 46.952, lon: 7.451, tags: { shop: 'bakery', name: 'test_data_gtp_ Beck' } },
          { type: 'node', id: 3, lat: 46.96, lon: 7.44, tags: { railway: 'station', name: 'test_data_gtp_ Bahnhof' } },
        ],
      },
    }),
  );
  const asked = [];
  await context.route(/brouter\.de\/brouter/, (route) => {
    asked.push(route.request().url());
    return route.fulfill({
      json: { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { 'track-length': '2400', 'filtered ascend': '18', 'total-time': '480' }, geometry: { type: 'LineString', coordinates: [[7.45, 46.95, 540], [7.4505, 46.951, 545], [7.451, 46.952, 550]] } }] },
    });
  });
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 46.95, longitude: 7.45, accuracy: 10 });
  await page.goto('./#/live');
  await tap(page.locator('[data-live-start]'), info);
  await expect(page.locator('[data-live-full]')).toBeVisible();
  await expect(page.locator('[data-live-next]')).toBeVisible();

  await tap(page.locator('[data-live-menu]'), info);
  await tap(page.locator('[data-live-reroute]'), info);
  const sheet = page.locator('[data-reroute-sheet]');
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('[data-reroute-list]')).toContainText('test_data_gtp_ Beck');
  await expect(sheet.locator('[data-reroute-profile="trekking"]')).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({ path: info.outputPath('umweg-sheet.png') });
  await tap(sheet.locator('[data-reroute-go="shop"]').first(), info);
  await expect(sheet).toBeHidden();
  expect(asked).toHaveLength(1);
  expect(asked[0]).toContain('profile=trekking');

  const card = page.locator('[data-live-detour]');
  await expect(card).toBeVisible();
  await expect(card).toContainText('test_data_gtp_ Beck');
  await expect(card).toContainText(/2[.,]4 km/);
  const dl = page.waitForEvent('download');
  // the GPX of the way lives in «⋯» (Navigation zum Ziel 2: the card on the map stays small)
  await tap(page.locator('[data-live-menu]'), info);
  await tap(page.locator('[data-live-menu-panel] [data-live-detour-garmin]'), info);
  const file = await dl;
  expect(file.suggestedFilename()).toMatch(/\.gpx$/);
  await expect(card.locator('[data-live-detour-gpx]')).toBeVisible();
  const w = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(w).toBeLessThanOrEqual(1);
  await page.screenshot({ path: info.outputPath('umweg-card.png') });

  // a reload keeps the detour; × only folds it to one line (Noah 28.10.2026), a tap opens it again
  await page.reload();
  await expect(page.locator('[data-live-detour]')).toBeVisible({ timeout: 15_000 });
  await tap(page.locator('[data-live-detour-off]'), info);
  const small = page.locator('[data-live-detour-small]');
  await expect(small).toBeVisible();
  await expect(page.locator('[data-live-detour-end]')).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('umweg-klein.png') });
  // folded stays folded after a reload
  await page.reload();
  await expect(page.locator('[data-live-detour-small]')).toBeVisible({ timeout: 15_000 });
  await tap(page.locator('[data-live-detour-small]'), info);
  await expect(page.locator('[data-live-detour-end]')).toBeVisible();
  // «Navigation beenden» ends it, Undo brings it back
  await tap(page.locator('[data-live-detour-end]'), info);
  await expect(page.locator('[data-live-detour]')).toHaveCount(0);
  await tap(page.locator('.undo'), info);
  await expect(page.locator('[data-live-detour]')).toBeVisible();
  await tap(page.locator('[data-live-detour-end]'), info);
  await expect(page.locator('[data-live-detour]')).toHaveCount(0);
});

test('Live map: the router does not answer → a clear line and the navigation apps', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await context.route(/tiles\.openfreemap\.org|wmts\.geo\.admin\.ch|tile\.openstreetmap\.org|opentopomap|rainviewer/, (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PNG }));
  await context.route(/overpass/, (route) => route.fulfill({ json: { elements: [{ type: 'node', id: 1, lat: 46.952, lon: 7.451, tags: { shop: 'bakery', name: 'test_data_gtp_ Beck' } }] } }));
  await context.route(/brouter\.de\/brouter/, (route) => route.fulfill({ status: 429, body: 'busy' }));
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 46.95, longitude: 7.45, accuracy: 10 });
  await page.goto('./#/live');
  await tap(page.locator('[data-live-start]'), info);
  await expect(page.locator('[data-live-next]')).toBeVisible();
  await tap(page.locator('[data-live-menu]'), info);
  await tap(page.locator('[data-live-reroute]'), info);
  const sheet = page.locator('[data-reroute-sheet]');
  await tap(sheet.locator('[data-reroute-go="shop"]').first(), info);
  await expect(sheet.locator('[data-reroute-error]')).toBeVisible();
  await expect(sheet.getByRole('link', { name: 'Google Maps' })).toBeVisible();
  await expect(page.locator('[data-live-detour]')).toHaveCount(0);
});
