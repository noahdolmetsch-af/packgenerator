// «Bereit für unterwegs?» (Noah 02.11.2026, Schritt 6): before the start the live page checks the map and the voice. Made-up sample race, every outside request mocked.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { STRIPS_KEY } from '../../src/lib/map/offline.js';
import { OFFLINE_CACHE } from '../../src/lib/map/sources.js';

const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());

test('Live page: before the start the card «Ready for the ride?» checks the map and the voice', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await context.route(/tiles\.openfreemap\.org|wmts\.geo\.admin\.ch|tile\.openstreetmap\.org|opentopomap|rainviewer/, (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64') }),
  );
  await context.route(/overpass/, (route) => route.fulfill({ json: { elements: [] } }));
  await context.grantPermissions(['geolocation']);
  await page.goto('./#/race');
  await tap(page.locator('[data-race-sample-open]'), info);
  await expect(page.locator('[data-race-sample]')).toBeVisible();
  await page.goto('./#/live/race-sample');
  const card = page.locator('[data-live-ready]');
  await card.scrollIntoViewIfNeeded();
  await expect(card).toBeVisible();
  // nothing kept yet, voice off
  await expect(card.locator('[data-live-ready-map]')).toHaveAttribute('data-live-ready-map', 'no');
  await expect(card.locator('[data-live-ready-voice]')).toHaveAttribute('data-live-ready-voice', 'no');
  // the voice is one tap
  await tap(card.locator('[data-live-ready-voice-on]'), info);
  await expect(card.locator('[data-live-ready-voice]')).toHaveAttribute('data-live-ready-voice', 'yes');
  // the map: the offline strips open right there
  await tap(card.locator('[data-live-ready-keep]'), info);
  await expect(card.locator('[data-live-ready-box]')).toBeVisible();
  // «Ride with OsmAnd» (Noah 23.11.2026 «1a»): one tap makes the GPX file and a line says what to do next
  const os = card.locator('[data-live-osmand]');
  await expect(os).toBeVisible();
  await tap(os.locator('[data-live-osmand-go]'), info);
  await expect(os.locator('[data-live-osmand-say]')).toContainText(/OsmAnd/);
  // nothing is forced: the ride can start
  await expect(page.locator('[data-live-start]')).toBeVisible();
});

test('Live page: the card «Ready for the ride?» is closed to one line once map and voice are set, a tap opens it', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await context.route(/tiles\.openfreemap\.org|wmts\.geo\.admin\.ch|tile\.openstreetmap\.org|opentopomap|rainviewer/, (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64') }),
  );
  await context.route(/overpass/, (route) => route.fulfill({ json: { elements: [] } }));
  await context.grantPermissions(['geolocation']);
  await page.goto('./#/race');
  await tap(page.locator('[data-race-sample-open]'), info);
  await expect(page.locator('[data-race-sample]')).toBeVisible();
  // a kept strip of the sample race (settings row + its manifest in the offline cache), as «Keep the map» leaves it
  await page.evaluate(
    async ({ key, cache }) => {
      // the same address the app asks for (offline.js manifestUrl, made on the page)
      const manifest = new URL('/__pg-offline-map/strip/bereit-strip.json', location.href).href;
      await (await caches.open(cache)).put(manifest, new Response('{}', { headers: { 'content-type': 'application/json' } }));
      await new Promise((resolve, reject) => {
        const rq = indexedDB.open('pack-generator');
        rq.onerror = () => reject(rq.error);
        rq.onsuccess = () => {
          const tx = rq.result.transaction('settings', 'readwrite');
          tx.objectStore('settings').put({ key, value: { strips: [{ id: 'bereit-strip', tripId: 'race-sample', name: 'Test strip' }] } });
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => reject(tx.error);
        };
      });
    },
    { key: STRIPS_KEY, cache: OFFLINE_CACHE },
  );
  await page.goto('./#/live/race-sample');
  await page.reload();
  const card = page.locator('[data-live-ready]');
  await card.scrollIntoViewIfNeeded();
  // the map is kept, the voice is off: the card stays open
  await expect(card.locator('[data-live-ready-map]')).toHaveAttribute('data-live-ready-map', 'yes');
  await expect(card).toHaveJSProperty('open', true);
  // the voice on: one line, the rows are gone from sight
  await tap(card.locator('[data-live-ready-voice-on]'), info);
  await expect(card).toHaveJSProperty('open', false);
  await expect(card.locator('[data-live-ready-yes]')).toBeVisible();
  await expect(card.locator('[data-live-osmand]')).toBeHidden();
  // a tap on the line opens it again, with the OsmAnd row
  await tap(card.locator('[data-live-ready-head]'), info);
  await expect(card).toHaveJSProperty('open', true);
  await expect(card.locator('[data-live-osmand]')).toBeVisible();
  // the start stays in sight
  await expect(page.locator('[data-live-start]')).toBeVisible();
});
