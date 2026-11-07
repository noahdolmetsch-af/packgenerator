// Wetter-Ausweichen (Noah 07.11.2026 «1b 2a 3a»): heavy rain or a thunderstorm ahead → the card names the nearest roof
// and «Plan there» opens the planner with that place. Made-up places only; forecast, map and router are mocked.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

async function ride(page, context, info, codes) {
  await openHome(page, context, info);
  await context.route(/tiles\.openfreemap\.org|wmts\.geo\.admin\.ch|tile\.openstreetmap\.org|opentopomap|rainviewer/, (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PNG }));
  await context.route(/overpass/, (route) =>
    route.fulfill({ json: { elements: [{ type: 'node', id: 7, lat: 46.955, lon: 7.455, tags: { amenity: 'shelter', shelter_type: 'weather_shelter', name: 'test_data_gtp_ Unterstand' } }] } }),
  );
  // the storm check asks several points at once; the answer is one object for the point
  await context.route(/api\.open-meteo\.com\/v1\/forecast\?.*hourly=weather_code%2Ccape%2Cprecipitation/, async (route) => {
    const now = await page.evaluate(() => Date.now());
    const h0 = Math.floor(now / 36e5) * 3600;
    await route.fulfill({ json: { hourly: { time: [h0, h0 + 3600, h0 + 7200], weather_code: codes, cape: [0, 0, 0], precipitation: [0, 0, 0] } } });
  });
  await context.route(/brouter\.de\/brouter/, (route) =>
    route.fulfill({ json: { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { 'track-length': '900', 'filtered ascend': '5', 'total-time': '200' }, geometry: { type: 'LineString', coordinates: [[7.45, 46.95, 540], [7.455, 46.955, 545]] } }] } }),
  );
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 46.95, longitude: 7.45, accuracy: 10 });
  await page.goto('./#/live');
  // the alert is an option (off by default): switch it on before the ride
  await page.locator('[data-live-options] summary').scrollIntoViewIfNeeded();
  await tap(page.locator('[data-live-options] summary'), info);
  await page.locator('[data-live-opt="storm"]').check();
  await tap(page.locator('[data-live-start]'), info);
  await expect(page.locator('[data-live-full]')).toBeVisible();
}

test('Live: heavy rain ahead names the nearest roof and plans there on a tap', async ({ page, context }, info) => {
  await ride(page, context, info, [1, 65, 3]);
  await expect(page.locator('[data-live-storm="rain"]')).toBeVisible();
  const card = page.locator('[data-live-shelter]');
  await expect(card).toBeVisible();
  await expect(card).toContainText('test_data_gtp_ Unterstand');
  await page.screenshot({ path: info.outputPath('regen-dach.png') });
  // nothing is planned by itself
  await expect(page.locator('[data-live-detour]')).toHaveCount(0);
  await tap(card.locator('[data-live-shelter-plan]'), info);
  const sheet = page.locator('[data-reroute-sheet]');
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('[data-reroute-go="pick"]')).toBeVisible();
  await tap(sheet.locator('[data-reroute-go="pick"]'), info);
  await expect(page.locator('[data-live-detour]')).toBeVisible();
});

test('Live: a thunderstorm keeps its own line, and Not now hides the roof', async ({ page, context }, info) => {
  await ride(page, context, info, [1, 95, 3]);
  await expect(page.locator('[data-live-storm="storm"]')).toBeVisible();
  await expect(page.locator('[data-live-shelter]')).toBeVisible();
  await tap(page.locator('[data-live-shelter-skip]'), info);
  await expect(page.locator('[data-live-shelter]')).toHaveCount(0);
  await expect(page.locator('[data-live-storm="storm"]')).toBeVisible();
});
