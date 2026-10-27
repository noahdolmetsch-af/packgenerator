// Noah 22.10.2026 (picture): «Stopps entlang der Strecke laden» on the live map did nothing. The app asked
// OpenStreetMap for the whole route at once; the free server gave up and answered with an empty list and
// a «runtime error» note. Now the button asks for the stretch ahead in small pieces and says under
// itself when nothing came or the server gave up. Made-up sample race, every outside request mocked.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const tiles = (context) =>
  context.route(/tiles\.openfreemap\.org|wmts\.geo\.admin\.ch|tile\.openstreetmap\.org|opentopomap|rainviewer/, (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64') }),
  );

test('Live map: the button for stops along the route loads the stretch ahead and answers', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await tiles(context);
  let mode = 'gaveup';
  const bodies = [];
  let near = null;
  await context.route(/overpass/, (route) => {
    bodies.push(route.request().postData() || '');
    if (mode === 'gaveup') return route.fulfill({ json: { elements: [], remark: 'runtime error: Query timed out in "query" at line 3 after 61 seconds.' } });
    return route.fulfill({ json: { elements: near ? [{ type: 'node', id: 77, lat: near.lat, lon: near.lon, tags: { amenity: 'drinking_water', name: 'test_data_gtp_ Brunnen' } }, { type: 'node', id: 78, lat: near.lat, lon: near.lon + 0.001, tags: { amenity: 'fuel', name: 'test_data_gtp_ Tankstelle' } }] : [] } });
  });
  await context.grantPermissions(['geolocation']);
  await page.goto('./#/race');
  await tap(page.locator('[data-race-sample-open]'), info);
  await expect(page.locator('[data-race-sample]')).toBeVisible();
  // a point of the sample route: the GPS stands there
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
  await tap(page.locator('[data-live-sheet-toggle]'), info);
  await tap(page.locator('[data-live-sheet-toggle]'), info);
  await expect(page.locator('[data-live-sheet]')).toHaveAttribute('data-live-sheet', 'full');

  // the server gives up: the answer stands right under the button
  const btn = page.locator('[data-live-stops] .rc-acts button');
  await btn.scrollIntoViewIfNeeded();
  await tap(btn, info);
  const say = page.locator('[data-live-stops-msg]');
  await expect(say).toBeVisible({ timeout: 15_000 });
  await expect(btn).toBeEnabled();
  expect(bodies.length).toBe(1);

  // the server answers: the stretch ahead in small pieces (60 km in pieces of 20 km), the stop is kept
  mode = 'ok';
  bodies.length = 0;
  await tap(btn, info);
  await expect(btn).toBeEnabled({ timeout: 15_000 });
  await expect.poll(() => bodies.length).toBe(3);
  for (const b of bodies) expect(b.length).toBeLessThan(30_000);
  await expect(page.locator('[data-live-stop-row="water"]', { hasText: 'test_data_gtp_ Brunnen' })).toBeVisible();
  // petrol stations count as stops too
  await expect(page.locator('[data-live-stop-row="fuel"]', { hasText: 'test_data_gtp_ Tankstelle' })).toBeVisible();
  await expect(say).toHaveCount(0);
});
