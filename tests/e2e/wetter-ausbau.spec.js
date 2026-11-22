// «Wetter ausbauen» (Noah 22.11.2026 «a»): rain in 15-minute steps, the share text, the «Next» row, the weather as a place of its own,
// the weather of each riding day. Made-up place and weather; Open-Meteo is mocked, everything else outside is blocked.
import { test, expect } from './clock.js';
import { openHome, homeFixture, trip, day, D0 } from './home0460-fixture.js';

// 09:00 Zurich on D0 = 07:00 UTC; rain in the quarters 08:00–08:30 UTC (10:00–10:30 local)
const NOW = Date.parse(`${D0}T07:00:00Z`);
const quarters = Array.from({ length: 16 }, (_, i) => NOW + i * 15 * 60 * 1000);
const mockRain = async (context) => {
  await context.route(/api\.open-meteo\.com\/v1\/forecast\?.*minutely_15/, (r) => r.fulfill({
    json: { minutely_15: { time: quarters.map((ms) => ms / 1000), precipitation: quarters.map((_, i) => (i === 4 || i === 5 ? 0.6 : 0)) } },
  }));
};

const OFF = 7200;
/** The core answer: 3 days, 12–20 °C, light wind from the west, dry (so the best window is the morning). */
function core() {
  const t0 = Date.parse(`${D0}T00:00:00Z`) - OFF * 1000;
  const time = Array.from({ length: 72 }, (_, i) => (t0 + i * 36e5) / 1000);
  const h = (i) => i % 24;
  const all = (v) => time.map(() => v);
  return {
    latitude: 47.39, longitude: 8.04, elevation: 400, utc_offset_seconds: OFF,
    hourly: {
      time,
      temperature_2m: time.map((_, i) => 12 + Math.min(8, Math.max(0, h(i) - 6))),
      apparent_temperature: time.map((_, i) => 10 + Math.min(8, Math.max(0, h(i) - 6))),
      precipitation_probability: all(5), precipitation: all(0), weather_code: all(1),
      wind_speed_10m: all(9), wind_gusts_10m: all(14), wind_direction_10m: all(270),
      cape: all(0), freezing_level_height: all(3000), visibility: all(20000), snowfall: all(0), snow_depth: all(0),
    },
    daily: { time: [0, 1, 2].map((d) => (t0 + d * 864e5) / 1000), sunrise: [0, 1, 2].map((d) => (t0 + d * 864e5 + 7 * 36e5) / 1000), sunset: [0, 1, 2].map((d) => (t0 + d * 864e5 + 19 * 36e5) / 1000), uv_index_max: [3, 3, 3] },
  };
}
const mockCore = (context) => context.route(/api\.open-meteo\.com\/v1\/forecast\?.*cape/, (route) => route.fulfill({ json: core() }));

test('Jetzt shows the rain of the next three hours with one sentence, and a row Next at the end', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: homeFixture(), weather: mockCore });
  await mockRain(context); // after the import: the quarters are fetched when the weather page opens
  await page.goto('./#/wetter');
  const say = page.locator('[data-wx-r3-say]');
  await expect(say).toBeVisible({ timeout: 20_000 });
  await expect(say).toContainText(/Trocken bis \d\d:\d\d\. Dann etwa 30 Minuten Regen/);
  await expect(page.locator('.wx-r3-bar')).toHaveCount(12);
  await expect(page.locator('.wx-r3-bar.wet')).toHaveCount(2);
  // the row stands after the content, never above it
  const next = page.locator('[data-wx-next="jetzt"]');
  await expect(next).toBeVisible();
  const [a, b] = await Promise.all([page.locator('[data-wx-r3]').boundingBox(), next.boundingBox()]);
  expect(b.y).toBeGreaterThan(a.y);
  await page.locator('[data-wx-next-planen]').click();
  await expect(page.locator('[data-wx-tab="planen"]')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-wx-next="planen"] [data-wx-next-neuland]')).toHaveAttribute('href', '#/neuland');
  await page.locator('[data-wx-tab="rueckblick"]').click();
  await expect(page.locator('[data-wx-next-heatmap]')).toHaveAttribute('href', '#/heatmap');
});

test('Planen: the best window can be copied as one text', async ({ page, context }, info) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  await openHome(page, context, info, { data: homeFixture(), weather: mockCore });
  await page.goto('./#/wetter?tab=planen');
  const share = page.locator('[data-wx-share]');
  await expect(share).toBeVisible({ timeout: 20_000 });
  const text = page.locator('[data-wx-share-text]');
  await expect(text).toContainText(/\d\d:\d\d–\d\d:\d\d/);
  await expect(text).toContainText('trocken');
  await expect(text).toContainText('Start');
});

test('Weather is a place of its own in the sidebar on a computer and leaves the bar of the phone at five', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: homeFixture() });
  await page.goto('./#/wetter');
  await expect(page.locator('[data-page="wetter"]')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('main')).toHaveAttribute('data-s2-place', 'weather');
  const wide = await page.evaluate(() => window.matchMedia('(min-width: 900px)').matches);
  if (wide) await expect(page.locator('li[data-place="weather"]')).toBeVisible();
  else {
    await expect(page.locator('a[data-place="weather"]')).toHaveCount(0);
    expect(await page.locator('a[data-place]').count()).toBeLessThanOrEqual(5);
  }
});

// A, G and C: a tour of two days along the 47.39° parallel; the second day is wet and cold, a webcam stands on the way
const ROUTE_LINE = Array.from({ length: 27 }, (_, i) => [47.39, 8.0 + i * 0.05]);
const ROUTE = { name: 'test_data_gtp_ Ostweg', km: 95, gainM: 900, lossM: 900, start: { lat: 47.39, lon: 8.0 }, end: { lat: 47.39, lon: 9.3 }, line: ROUTE_LINE, profile: [[0, 400], [30, 800], [60, 1100], [95, 500]] };
const mockLine = (context) => context.route(/api\.open-meteo\.com\/v1\/forecast\?.*latitude=[\d.]+%2C/, (route) => {
  const n = new URL(route.request().url()).searchParams.get('latitude').split(',').length;
  const t0 = Date.parse(`${day(0)}T00:00:00Z`);
  const time = Array.from({ length: 16 * 24 }, (_, i) => (t0 + i * 36e5) / 1000);
  const wet = (i) => Math.floor(i / 24) === 2; // the second riding day (day(2))
  const one = () => ({ hourly: {
    time,
    temperature_2m: time.map((_, i) => (wet(i) ? 3 : 14)),
    precipitation_probability: time.map((_, i) => (wet(i) ? 80 : 5)),
    precipitation: time.map((_, i) => (wet(i) ? 1.2 : 0)),
    wind_speed_10m: time.map(() => 16), wind_gusts_10m: time.map(() => 24), wind_direction_10m: time.map(() => 90),
  } });
  return route.fulfill({ json: Array.from({ length: n }, one) });
});

test('A trip with a route and two days: headwind, coldest point, a webcam on the way and one line per riding day', async ({ page, context }, info) => {
  const data = homeFixture();
  data.tables.trips = [trip('Ostweg', day(1), { days: 2, route: ROUTE })];
  data.tables.debriefs = [];
  await openHome(page, context, info, { data, weather: mockCore });
  // webcams stay on this device (DEVICE_SETTINGS), so they are not in a backup: written here directly
  await page.evaluate((cams) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const tx = r.result.transaction('settings', 'readwrite');
      tx.objectStore('settings').put({ key: 'webcams', value: cams });
      tx.oncomplete = () => { r.result.close(); ok(); };
    };
  }), [{ id: 'cam1', name: 'test_data_gtp_ Passkamera', url: 'https://cams.example/pass.png', home: false, place: { lat: 47.391, lon: 8.45, name: 'test_data_gtp_ Pass' } }]);
  await mockLine(context);
  await context.route(/cams\.example/, (route) => route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64') }));
  await page.goto('./#/pack');
  const strip = page.locator('[data-wx-timeline]');
  await expect(strip).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('[data-wx-route-head]')).toContainText('Gegenwind auf', { timeout: 20_000 });
  await expect(page.locator('[data-wx-route-cams]')).toContainText('test_data_gtp_ Passkamera');
  const days = page.locator('[data-wx-stages]');
  await expect(days).toBeVisible({ timeout: 20_000 });
  await expect(days.locator('[data-wx-stage]')).toHaveCount(2);
  await expect(days.locator('[data-wx-stage="0"]')).toContainText('trocken');
  await expect(days.locator('[data-wx-stage="1"]')).toContainText('Regen ab');
  await expect(days.locator('[data-wx-stage="1"]')).toContainText('3 °C');
  const side = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(side).toBeLessThanOrEqual(1);
});
