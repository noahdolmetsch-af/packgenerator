// «Letzter offener Laden vor der Nacht» (Noah 02.11.2026): on the live map the stops part names the last shop
// you reach open and before sunset. Made-up sample race, every outside request mocked.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { sheetFull } from './live-sheet.js';

const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());

test('Live map: the last open shop before the night shows with its closing time', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await context.route(/tiles\.openfreemap\.org|wmts\.geo\.admin\.ch|tile\.openstreetmap\.org|opentopomap|rainviewer/, (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64') }),
  );
  let near = null;
  await context.route(/overpass/, (route) =>
    route.fulfill({ json: { elements: near ? [{ type: 'node', id: 91, lat: near.lat, lon: near.lon, tags: { shop: 'supermarket', name: 'test_data_gtp_ Laden', opening_hours: 'Mo-Su 00:00-23:59' } }] : [] } }),
  );
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
  near = { lat: line[i + 2][0], lon: line[i + 2][1] };
  await page.goto('./#/live/race-sample');
  await tap(page.locator('[data-live-start]'), info);
  await expect(page.locator('[data-live-full]')).toBeVisible();
  await sheetFull(page, info);

  // the sample race has its own shops: the card names one (the last open one, or the nearest when it is dark)
  const card = page.locator('[data-live-lastshop]');
  await card.scrollIntoViewIfNeeded();
  await expect(card).toBeVisible();
  await expect(page.locator('[data-live-lastshop-row]')).toBeVisible();
  await expect(card).toHaveAttribute('data-live-lastshop', /^(ok|none|dark)$/);

  // loading the stops along the route keeps the card in place
  await tap(page.locator('[data-live-stops] .rc-acts button'), info);
  await expect(page.locator('[data-live-lastshop-row]')).toBeVisible({ timeout: 15_000 });
});
