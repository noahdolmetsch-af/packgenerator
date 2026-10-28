// Paket U3 «Live-Karte» (Noah 19.10.2026 «während eines Rennens eine Seite mit einer Karte, meiner live
// location und Distanzen zu nächsten POI … auf allen Ausfahrten»): #/live/<trip> on the made-up sample
// race with a fake GPS at km 410 → 412: km along the route, the stops ahead with their distance, the next
// climb, the arrival, the SOS window with the coordinates, stop → the after-ride area. #/live without a
// tour: the stops around you (Overpass answered by the test). Every outside request is mocked or
// blocked (openHome); no sideways scroll on phone and desktop.
import { test, expect } from './clock.js';
import { openHome, homeFixture } from './home0460-fixture.js';

// the sample route as the app stored it (settings 'races'); km scaled like race.js lineKm
async function routeOf(page) {
  const route = await page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open('pack-generator');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const g = req.result.transaction('settings').objectStore('settings').get('races');
          g.onsuccess = () => resolve(g.result?.value?.races?.['race-sample']?.route ?? null);
          g.onerror = () => reject(g.error);
        };
      }),
  );
  const R = 6371;
  const rad = Math.PI / 180;
  const d = (a, b) => 2 * R * Math.asin(Math.sqrt(Math.sin(((b[0] - a[0]) * rad) / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(((b[1] - a[1]) * rad) / 2) ** 2));
  let k = 0;
  const raw = route.line.map((p, i) => ({ lat: p[0], lon: p[1], km: (k += i ? d(route.line[i - 1], p) : 0) }));
  return raw.map((p) => ({ ...p, km: (p.km * route.km) / k }));
}
let pts = [];
function pointAt(list, km) {
  for (let i = 1; i < list.length; i++) {
    if (list[i].km >= km) {
      const a = list[i - 1];
      const b = list[i];
      const f = (km - a.km) / (b.km - a.km);
      return { lat: a.lat + (b.lat - a.lat) * f, lon: a.lon + (b.lon - a.lon) * f };
    }
  }
  return list.at(-1);
}
const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const noSideways = async (page, where = '') => {
  const over = await page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    const bad = [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right + scrollX > w + 1);
    return { d: document.documentElement.scrollWidth - w, bad: bad.slice(0, 6).map((e) => `${e.tagName}.${e.className} ${Math.round(e.getBoundingClientRect().right)}`) };
  });
  expect(over.d, `${where} ${over.bad.join(' | ')}`).toBeLessThanOrEqual(1);
};
const at = (km) => {
  const p = pointAt(pts, km);
  return { latitude: p.lat, longitude: p.lon, accuracy: 6 };
};
const tiles = (context) =>
  context.route(/tiles\.openfreemap\.org|wmts\.geo\.admin\.ch|tile\.openstreetmap\.org|opentopomap|rainviewer/, (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64') }),
  );

test('Live map on the sample race: km, stops ahead, climb, arrival, SOS, stop', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await tiles(context);
  await context.grantPermissions(['geolocation']);
  // the sample race first (Touren › Rennen › Muster)
  await page.goto('./#/race');
  await tap(page.locator('[data-race-sample-open]'), info);
  await expect(page).toHaveURL(/#\/race\/race-sample$/);
  await expect(page.locator('[data-race-sample]')).toBeVisible();
  pts = await routeOf(page);
  await context.setGeolocation(at(410));
  await page.goto('./#/live/race-sample');
  await expect(page.locator('[data-page="live"]')).toBeVisible();
  await expect(page.locator('[data-live-empty]')).toBeVisible();
  await noSideways(page, 'before start');

  await tap(page.locator('[data-live-start]'), info);
  // the full view: the map, the band of numbers (3 at the start), the sheet with the next stop and climb
  const full = page.locator('[data-live-full]');
  await expect(full).toBeVisible();
  await expect(page.locator('[data-live-tile]')).toHaveCount(3);
  await expect(page.locator('[data-live-km]')).toContainText('410');
  await context.setGeolocation(at(412));
  await expect(page.locator('[data-live-km]')).toContainText('412', { timeout: 10_000 });
  await expect(page.locator('[data-live-left]')).toContainText('592');
  await expect(page.locator('[data-live-climb]')).toBeVisible();
  await expect(page.locator('[data-live-sheet]')).toHaveAttribute('data-live-sheet', 'peek');
  await noSideways(page, 'riding, map');
  await page.waitForTimeout(800);
  await page.screenshot({ path: info.outputPath('live-map.png') });
  // sideways on the handlebar: the map left, the numbers right
  if (phone(info)) {
    const size = page.viewportSize();
    await page.setViewportSize({ width: size.height, height: size.width });
    const band = await page.locator('[data-live-panel]').boundingBox();
    expect(band.x).toBeGreaterThan(size.height / 2);
    await noSideways(page, 'landscape');
    await page.screenshot({ path: info.outputPath('live-landscape.png') });
    await page.setViewportSize(size);
  }
  // pull the sheet up (a tap on the handle: peek → half → full on the phone; on the computer «Alles» opens at the right)
  await tap(page.locator('[data-live-sheet-toggle]'), info);
  await expect(page.locator('[data-live-sheet]')).toHaveAttribute('data-live-sheet', info.project.name === 'phone' ? 'half' : 'full');
  if (info.project.name === 'phone') await tap(page.locator('[data-live-sheet-toggle]'), info);
  await expect(page.locator('[data-live-sheet]')).toHaveAttribute('data-live-sheet', 'full');
  await expect(page.locator('[data-live-stop]')).toBeAttached();
  await expect(page.locator('[data-live-arrival]')).toBeVisible();
  const rows = page.locator('[data-live-stop-row]');
  await expect(rows.first()).toBeVisible();
  expect(await rows.count()).toBeGreaterThan(0);
  expect(await rows.count()).toBeLessThanOrEqual(5);
  await expect(rows.first().locator('[data-live-dist]')).toContainText('km');
  await expect(page.locator('[data-live-plan]')).toBeVisible();
  // the fine profile from your km, with your dot
  await page.locator('[data-live-full] [data-profile-fine]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-live-full] [data-profile-me]')).toBeVisible();
  // the weather along the route sits in the sheet too, the place search opens from it («In der Nähe»)
  await expect(page.locator('[data-live-full] [data-wx-timeline]')).toBeAttached();
  await expect(page.locator('[data-live-full] [data-live-near-open]')).toBeAttached();
  await expect(page.locator('[data-live-near] [data-poi-panel]')).toBeAttached();
  // one heading in the window (Noah 27.10.2026: two headings in the window were too much)
  await expect(page.locator('[data-live-near] h2, [data-live-near] h3')).toHaveCount(1);
  // the app at 130 % («Grösse», CSS zoom on <html>): still no sideways scroll
  await page.evaluate(() => (document.documentElement.style.zoom = '1.3'));
  await noSideways(page, 'zoom 130 %');
  await page.evaluate(() => (document.documentElement.style.zoom = ''));
  await noSideways(page, 'riding');

  // the Navigate menu: Google Maps and OsmAnd
  await tap(rows.first().locator('summary'), info);
  await expect(rows.first().locator('a[href*="google.com/maps/dir"]')).toBeVisible();
  await expect(rows.first().locator('a[href*="osmand.net"]')).toBeVisible();

  // choose a fourth number on top, then the options fold: everything off by default
  await page.locator('[data-live-numbers] summary').scrollIntoViewIfNeeded();
  await tap(page.locator('[data-live-numbers] summary'), info);
  await tap(page.locator('[data-live-tile-pick="height"]'), info);
  await expect(page.locator('[data-live-tile]')).toHaveCount(4);
  await expect(page.locator('[data-live-tile="height"]')).toContainText(/\d/);
  await page.locator('[data-live-options] summary').scrollIntoViewIfNeeded();
  await tap(page.locator('[data-live-options] summary'), info);
  for (const k of ['voice', 'offRoute', 'eatHm', 'battery', 'storm']) await expect(page.locator(`[data-live-opt="${k}"]`)).not.toBeChecked();

  // SOS in the «⋯» menu: the position big
  // Versteckte Funktionen (Noah 22.10.2026): «Notfall» one tap away on the map, not only in «⋯»
  await expect(page.locator('[data-live-sos-quick]')).toBeVisible();
  await tap(page.locator('[data-live-menu]'), info);
  await expect(page.locator('[data-live-menu-panel] [data-map-ground]')).toBeVisible();
  await noSideways(page, 'menu');
  await tap(page.locator('[data-live-sos]'), info);
  const sos = page.locator('[data-live-sos-sheet]');
  await expect(sos).toBeVisible();
  const p = pointAt(pts, 412);
  await expect(sos.locator('[data-live-sos-pos]')).toContainText(p.lat.toFixed(5).slice(0, 6));
  await expect(sos.locator('[data-live-sms]')).toHaveAttribute('href', /^sms:/);
  await expect(sos.locator('[data-live-call="rega"]')).toHaveAttribute('href', 'tel:1414');
  await expect(sos.locator('[data-live-station]')).toBeVisible();
  await noSideways(page, 'sos');
  await page.keyboard.press('Escape');
  await expect(sos).toBeHidden();

  // stop → the after-ride area
  await page.locator('[data-live-stop]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('live-sheet.png') });
  await tap(page.locator('[data-live-stop]'), info);
  await tap(page.locator('[data-live-end-yes]'), info); // «Fahrt beenden?» asks once (M9)
  await expect(page.locator('[data-live-after]')).toBeVisible();
  await expect(page.locator('[data-live-start]')).toBeVisible();
  await expect(full).toHaveCount(0);
  await noSideways(page, 'after');
});

test('Live map without a tour: the stops around you', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await tiles(context);
  const here = { lat: 46.95, lon: 7.45 };
  await context.route(/overpass/, (route) =>
    route.fulfill({
      json: {
        elements: [
          { type: 'node', id: 1, lat: 46.952, lon: 7.451, tags: { shop: 'bakery', name: 'test_data_gtp_ Beck', opening_hours: '24/7' } },
          { type: 'node', id: 2, lat: 46.949, lon: 7.455, tags: { amenity: 'drinking_water' } },
          { type: 'node', id: 3, lat: 46.96, lon: 7.44, tags: { railway: 'station', name: 'test_data_gtp_ Bahnhof' } },
        ],
      },
    }),
  );
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: here.lat, longitude: here.lon, accuracy: 10 });
  await page.goto('./#/live');
  await expect(page.locator('[data-live-empty]')).toBeVisible();
  // a ride without a tour: a GPX can be opened for it
  await expect(page.locator('[data-live-route]')).toBeVisible();
  await tap(page.locator('[data-live-start]'), info);
  await expect(page.locator('[data-live-next]')).toBeVisible();
  await expect(page.locator('[data-live-tile]')).toHaveCount(3);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: info.outputPath('live-free.png') });
  await tap(page.locator('[data-live-sheet-toggle]'), info);
  const stops = page.locator('[data-live-stops]');
  await expect(stops).toBeVisible();
  await expect(stops.getByText('test_data_gtp_ Beck')).toBeVisible();
  await expect(page.locator('[data-live-stop-row]')).toHaveCount(3);
  await noSideways(page, 'free ride');
  await page.locator('[data-live-stop]').scrollIntoViewIfNeeded();
  await tap(page.locator('[data-live-stop]'), info);
  await tap(page.locator('[data-live-end-yes]'), info); // «Fahrt beenden?» asks once (M9)
  await expect(page.locator('[data-live-after]')).toBeVisible();
});

// Noah 20.10.2026 «abgestürzt und zurück in die Live-Karte-Maske»: the page loads anew in the middle of a
// ride (a new version took over) → the ride goes on by itself, the kept points are still there.
test('Live map: after a reload in the middle of a ride, it goes on by itself', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await tiles(context);
  await context.route(/overpass/, (route) => route.fulfill({ json: { elements: [] } }));
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 46.95, longitude: 7.45, accuracy: 8 });
  await page.goto('./#/live');
  await tap(page.locator('[data-live-start]'), info);
  await expect(page.locator('[data-live-full]')).toBeVisible();
  await context.setGeolocation({ latitude: 46.952, longitude: 7.452, accuracy: 8 });
  await page.waitForTimeout(1500);
  await page.reload();
  await expect(page.locator('[data-live-full]')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('[data-live-resumed-full]')).toBeVisible();
  const pts = await page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open('pack-generator');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const g = req.result.transaction('tracks').objectStore('tracks').getAll();
          g.onsuccess = () => resolve(g.result.filter((r) => r.kind === 'rec' && r.open).map((r) => r.pts.length));
          g.onerror = () => reject(g.error);
        };
      }),
  );
  expect(pts.length).toBe(1);
  expect(pts[0]).toBeGreaterThan(0);
  await tap(page.locator('[data-live-resumed-full] button'), info);
  await expect(page.locator('[data-live-resumed-full]')).toBeHidden();
  await noSideways(page, 'resumed');
});

// Noah 28.10.2026 «wenn ich eine neue leere Tour starte, ohne GPX … ist immer noch ein altes Dings hinterlegt»
// (answer a «Ohne Route starten»): a GPX opened on the live map counts only for the ride it was opened for.
// A trip without a route starts without one; the last GPX is offered and, loaded, belongs to that trip.
test('Live map: a trip without a route starts without the old GPX, which is only offered', async ({ page, context }, info) => {
  const data = homeFixture();
  const line = Array.from({ length: 41 }, (_, i) => [46.93 + i * 0.002, 7.43 + i * 0.002]);
  data.tables.settings.push({ key: 'live-route', value: { name: 'test_data_gtp_ Alte Runde', line, km: 21 } });
  const trip = data.tables.trips.find((t) => !(t.route?.line?.length > 1));
  expect(trip).toBeTruthy();
  await openHome(page, context, info, { data });
  await page.goto(`./#/live/${trip.id}`);
  const box = page.locator('[data-live-route]');
  await expect(box).toBeVisible();
  // no route: the old GPX is only offered
  await expect(box.locator('[data-live-route-rename]')).toHaveCount(0);
  await expect(box.locator('[data-live-route-last]')).toContainText('test_data_gtp_ Alte Runde');
  await box.scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('gpx-angebot.png') });
  await tap(box.locator('[data-live-route-reuse]'), info);
  await expect(box.locator('[data-live-route-rename]')).toBeVisible();
  await expect(box.locator('[data-live-route-last]')).toHaveCount(0);
  const forTrip = await page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open('pack-generator');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const g = req.result.transaction('settings').objectStore('settings').get('live-route');
          g.onsuccess = () => resolve(g.result?.value?.forTrip ?? null);
          g.onerror = () => reject(g.error);
        };
      }),
  );
  expect(forTrip).toBe(trip.id);
  // a ride without a trip now starts without it, and gets the offer
  await page.goto('./#/live');
  await expect(page.locator('[data-live-route] [data-live-route-last]')).toBeVisible();
  await expect(page.locator('[data-live-route] [data-live-route-rename]')).toHaveCount(0);
});
