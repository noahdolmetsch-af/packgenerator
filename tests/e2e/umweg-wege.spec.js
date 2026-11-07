// Live-Navigation Schritt 5 (Noah 31.10.2026 «1-5 a»): the router knows more than one way to a goal; the
// window shows them side by side (km, time, climb, the best in each) and the chosen one becomes the way.
// Made-up places only; the bike router and the map are mocked.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
const WAYS = [
  { km: '3000', up: '60', s: '600', mid: [7.4515, 46.9505] },
  { km: '3400', up: '20', s: '720', mid: [7.4525, 46.9515] },
  { km: '3100', up: '45', s: '540', mid: [7.4498, 46.9512] },
];

// BRouter's message table: what the way is made of (belag.js)
const HEAD = ['Longitude', 'Latitude', 'Elevation', 'Distance', 'CostPerKm', 'ElevCost', 'TurnCost', 'NodeCost', 'InitialCost', 'WayTags', 'NodeTags', 'Time', 'Energy'];
const seg = (d, tags) => ['7450000', '46950000', '540', String(d), '0', '0', '0', '0', '0', tags, '', '0', '0'];
const MESSAGES = [HEAD, seg(1900, 'highway=residential surface=asphalt'), seg(460, 'highway=track surface=gravel'), seg(40, 'highway=steps')];

test('Live: the router shows three ways to a goal, the chosen one is the way', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await context.route(/tiles\.openfreemap\.org|wmts\.geo\.admin\.ch|tile\.openstreetmap\.org|opentopomap|rainviewer/, (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PNG }));
  await context.route(/overpass/, (route) =>
    route.fulfill({ json: { elements: [{ type: 'node', id: 1, lat: 46.952, lon: 7.451, tags: { amenity: 'drinking_water', name: 'test_data_gtp_ Brunnen' } }] } }),
  );
  const asked = [];
  await context.route(/brouter\.de\/brouter/, (route) => {
    const url = route.request().url();
    const i = Number(new URL(url).searchParams.get('alternativeidx'));
    asked.push(i);
    const w = WAYS[i];
    return route.fulfill({
      json: { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { 'track-length': w.km, 'filtered ascend': w.up, 'total-time': w.s, messages: MESSAGES }, geometry: { type: 'LineString', coordinates: [[7.45, 46.95, 540], [...w.mid, 545], [7.451, 46.952, 550]] } }] },
    });
  });
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 46.95, longitude: 7.45, accuracy: 10 });
  await page.goto('./#/live');
  await tap(page.locator('[data-live-start]'), info);
  await expect(page.locator('[data-live-full]')).toBeVisible();
  await tap(page.locator('[data-live-menu]'), info);
  await tap(page.locator('[data-live-reroute]'), info);
  const sheet = page.locator('[data-reroute-sheet]');
  await expect(sheet.locator('[data-reroute-list]')).toBeVisible();
  await tap(sheet.locator('[data-reroute-list] [data-reroute-go]').first(), info);

  // three ways side by side, nothing planned yet
  const alts = sheet.locator('[data-reroute-alts]');
  await expect(alts).toBeVisible();
  await expect(alts.locator('[data-reroute-alt]')).toHaveCount(3);
  expect(asked).toEqual([0, 1, 2]);
  await expect(page.locator('[data-live-detour]')).toHaveCount(0);
  // «Belag und Schwierigkeit»: every way tells its surface
  await expect(alts.locator('[data-reroute-alt] [data-surface]')).toHaveCount(3);
  await expect(alts.locator('[data-reroute-alt="0"]')).toContainText(/Shortest|Kürzester/);
  await expect(alts.locator('[data-reroute-alt="1"]')).toContainText(/Flattest|Flachster/);
  await expect(alts.locator('[data-reroute-alt="2"]')).toContainText(/Fastest|Schnellster/);
  const w = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(w).toBeLessThanOrEqual(1);
  await page.screenshot({ path: info.outputPath('wege-auswahl.png') });

  // «Other place» goes back to the list; a way taken becomes the way to the goal
  await tap(alts.locator('[data-reroute-alts-back]'), info);
  await expect(sheet.locator('[data-reroute-list]')).toBeVisible();
  await tap(sheet.locator('[data-reroute-list] [data-reroute-go]').first(), info);
  await tap(sheet.locator('[data-reroute-take="1"]'), info);
  await expect(sheet).toBeHidden();
  const card = page.locator('[data-live-detour]');
  await expect(card).toBeVisible();
  // the second way: 20 m up, 12 min (the card counts the km left on the line itself)
  await expect(card).toContainText(/20 m/);
  await expect(card).toContainText(/12 min/);
});
