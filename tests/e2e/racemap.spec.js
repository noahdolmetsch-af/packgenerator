// Paket U2 «Karte» (Noah 19.10.2026): the map of the sample race (#/race/race-sample/map) with its profile,
// the weather layers and your own points. Every request to outside is mocked (tiles: a small PNG, RainViewer
// and Open-Meteo: fictional JSON), nothing leaves the preview. The map draws with WebGL when the browser has
// it, else a fallback sentence stands there; the rest of the page works in both cases.
import { readFileSync } from 'node:fs';
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

// a 1×1 PNG for every map tile
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

const noSideways = async (page, where = '') => {
  const over = await page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    const bad = [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right + scrollX > w + 1 && !e.closest('.maplibregl-canvas-container, .maplibregl-marker'));
    return { d: document.documentElement.scrollWidth - w, bad: bad.slice(0, 6).map((e) => `${e.tagName}.${e.className} ${Math.round(e.getBoundingClientRect().right)}`) };
  });
  expect(over.d, `${where} ${over.bad.join(' | ')}`).toBeLessThanOrEqual(1);
};

async function mockOutside(context) {
  await context.route(/wmts\.geo\.admin\.ch|tile\.openstreetmap\.org|tile\.opentopomap\.org|tilecache\.rainviewer\.com/, (route) => route.fulfill({ body: PNG, contentType: 'image/png' }));
  await context.route(/tiles\.openfreemap\.org/, (route) => route.fulfill({ status: 404, body: '' }));
  await context.route(/api\.rainviewer\.com/, (route) => route.fulfill({ json: { host: 'https://tilecache.rainviewer.com', radar: { past: [{ time: 1760000000, path: '/v2/radar/1760000000' }] } } }));
  // the map weather: wind, freezing level and snow (one answer per point)
  await context.route(/api\.open-meteo\.com\/v1\/forecast\?.*freezing_level_height/, (route) => {
    const url = new URL(route.request().url());
    const n = url.searchParams.get('latitude').split(',').length;
    const t0 = Math.floor(Date.parse('2026-10-09T00:00:00Z') / 1000);
    const time = [...Array(16 * 24).keys()].map((h) => t0 + h * 3600);
    const one = (i) => ({ hourly: { time, wind_speed_10m: time.map(() => 12 + i), wind_direction_10m: time.map(() => 250), freezing_level_height: time.map(() => 2100), snow_depth: time.map(() => (i === 7 ? 0.1 : 0)) } });
    return route.fulfill({ json: [...Array(n).keys()].map(one) });
  });
}

test('Race map: map or fallback, profile, weather, own point add rename delete undo, fits the screen', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await mockOutside(context);
  // the sample race
  await page.goto('./#/race');
  await page.locator('[data-race-sample-open]').click();
  await expect(page).toHaveURL(/#\/race\/race-sample$/);
  await page.locator('[data-race-tab="map"]').click();
  await expect(page.locator('[data-page="race-map"]')).toBeVisible();
  await expect(page.locator('[data-race-box="map-main"]')).toBeVisible();

  // the map draws (WebGL) or says why not; either way the page goes on
  await expect(page.locator('[data-map-ready], [data-map-fallback]').first()).toBeVisible({ timeout: 20_000 });
  const drawn = (await page.locator('[data-map-ready]').count()) > 0;
  if (drawn) {
    await expect(page.locator('[data-map] canvas.maplibregl-canvas')).toBeVisible();
    await expect(page.locator('.maplibregl-ctrl-attrib')).toContainText('swisstopo');
    await page.locator('[data-map-fit]').click();
  }
  // ground and layers
  await page.locator('[data-map-ground]').selectOption('osm');
  if (drawn) await expect(page.locator('.maplibregl-ctrl-attrib')).toContainText('OpenStreetMap');
  await page.locator('[data-map-ground]').selectOption('auto');
  const sectors = page.locator('[data-map-layer="sectors"]');
  await expect(sectors).toHaveAttribute('aria-pressed', 'true');
  await sectors.click();
  await expect(sectors).toHaveAttribute('aria-pressed', 'false');
  await sectors.click();
  // the stop filter
  const shop = page.locator('[data-map-kind="shop"]');
  await expect(shop).toHaveAttribute('aria-pressed', 'true');
  await shop.click();
  await expect(shop).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-race-map] [data-landi]')).toHaveAttribute('href', 'https://www.landi.ch/wetter/niederschlagsradar');
  // Paket X: the shown stops as one GPX for the Garmin; a hidden kind stays out
  const dl = page.waitForEvent('download');
  await page.locator('[data-race-map] [data-gpx-stops-save]').click();
  const gpx = readFileSync(await (await dl).path(), 'utf8');
  expect(gpx).toContain('<trkpt ');
  expect(gpx).not.toContain('<sym>Shopping Center</sym>');

  // the profile: a tap shows km, height and gradient
  const box = page.locator('[data-profile-box]');
  await expect(box).toBeVisible();
  const b = await box.boundingBox();
  await box.click({ position: { x: b.width * 0.4, y: b.height / 2 } });
  await expect(page.locator('[data-profile-read]')).toContainText(/km \d+/);
  await expect(page.locator('[data-profile-read]')).toContainText('%');
  await box.press('ArrowRight');
  await expect(page.locator('[data-profile-fine]')).toBeVisible();
  await expect(page.locator('[data-profile-read]')).toContainText(/(summit|valley|Gipfel|Tal) /);

  // zoom: «+» shows a shorter stretch, «Whole route» goes back
  const range = page.locator('[data-profile-range]');
  await expect(range).toHaveAttribute('data-from', '0');
  const to0 = Number(await range.getAttribute('data-to'));
  await page.locator('[data-profile-zoomin]').click();
  await expect.poll(async () => Number(await range.getAttribute('data-to')) - Number(await range.getAttribute('data-from'))).toBeLessThan(to0 * 0.6);
  await page.locator('[data-profile-zoomin]').click();
  await expect.poll(async () => Number(await range.getAttribute('data-to')) - Number(await range.getAttribute('data-from'))).toBeLessThan(to0 * 0.3);
  await page.locator('[data-profile-whole]').click();
  await expect(range).toHaveAttribute('data-to', String(to0));

  // select a stretch: drag over it; the profile zooms there and the map shows it (with WebGL)
  if (drawn) await expect(page.locator('[data-map-ready]')).toHaveAttribute('data-map-view', /\d/);
  const view0 = drawn ? await page.locator('[data-map-ready]').getAttribute('data-map-view') : '';
  await page.locator('[data-profile-select]').click();
  await expect(page.locator('[data-profile-select]')).toHaveAttribute('aria-pressed', 'true');
  const pb = await box.boundingBox();
  await page.mouse.move(pb.x + pb.width * 0.6, pb.y + pb.height / 2);
  await page.mouse.down();
  await page.mouse.move(pb.x + pb.width * 0.65, pb.y + pb.height / 2, { steps: 4 });
  await page.mouse.move(pb.x + pb.width * 0.7, pb.y + pb.height / 2, { steps: 4 });
  await page.mouse.up();
  await expect(page.locator('[data-profile-select]')).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(async () => Number(await range.getAttribute('data-from'))).toBeGreaterThan(to0 * 0.55);
  expect(Number(await range.getAttribute('data-to'))).toBeLessThan(to0 * 0.75);
  if (drawn) await expect.poll(() => page.locator('[data-map-ready]').getAttribute('data-map-view')).not.toBe(view0);
  await page.locator('[data-profile-whole]').click();

  // the weather timeline and the place search are there
  await expect(page.locator('[data-race-box="map-wx"] [data-wx-timeline]')).toBeVisible();
  await expect(page.locator('[data-map-places] summary')).toBeVisible();
  // weather: wind and snow with their «as of» time (mocked)
  await page.locator('[data-map-load-wx]').click();
  await expect(page.locator('[data-map-wx-asof]')).toContainText(/\d\d:\d\d/);
  await expect(page.locator('[data-map-snow]').first()).toBeVisible();
  await expect(page.locator('[data-race-box="map-wx"] [data-map-layer="wind"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-map-load-radar]').click();
  await expect(page.locator('[data-race-box="map-wx"] [data-map-layer="radar"]')).toHaveAttribute('aria-pressed', 'true');

  // own point: add at the profile spot, rename, delete with Undo
  await expect(page.locator('[data-own-empty]')).toBeVisible();
  await page.locator('[data-own-add-cursor]').click();
  await page.locator('[data-own-name]').fill('test_data_gtp_ Brunnen');
  await page.locator('[data-own-kind]').selectOption('water');
  await page.locator('[data-sheet-save]').click();
  const rows = page.locator('[data-own-row]');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('test_data_gtp_ Brunnen');
  await page.locator('[data-own-edit]').first().click();
  await page.locator('[data-own-name]').fill('test_data_gtp_ Dorfbrunnen');
  await page.locator('[data-own-note]').fill('test_data_gtp_ gutes Wasser');
  await page.locator('[data-sheet-save]').click();
  await expect(rows.first()).toContainText('test_data_gtp_ Dorfbrunnen');
  await expect(rows.first()).toContainText('test_data_gtp_ gutes Wasser');
  await page.locator('[data-own-edit]').first().click();
  await page.locator('[data-sheet-delete]').click();
  await page.getByTestId('ask-delete').locator('.btn.del').click();
  await expect(rows).toHaveCount(0);
  await page.locator('.rtoast button').last().click();
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('test_data_gtp_ Dorfbrunnen');

  // on the map: «Add point» waits for a tap (only when the map draws)
  if (drawn) {
    await page.locator('[data-own-add]').click();
    await expect(page.locator('[data-map-adding]')).toBeVisible();
    await page.locator('.maplibregl-canvas').click({ position: { x: 60, y: 120 } });
    await expect(page.locator('[data-own-name]')).toBeVisible();
    await page.locator('[data-own-name]').fill('test_data_gtp_ Aussicht');
    await page.locator('[data-sheet-save]').click();
    await expect(rows).toHaveCount(2);
  }

  // the points are for every trip: they live in the settings, not in the race
  const stored = await page.evaluate(
    () =>
      new Promise((res) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const q = r.result.transaction('settings').objectStore('settings').get('own-points');
          q.onsuccess = () => res(q.result?.value?.points?.map((p) => p.name) ?? null);
        };
      }),
  );
  expect(stored).toContain('test_data_gtp_ Dorfbrunnen');

  await page.locator('[data-race-box="map-main"]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('map.png') });
  await page.locator('[data-race-box="map-profile"]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('profile.png') });
  await page.evaluate(() => window.scrollTo(0, 0));
  await noSideways(page, info.project.name);
});

test('Race map without WebGL: a clear sentence, the profile and own points still work', async ({ page, context }, info) => {
  await context.addInitScript(() => {
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...rest) {
      return /webgl/.test(kind) ? null : get.call(this, kind, ...rest);
    };
  });
  await openHome(page, context, info);
  await mockOutside(context);
  await page.goto('./#/race');
  await page.locator('[data-race-sample-open]').click();
  await page.locator('[data-race-tab="map"]').click();
  await expect(page.locator('[data-map-fallback]')).toBeVisible();
  await expect(page.locator('[data-map-ready]')).toHaveCount(0);
  const box = page.locator('[data-profile-box]');
  const b = await box.boundingBox();
  await box.click({ position: { x: b.width * 0.7, y: b.height / 2 } });
  await expect(page.locator('[data-own-add-cursor]')).toContainText(/\d+/);
  await page.locator('[data-own-add-cursor]').click();
  await page.locator('[data-own-name]').fill('test_data_gtp_ Pass');
  await page.locator('[data-sheet-save]').click();
  await expect(page.locator('[data-own-row]')).toHaveCount(1);
  await page.screenshot({ path: info.outputPath('fallback.png'), fullPage: false });
  await noSideways(page, info.project.name);
});
