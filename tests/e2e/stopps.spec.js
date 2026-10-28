// «Stopps in der Nähe» (Noah 24.10.2026 «1a 2a 3a 4b 5a»): the button on Heute opens the stops page; around you
// a made-up fountain, petrol station, cash machine and pharmacy show with their distance; a kind switched off
// goes; the button on Heute can be hidden and comes back. Along the route of the made-up sample race the page
// loads the stops itself. On the live map «Stops» holds the next stops, the switch route / around me and the
// place search; «Choose a goal» waits for a tap on the map. Every outside request is mocked or blocked.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { sheetFull } from './live-sheet.js';

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
const tiles = (context) =>
  context.route(/tiles\.openfreemap\.org|wmts\.geo\.admin\.ch|tile\.openstreetmap\.org|opentopomap|rainviewer/, (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64') }),
  );
const HERE = { lat: 46.95, lon: 7.45 };
const node = (id, dLat, tags, at = HERE) => ({ type: 'node', id, lat: at.lat + dLat, lon: at.lon, tags });

test('Stops nearby: from Today, around me, kinds, hide the button', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: HERE.lat, longitude: HERE.lon, accuracy: 10 });
  await context.route(/overpass/, (route) =>
    route.fulfill({
      json: {
        elements: [
          node(1, 0.003, { amenity: 'drinking_water', name: 'test_data_gtp_ Brunnen' }),
          node(2, 0.009, { amenity: 'fuel', name: 'test_data_gtp_ Tankstelle', opening_hours: '24/7' }),
          node(3, 0.0045, { amenity: 'atm' }),
          node(4, 0.018, { amenity: 'pharmacy', name: 'test_data_gtp_ Apotheke' }),
        ],
      },
    }),
  );
  const go = page.locator('[data-heute-stops-go]');
  await expect(go).toBeVisible();
  await tap(go, info);
  await expect(page).toHaveURL(/#\/stopps$/);
  await expect(page.locator('[data-page="stopps"]')).toBeVisible();
  const rows = page.locator('[data-stops-row]');
  await expect(rows).toHaveCount(4);
  await expect(rows.first()).toHaveAttribute('data-stops-row', 'water');
  await expect(page.getByText('test_data_gtp_ Tankstelle')).toBeVisible();
  await expect(page.locator('[data-stops-row="atm"]')).toContainText(T('ATM|poi'));
  await noSideways(page, 'stops around');
  // water off: the fountain goes
  await tap(page.locator('[data-stops-kind="water"]'), info);
  await expect(page.locator('[data-stops-row="water"]')).toHaveCount(0);
  await expect(rows).toHaveCount(3);
  await tap(page.locator('[data-stops-all]'), info);
  await expect(rows).toHaveCount(4);
  // the button on Today: hidden here, then gone on Today; «×» on Today hides it too, with Undo
  await page.locator('[data-stops-heute]').uncheck();
  await expect(page.locator('[data-stops-heute]')).not.toBeChecked();
  await page.goto('./#/');
  await expect(page.locator('[data-section="greeting"]')).toBeVisible();
  await expect(page.locator('[data-heute-stops]')).toHaveCount(0);
  await page.goto('./#/stopps');
  await expect(page.locator('[data-stops-heute]')).not.toBeChecked();
  await page.locator('[data-stops-heute]').check();
  await page.goto('./#/');
  await tap(page.locator('[data-heute-stops-hide]'), info);
  await expect(page.locator('[data-heute-stops]')).toHaveCount(0);
  await page.getByRole('button', { name: T('Undo') }).first().click();
  await expect(page.locator('[data-heute-stops]')).toBeVisible();
});

test('Stops nearby along a route, and the part Stops on the live map', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await tiles(context);
  await context.grantPermissions(['geolocation']);
  await page.goto('./#/race');
  await tap(page.locator('[data-race-sample-open]'), info);
  await expect(page).toHaveURL(/#\/race\/race-sample$/);
  const start = await page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open('pack-generator');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const g = req.result.transaction('settings').objectStore('settings').get('races');
          g.onsuccess = () => {
            const p = g.result?.value?.races?.['race-sample']?.route?.line?.[3];
            resolve({ lat: p[0], lon: p[1] });
          };
          g.onerror = () => reject(g.error);
        };
      }),
  );
  await context.setGeolocation({ latitude: start.lat, longitude: start.lon, accuracy: 10 });
  await context.route(/overpass/, (route) => route.fulfill({ json: { elements: [node(9, 0.0005, { amenity: 'fuel', name: 'test_data_gtp_ Tankstelle Strecke' }, start), node(10, -0.0005, { amenity: 'toilets' }, start)] } }));
  await page.goto('./#/stopps?trip=race-sample');
  await expect(page.locator('[data-page="stopps"] .seg button[data-key="route"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-stops-trip]')).toBeVisible();
  await expect(page.getByText('test_data_gtp_ Tankstelle Strecke')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('[data-stops-row="toilet"]')).toBeVisible();
  await noSideways(page, 'stops along');

  // the live map: one part «Stops» with the switch, the next stops and the place search
  await page.goto('./#/live/race-sample');
  await tap(page.locator('[data-live-start]'), info);
  await expect(page.locator('[data-live-full]')).toBeVisible();
  // «Choose a goal»: the hint, then cancel
  await tap(page.locator('[data-live-goal]'), info);
  await expect(page.locator('[data-live-goal-hint]')).toBeVisible();
  await tap(page.locator('[data-live-goal-hint] button'), info);
  await expect(page.locator('[data-live-goal-hint]')).toHaveCount(0);
  await sheetFull(page, info);
  const stops = page.locator('[data-live-stops]');
  await stops.scrollIntoViewIfNeeded();
  await expect(stops.locator('[data-live-places] [data-live-near-open]')).toBeVisible();
  await expect(page.locator('[data-live-near] [data-poi-panel]')).toBeAttached();
  await expect(stops.locator('[data-live-stops-mode] button[data-key="route"]')).toHaveAttribute('aria-pressed', 'true');
  await tap(stops.locator('[data-live-stops-mode] button[data-key="around"]'), info);
  await expect(stops.locator('[data-live-stops-mode] button[data-key="around"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(stops.locator('[data-live-stop-row="fuel"]').first()).toBeVisible({ timeout: 20_000 });
  await noSideways(page, 'live stops');
});
