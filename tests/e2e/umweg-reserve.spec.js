// Reserve-Router (Noah 05.11.2026 «2a und b»): brouter.de answers 503, the (mocked) reserve router Valhalla plans the way,
// and the detour card says that a reserve planned it. Made-up places only; every outside request is mocked or blocked (openHome).
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

test('Live map: brouter.de does not answer, a reserve router plans the way and the card says so', async ({ page, context }, info) => {
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
    asked.push('brouter');
    return route.fulfill({ status: 503, body: 'busy' });
  });
  // Valhalla: a short made-up way, the line encoded with 6 digits
  const enc = (pts) => {
    let la = 0;
    let lo = 0;
    const one = (v) => {
      let n = v < 0 ? ~(v << 1) : v << 1;
      let s = '';
      while (n >= 32) {
        s += String.fromCharCode((32 | (n & 31)) + 63);
        n >>= 5;
      }
      return s + String.fromCharCode(n + 63);
    };
    return pts
      .map(([a2, b2]) => {
        const x = Math.round(a2 * 1e6);
        const y = Math.round(b2 * 1e6);
        const r = one(x - la) + one(y - lo);
        la = x;
        lo = y;
        return r;
      })
      .join('');
  };
  await context.route(/valhalla1\.openstreetmap\.de/, (route) => {
    asked.push('valhalla');
    return route.fulfill({ json: { trip: { legs: [{ shape: enc([[46.95, 7.45], [46.951, 7.449], [46.952, 7.451]]) }], summary: { length: 0.3, time: 120 } } } });
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
  await expect(sheet.locator('[data-router-note]')).toContainText(/brouter\.de/);
  await tap(sheet.locator('[data-reroute-go="shop"]').first(), info);
  await expect(sheet).toBeHidden({ timeout: 25_000 });
  expect(asked.slice(0, 2)).toEqual(['brouter', 'valhalla']);
  const card = page.locator('[data-live-detour]');
  await expect(card).toBeVisible();
  await expect(card).toContainText('test_data_gtp_ Beck');
  await expect(card.locator('[data-reserve-note]')).toBeVisible();
  const w = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(w).toBeLessThanOrEqual(1);
  await page.screenshot({ path: info.outputPath('umweg-reserve.png') });
});
