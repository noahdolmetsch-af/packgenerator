// Wege-Gedächtnis (Noah 07.11.2026 «4a 5a»): after a ride the stretches get a thumb up or down; a bad one is kept
// out of a new way (BRouter circles), a good one only gets a sign; every mark can be renamed and deleted.
// Fictional places; the map, the places and the router are mocked.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
const KM_LAT = 1 / 111.2;
const here = { lat: 46.95, lon: 7.45 };

test('Ways memory: rate the stretches after a ride, avoid the bad one, change the marks later', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await context.route(/tiles\.openfreemap\.org|wmts\.geo\.admin\.ch|tile\.openstreetmap\.org|opentopomap|rainviewer/, (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PNG }));
  const end = here.lat + 6 * KM_LAT;
  await context.route(/overpass/, (route) => route.fulfill({ json: { elements: [{ type: 'node', id: 1, lat: end + 0.5 * KM_LAT, lon: here.lon, tags: { amenity: 'drinking_water', name: 'test_data_gtp_ Brunnen' } }] } }));
  const asked = [];
  await context.route(/brouter\.de\/brouter/, (route) => {
    asked.push(route.request().url());
    return route.fulfill({ json: { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { 'track-length': '500', 'filtered ascend': '2', 'total-time': '120' }, geometry: { type: 'LineString', coordinates: [[here.lon, end, 540], [here.lon, end + 0.5 * KM_LAT, 541]] } }] } });
  });
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: here.lat, longitude: here.lon, accuracy: 6 });
  await page.goto('./#/live');
  await tap(page.locator('[data-live-start]'), info);
  await expect(page.locator('[data-live-stop]')).toBeAttached();
  for (let i = 1; i <= 15; i++) {
    await context.setGeolocation({ latitude: here.lat + 0.4 * i * KM_LAT, longitude: here.lon, accuracy: 6 });
    await page.waitForTimeout(350);
  }
  await tap(page.locator('[data-live-sheet-toggle]'), info);
  const stop = page.locator('[data-live-stop]');
  await stop.scrollIntoViewIfNeeded();
  await tap(stop, info);
  await tap(page.locator('[data-live-end-yes]'), info);

  // after the ride: two stretches of about 3 km, the first good, the second to avoid
  const rating = page.locator('[data-way-rating]');
  await rating.scrollIntoViewIfNeeded();
  await expect(rating).toBeVisible();
  const rows = rating.locator('[data-way-section]');
  await expect(rows).toHaveCount(2);
  await tap(rows.nth(0).locator('[data-way-up]'), info);
  await tap(rows.nth(1).locator('[data-way-down]'), info);
  await expect(rows.nth(0).locator('[data-way-up]')).toHaveAttribute('aria-pressed', 'true');
  await expect(rows.nth(1).locator('[data-way-down]')).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({ path: info.outputPath('wege-bewerten.png') });

  // marks are kept: the list in the options of the live map
  await page.goto('./#/live');
  await page.reload();
  await page.locator('[data-live-options] summary').scrollIntoViewIfNeeded();
  await tap(page.locator('[data-live-options] summary'), info);
  const memory = page.locator('[data-way-memory]');
  await memory.scrollIntoViewIfNeeded();
  await expect(memory.locator('[data-way-row]')).toHaveCount(2);
  await page.screenshot({ path: info.outputPath('wege-gemerkt.png') });

  // rename the first, delete the second after the question
  const first = memory.locator('[data-way-row]').first();
  await tap(first.locator('[data-way-rename]'), info);
  await first.locator('[data-way-name-input]').fill('Radweg am Fluss');
  await tap(first.locator('[data-way-name-save]'), info);
  await expect(memory.locator('[data-way-name]', { hasText: 'Radweg am Fluss' })).toBeVisible();
  await tap(memory.locator('[data-way-row]').nth(1).locator('[data-way-delete]'), info);
  await tap(page.locator('[data-testid="ask-delete"] .del'), info);
  await expect(memory.locator('[data-way-row]')).toHaveCount(1);

  // bring the bad mark back by changing the first one to «avoid»: it is kept out of a new way
  await tap(memory.locator('[data-way-row]').first().locator('[data-way-down]'), info);
  await expect(memory.locator('[data-way-row]').first().locator('[data-way-down]')).toHaveAttribute('aria-pressed', 'true');
  await context.setGeolocation({ latitude: here.lat + 2 * KM_LAT, longitude: here.lon, accuracy: 6 });
  await tap(page.locator('[data-live-start]'), info);
  await expect(page.locator('[data-live-full]')).toBeVisible();
  await tap(page.locator('[data-live-menu]'), info);
  await tap(page.locator('[data-live-reroute]'), info);
  const sheet = page.locator('[data-reroute-sheet]');
  await expect(sheet.locator('[data-reroute-avoid]')).toBeVisible();
  await expect(sheet.locator('[data-reroute-list]')).toBeVisible();
  await tap(sheet.locator('[data-reroute-list] [data-reroute-go]').first(), info);
  await expect.poll(() => asked.some((u) => u.includes('nogos='))).toBe(true);
});
