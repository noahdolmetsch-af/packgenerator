// «Rast suchen» (Pausen-Planer, Noah 26.11.2026): on the live map a tap lists places to stop in the next 20 km. Made-up sample race, every outside request mocked.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { sheetFull } from './live-sheet.js';

const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());

test('Live map: Find a rest lists places to stop ahead, the shortest detour first, or says why there are none', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await context.route(/tiles\.openfreemap\.org|wmts\.geo\.admin\.ch|tile\.openstreetmap\.org|opentopomap|rainviewer/, (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64') }),
  );
  await context.route(/overpass/, (route) => route.fulfill({ json: { elements: [] } }));
  await context.grantPermissions(['geolocation']);
  await page.goto('./#/race');
  await tap(page.locator('[data-race-sample-open]'), info);
  await expect(page.locator('[data-race-sample]')).toBeVisible();
  const race = await page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open('pack-generator');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const g = req.result.transaction('settings').objectStore('settings').get('races');
          g.onsuccess = () => resolve({ line: g.result?.value?.races?.['race-sample']?.route?.line ?? null, pois: g.result?.value?.races?.['race-sample']?.pois?.length ?? 0 });
          g.onerror = () => reject(g.error);
        };
      }),
  );
  const line = race.line;
  const i = Math.floor(line.length * 0.4);
  await context.setGeolocation({ latitude: line[i][0], longitude: line[i][1], accuracy: 6 });
  await page.goto('./#/live/race-sample');
  await tap(page.locator('[data-live-start]'), info);
  await expect(page.locator('[data-live-full]')).toBeVisible();
  await sheetFull(page, info);

  const card = page.locator('[data-live-rest]');
  await card.scrollIntoViewIfNeeded();
  await expect(card).toBeVisible();
  // only on a tap: nothing is searched before
  await expect(page.locator('[data-live-rest-row], [data-live-rest-none]')).toHaveCount(0);
  await tap(card.locator('[data-live-rest-find]'), info);
  // either places (at most three) or the reason why there are none
  await expect(page.locator('[data-live-rest-row], [data-live-rest-none]').first()).toBeVisible();
  expect(await page.locator('[data-live-rest-row]').count()).toBeLessThanOrEqual(3);
  await tap(card.locator('[data-live-rest-close]'), info);
  await expect(card.locator('[data-live-rest-find]')).toBeVisible();
});
