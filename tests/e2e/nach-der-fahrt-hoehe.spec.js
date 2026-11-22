// Nachprüfung Bikepacking (Noah 27.10.2026 «prüfe, ob wir wirklich alles so gemacht haben»): a free ride without a
// route keeps the GPS height, so «Your ride» shows the climbing and the elevation profile. Playwright's fake GPS
// has no height, so an init script adds one (rising 10 m a point). Fictional data; outside requests mocked.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const KM_LAT = 1 / 111.2;

test('After a ride without a route: climbing and the elevation profile from the GPS height', async ({ page, context }, info) => {
  await context.addInitScript(() => {
    const g = navigator.geolocation;
    if (!g) return;
    let n = 0;
    const up = (cb) => (pos) => cb({ timestamp: pos.timestamp, coords: { latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy, altitude: 600 + 10 * n++, speed: null, heading: null, altitudeAccuracy: 5 } });
    const watch = g.watchPosition.bind(g);
    const once = g.getCurrentPosition.bind(g);
    g.watchPosition = (ok, bad, o) => watch(up(ok), bad, o);
    g.getCurrentPosition = (ok, bad, o) => once(up(ok), bad, o);
  });
  await openHome(page, context, info);
  await context.route(/tiles\.openfreemap\.org|wmts\.geo\.admin\.ch|tile\.openstreetmap\.org|opentopomap|rainviewer/, (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64') }),
  );
  await context.route(/overpass/, (route) => route.fulfill({ json: { elements: [] } }));
  await context.grantPermissions(['geolocation']);
  const here = { lat: 46.95, lon: 7.45 };
  await context.setGeolocation({ latitude: here.lat, longitude: here.lon, accuracy: 6 });
  await page.goto('./#/live');
  await tap(page.locator('[data-live-start]'), info);
  await expect(page.locator('[data-live-stop]')).toBeAttached();
  for (let i = 1; i <= 8; i++) {
    await context.setGeolocation({ latitude: here.lat + 0.2 * i * KM_LAT, longitude: here.lon, accuracy: 6 });
    await page.waitForTimeout(400);
  }
  await tap(page.locator('[data-live-sheet-toggle]'), info);
  const stop = page.locator('[data-live-stop]');
  await stop.scrollIntoViewIfNeeded();
  await tap(stop, info);
  await tap(page.locator('[data-live-end-yes]'), info);
  const after = page.locator('[data-after-ride]');
  await expect(after).toBeVisible();
  // Touren c 70 (Noah «5a»): the feeling comes first; «Show the numbers without it» opens the numbers
  await tap(after.locator('[data-after-feel-skip]'), info);
  const hm = after.locator('[data-after-hm]');
  await expect(hm).toHaveAttribute('data-after-hm-from', 'gps');
  await expect(hm).toContainText(/\d+ m/);
  await expect(after.locator('[data-after-curve]').first()).toBeVisible();
  // «Diagramme zum Antippen» (PR 17): the curve is a chart: axis, exact value on pointing, a window behind a tap, «Als Tabelle»
  const chart = after.locator('[data-chart="after-height"]');
  await chart.scrollIntoViewIfNeeded();
  const plot = chart.locator('[data-plot]');
  await expect(plot).toHaveAttribute('data-n', /^\d+$/);
  const box = await plot.boundingBox();
  const at = { position: { x: box.width * 0.5, y: box.height / 2 } };
  await (phone(info) ? plot.tap(at) : plot.click(at));
  await expect(page.locator('[data-sensor-sheet]')).toContainText('m');
  await page.keyboard.press('Escape');
  await chart.getByRole('button', { name: /Als Tabelle|As table/ }).click();
  await expect(chart.locator('table tbody tr').first()).toBeVisible();
  await chart.getByRole('button', { name: /Diagramm|Chart/ }).first().click();
  await after.scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('nach-der-fahrt-hoehe.png') });
});
