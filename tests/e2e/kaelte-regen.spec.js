// «Kälte und Regen» (Noah 02.11.2026): on the live map the stops part shows cold and rain of the next 3 hours. Made-up sample race, every outside request mocked.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { sheetFull } from './live-sheet.js';

const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());

test('Live map: the next 3 hours show the cold and the rain with one sentence', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await context.route(/tiles\.openfreemap\.org|wmts\.geo\.admin\.ch|tile\.openstreetmap\.org|opentopomap|rainviewer/, (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64') }),
  );
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
  // a made-up forecast along the route: rain from the second hour on (kept like the one «Along the route» loads)
  await page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const now = Math.floor(Date.now() / 3600000) * 3600;
        const time = Array.from({ length: 12 }, (_, k) => now - 3600 + k * 3600);
        const fill = (f) => time.map((_, k) => f(k));
        const series = { hourly: { time, temperature_2m: fill(() => 12), apparent_temperature: fill(() => 12), wind_speed_10m: fill(() => 8), wind_direction_10m: fill(() => 180), precipitation_probability: fill((k) => (k >= 3 ? 80 : 5)), uv_index: fill(() => 1) } };
        const req = indexedDB.open('pack-generator');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const tx = req.result.transaction('meta', 'readwrite');
          tx.objectStore('meta').put({ key: 'race-wx:race-sample', at: new Date().toISOString(), data: { points: [{ km: 0, lat: 46, lon: 8 }, { km: 5000, lat: 46, lon: 9 }], series: [series, series] } });
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
      }),
  );
  await page.reload();
  await tap(page.locator('[data-live-start]'), info);
  await expect(page.locator('[data-live-full]')).toBeVisible();
  await sheetFull(page, info);

  const card = page.locator('[data-live-next3]');
  await card.scrollIntoViewIfNeeded();
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute('data-live-next3', 'rain');
  await expect(page.locator('[data-live-next3-say]')).toBeVisible();
  await expect(page.locator('[data-live-next3-rows] > span')).toHaveCount(4);
  // the hours with a likely rain are marked with colour and a symbol; the dry first hour is not
  await expect(page.locator('[data-live-next3-rows] [data-n3-rain="high"]').first()).toBeVisible();
  await expect(page.locator('[data-live-next3-rows] [data-n3-rain=""]').first()).toBeVisible();
  // the wet hours say what to put on
  await expect(page.locator('[data-live-next3-rows] [data-n3-wear="rain"]').first()).toBeVisible();
  // every hour says if it is light or dark there
  await expect(page.locator('[data-live-next3-rows] > span[data-n3-dark="day"], [data-live-next3-rows] > span[data-n3-dark="night"]')).toHaveCount(4);
});
