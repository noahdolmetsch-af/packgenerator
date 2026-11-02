// Live-Navigation Schritt 4 (Noah 31.10.2026 «1-5 a»): off the way to a goal the app plans a new way from
// here to the same goal, with Undo. Made-up places only; the bike router and the map are mocked.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
const geo = (latitude, longitude) => ({ latitude, longitude, accuracy: 10 });

test('Live: off the way to a goal the app plans a new way to the same goal, Undo brings the old one back', async ({ page, context }, info) => {
  test.setTimeout(120_000);
  await openHome(page, context, info);
  await context.route(/tiles\.openfreemap\.org|wmts\.geo\.admin\.ch|tile\.openstreetmap\.org|opentopomap|rainviewer/, (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PNG }));
  await context.route(/overpass/, (route) =>
    route.fulfill({ json: { elements: [{ type: 'node', id: 1, lat: 46.952, lon: 7.451, tags: { shop: 'bakery', name: 'test_data_gtp_ Beck' } }] } }),
  );
  const asked = [];
  await context.route(/brouter\.de\/brouter/, (route) => {
    if (route.request().url().includes('alternativeidx=0')) asked.push(route.request().url()); // «Wege zur Auswahl» also asks for the other ways
    return route.fulfill({
      json: { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { 'track-length': '2400', 'filtered ascend': '18', 'total-time': '480' }, geometry: { type: 'LineString', coordinates: [[7.45, 46.95, 540], [7.4505, 46.951, 545], [7.451, 46.952, 550]] } }] },
    });
  });
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation(geo(46.95, 7.45));
  await page.goto('./#/live');
  await tap(page.locator('[data-live-start]'), info);
  await expect(page.locator('[data-live-full]')).toBeVisible();
  await tap(page.locator('[data-live-menu]'), info);
  await tap(page.locator('[data-live-reroute]'), info);
  await tap(page.locator('[data-reroute-sheet] [data-reroute-go="shop"]').first(), info);
  const card = page.locator('[data-live-detour]');
  await expect(card).toBeVisible();
  expect(asked).toHaveLength(1);

  // 700 m beside the way: not at once, a few seconds first
  let t = await page.evaluate(() => Date.now());
  const goTo = async (lat, lon, s = 5) => {
    t += s * 1000;
    await page.clock.setFixedTime(t);
    await context.setGeolocation(geo(lat, lon));
    await page.waitForTimeout(2600); // the live map looks every 2 s
  };
  await goTo(46.9505, 7.4395);
  await goTo(46.9505, 7.4385);
  expect(asked).toHaveLength(1);
  await goTo(46.9505, 7.4384, 20);
  await expect.poll(() => asked.length, { timeout: 10_000 }).toBe(2);
  await expect(card).toBeVisible();
  const w = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(w).toBeLessThanOrEqual(1);
  // Undo brings the old way back, and it stays: no new plan for a minute
  await tap(page.locator('.undo'), info);
  await expect(card).toBeVisible();
  expect(asked).toHaveLength(2);
});
