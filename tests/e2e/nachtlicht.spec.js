// «Licht in der Nacht» (Noah 03.11.2026 «b», Paket D, Idee 20): on the live map, after sunset, the edge is darker and a cone of
// light lies ahead; by day nothing shows. Made-up sample race, every outside request mocked.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

async function ride(page, context, info, hour) {
  await openHome(page, context, info, { hour });
  await context.route(/tiles\.openfreemap\.org|wmts\.geo\.admin\.ch|tile\.openstreetmap\.org|opentopomap|rainviewer/, (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PNG }));
  await context.route(/overpass/, (route) => route.fulfill({ json: { elements: [] } }));
  await context.grantPermissions(['geolocation']);
  await page.goto('./#/race');
  await tap(page.locator('[data-race-sample-open]'), info);
  await expect(page.locator('[data-race-sample]')).toBeVisible();
  const line = await page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open('pack-generator');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const g = req.result.transaction('settings').objectStore('settings').get('races');
          g.onsuccess = () => resolve(g.result?.value?.races?.['race-sample']?.route?.line ?? null);
          g.onerror = () => reject(g.error);
        };
      }),
  );
  const i = Math.floor(line.length * 0.4);
  await context.setGeolocation({ latitude: line[i][0], longitude: line[i][1], accuracy: 6 });
  await page.goto('./#/live/race-sample');
  await tap(page.locator('[data-live-start]'), info);
  await expect(page.locator('[data-live-full]')).toBeVisible();
}

test('Live map at night: the edge is darker and a cone of light lies ahead', async ({ page, context }, info) => {
  await ride(page, context, info, 22);
  const nl = page.locator('[data-live-night-light]');
  await expect(nl).toHaveCount(1, { timeout: 15_000 });
  await expect(nl).toHaveAttribute('data-night-strength', '1.00');
  await expect(nl.locator('.cone')).toHaveCount(1);
  // it never catches a tap on the map
  expect(await nl.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe('none');
});

test('Live map by day: no night light', async ({ page, context }, info) => {
  await ride(page, context, info, 12);
  await expect(page.locator('[data-live-full]')).toBeVisible();
  await page.waitForTimeout(1500);
  await expect(page.locator('[data-live-night-light]')).toHaveCount(0);
});
