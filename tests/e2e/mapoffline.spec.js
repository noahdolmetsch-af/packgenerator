// Paket U3 «Karte offline» (Noah 19.10.2026 «3a und b möglich»): on the sample race's map, keep a small strip
// of the free map (style, TileJSON, sprites, fonts and tiles mocked), watch the progress reach done, see the
// size, rename it, delete it with Undo, and after the undo window the tiles leave the cache. A tiny made-up
// route keeps the strip small. The service worker is blocked in the tests (unit test: map-offline.test.js).
import { test, expect } from '@playwright/test';
import { openHome } from './home0460-fixture.js';
import { STRIPS_KEY } from '../../src/lib/map/offline.js';
import { OFFLINE_CACHE } from '../../src/lib/map/sources.js';

const TINY = [
  [46.95, 7.44],
  [46.955, 7.45],
  [46.96, 7.46],
];
const OFM = 'https://tiles.openfreemap.org';
const STYLE = {
  version: 8,
  sprite: `${OFM}/sprites/test/ofm`,
  glyphs: `${OFM}/fonts/{fontstack}/{range}.pbf`,
  sources: { openmaptiles: { type: 'vector', url: `${OFM}/planet` } },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#eeeeee' } },
    { id: 'names', type: 'symbol', source: 'openmaptiles', 'source-layer': 'place', layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Regular'] } },
  ],
};
const TILEJSON = { tilejson: '3.0.0', tiles: [`${OFM}/planet/test/{z}/{x}/{y}.pbf`], minzoom: 0, maxzoom: 14 };
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

const noSideways = async (page, where = '') => {
  const over = await page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    const bad = [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right + scrollX > w + 1);
    return { d: document.documentElement.scrollWidth - w, bad: bad.slice(0, 6).map((e) => `${e.tagName}.${e.className} ${Math.round(e.getBoundingClientRect().right)}`) };
  });
  expect(over.d, `${where} ${over.bad.join(' | ')}`).toBeLessThanOrEqual(1);
};

/** The sample race with the tiny route (written straight into the settings row 'races'). */
const tinyRoute = (page, line) =>
  page.evaluate(
    (ln) =>
      new Promise((resolve, reject) => {
        const rq = indexedDB.open('pack-generator');
        rq.onerror = () => reject(rq.error);
        rq.onsuccess = () => {
          const tx = rq.result.transaction('settings', 'readwrite');
          const st = tx.objectStore('settings');
          const g = st.get('races');
          g.onsuccess = () => {
            const row = g.result;
            row.value.races['race-sample'].route.line = ln;
            row.value.races['race-sample'].route.start = { lat: ln[0][0], lon: ln[0][1] };
            row.value.races['race-sample'].route.end = { lat: ln.at(-1)[0], lon: ln.at(-1)[1] };
            st.put(row);
          };
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => reject(tx.error);
        };
      }),
    line,
  );
const stripsRow = (page, key) =>
  page.evaluate(
    (k) =>
      new Promise((resolve) => {
        const rq = indexedDB.open('pack-generator');
        rq.onsuccess = () => {
          const g = rq.result.transaction('settings').objectStore('settings').get(k);
          g.onsuccess = () => resolve(g.result?.value ?? null);
        };
      }),
    key,
  );
const cached = (page) => page.evaluate(async (name) => (await (await caches.open(name)).keys()).map((r) => r.url), OFFLINE_CACHE);

test('Map offline: keep a small free-map strip, progress to done, size, rename, delete with Undo', async ({ page, context }, info) => {
  test.setTimeout(150_000);
  const T = await openHome(page, context, info);
  // the free map and swisstopo, mocked (the page's own routes win over the fixture's «abort everything»)
  let now = 0;
  let most = 0;
  await page.route(/^https:\/\/tiles\.openfreemap\.org\//, async (route) => {
    const url = route.request().url();
    now++;
    most = Math.max(most, now);
    await new Promise((r) => setTimeout(r, 15));
    now--;
    const headers = { 'access-control-allow-origin': '*' };
    if (/\/styles\//.test(url)) return route.fulfill({ headers, json: STYLE });
    if (/\/planet$/.test(url)) return route.fulfill({ headers, json: TILEJSON });
    if (/\.json$/.test(url)) return route.fulfill({ headers, json: { dot: { x: 0, y: 0, width: 1, height: 1, pixelRatio: 1 } } });
    if (/\.png$/.test(url)) return route.fulfill({ headers, body: PNG, contentType: 'image/png' });
    return route.fulfill({ headers, body: Buffer.alloc(2048, 1), contentType: 'application/x-protobuf' });
  });
  await page.route(/^https:\/\/wmts\.geo\.admin\.ch\//, (route) => route.fulfill({ headers: { 'access-control-allow-origin': '*' }, body: PNG, contentType: 'image/png' }));

  await page.goto('./#/race');
  await page.locator('[data-race-sample-open]').click();
  await expect(page).toHaveURL(/#\/race\/race-sample$/);
  await tinyRoute(page, TINY);
  await page.goto('./#/race/race-sample/map');
  await page.reload();
  const box = page.locator('[data-race-box="map-offline"]');
  await expect(box).toBeVisible();
  await box.scrollIntoViewIfNeeded();

  // the route lies in Switzerland: swisstopo and the free map are offered, OSM never
  await expect(box.locator('[data-om-ground="swisstopo"]')).toBeVisible();
  await expect(box.locator('[data-om-ground="vector"]')).toBeVisible();
  await expect(box.locator('[data-om-ground="osm"]')).toHaveCount(0);
  await expect(box.locator('[data-om-terms]')).toContainText('OpenStreetMap');
  await box.locator('[data-om-ground="vector"]').click();
  await box.locator('[data-om-width="1"]').click();
  // the size before the download
  await expect(box.locator('[data-om-estimate]')).toContainText(/\d+ (KB|MB)/);
  await noSideways(page, 'before');

  // keep it: the progress bar, then done
  await box.locator('[data-om-keep]').click();
  await expect(box.locator('[data-om-done]')).toBeVisible({ timeout: 90_000 });
  await expect(box.locator('[data-om-msg]')).toContainText(/\d+ (KB|MB)/);
  expect(most, 'at most 4 requests at a time').toBeLessThanOrEqual(4);
  const row = box.locator('[data-om-strip]');
  await expect(row).toHaveCount(1);
  await expect(row).toContainText(/\d+ (KB|MB)/);
  // the tiles, the style, the TileJSON, sprites and fonts are in the cache; the index stays small
  const keys = await cached(page);
  expect(keys.some((u) => u.endsWith('/styles/liberty'))).toBe(true);
  expect(keys.some((u) => u.endsWith('/planet'))).toBe(true);
  expect(keys.some((u) => /\/sprites\/test\/ofm@2x\.png$/.test(u))).toBe(true);
  expect(keys.some((u) => /\/fonts\/Noto%20Sans%20Regular\/0-255\.pbf$/.test(u))).toBe(true);
  expect(keys.filter((u) => /\/planet\/test\/14\//.test(u)).length).toBeGreaterThan(0);
  const index = await stripsRow(page, STRIPS_KEY);
  expect(index.strips).toHaveLength(1);
  expect(JSON.stringify(index)).not.toContain('http');
  await noSideways(page, 'kept');

  // rename
  await row.locator('[data-om-rename]').click();
  const sheet = page.locator('dialog.rename[open]');
  await expect(sheet).toBeVisible();
  await sheet.locator('input').fill('test_data_gtp_ Streifen Bern');
  await sheet.locator('input').press('Enter');
  await expect(row).toContainText('test_data_gtp_ Streifen Bern');

  // delete asks, Undo brings it back (the tiles stay during the undo window)
  await row.locator('[data-om-delete]').click();
  const ask = page.getByTestId('ask-delete');
  await expect(ask).toBeVisible();
  await ask.getByRole('button', { name: T('Delete') }).click();
  await expect(box.locator('[data-om-strip]')).toHaveCount(0);
  await page.locator('.rtoast').getByRole('button', { name: T('Undo') }).click();
  await expect(box.locator('[data-om-strip]')).toHaveCount(1);
  expect((await cached(page)).length).toBe(keys.length);

  // delete for good: after the undo window the tiles leave the cache
  await box.locator('[data-om-delete]').click();
  await expect(ask).toBeVisible();
  await ask.getByRole('button', { name: T('Delete') }).click();
  await expect(box.locator('[data-om-strip]')).toHaveCount(0);
  await expect.poll(async () => (await cached(page)).length, { timeout: 15_000 }).toBe(0);
});
