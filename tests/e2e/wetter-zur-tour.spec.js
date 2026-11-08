// UI-Prüfung 07.11.2026 T3 «Für deine Tour»: the card at the top of the weather page for the next planned trip.
// Made-up trip and places; Open-Meteo is mocked (or refused), everything else outside is blocked (openHome).
import { test, expect } from './clock.js';
import { openHome, homeFixture, day } from './home0460-fixture.js';

const OFF = 7200;
// 16 days from D0, dry, except rain from 15:00 on the day of the trip (day 1)
function core() {
  const t0 = Date.parse(`${day(0)}T00:00:00Z`) - OFF * 1000;
  const time = Array.from({ length: 24 * 16 }, (_, i) => (t0 + i * 36e5) / 1000);
  const rainy = time.map((s) => { const h = Math.floor((s * 1000 - t0) / 36e5); return h >= 24 + 15 && h < 24 + 20; });
  const all = (v) => time.map(() => v);
  return {
    latitude: 47.39, longitude: 8.04, elevation: 400, utc_offset_seconds: OFF,
    hourly: { time, temperature_2m: time.map((_, i) => 6 + (i % 24) / 2), apparent_temperature: all(10), precipitation_probability: rainy.map((r) => (r ? 80 : 5)), precipitation: rainy.map((r) => (r ? 1.4 : 0)), weather_code: all(3), wind_speed_10m: all(14), wind_gusts_10m: all(20), wind_direction_10m: all(270), cape: all(0), freezing_level_height: all(3000), visibility: all(20000), snowfall: all(0), snow_depth: all(0) },
    daily: { time: [0, 1, 2].map((d) => (t0 + d * 864e5) / 1000), sunrise: [0, 1, 2].map((d) => (t0 + d * 864e5 + 7 * 36e5) / 1000), sunset: [0, 1, 2].map((d) => (t0 + d * 864e5 + 19 * 36e5) / 1000), uv_index_max: [3, 3, 3] },
  };
}
// the trip «Herbstrunde» (tomorrow) has six entries from item 3; the first two are packed. Three of them are rain things: two packed, one not.
function fixture() {
  const data = homeFixture();
  const ids = data.tables.items.slice(3, 6).map((i) => i.id);
  data.tables.items = data.tables.items.map((i) => (ids.includes(i.id) ? { ...i, rain: 'yes' } : i));
  return data;
}
const wide = (page) => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);

test('Wetter: the card «Für deine Tour» says rain, the rain things and leads on', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: fixture(), weather: (c) => c.route(/api\.open-meteo\.com\/v1\/forecast\?.*cape/, (r) => r.fulfill({ json: core() })) });
  await page.goto('./#/wetter');
  const card = page.locator('[data-zur-tour]');
  await expect(card).toBeVisible({ timeout: 20_000 });
  await expect(card.locator('[data-zt-name]')).toHaveText('test_data_gtp_ Herbstrunde');
  await expect(card.locator('[data-zt-weather]')).toContainText('Regen ab 15:00');
  await expect(card.locator('[data-zt-weather]')).toContainText('°C');
  await expect(card.locator('[data-zt-gear]')).toContainText('2 von 3 gepackt');
  expect(await wide(page)).toBeLessThanOrEqual(0);
  await card.screenshot({ path: info.outputPath(`zur-tour-regen-${info.project.name}.png`) });
  // the best time for a ride is the part «Planen» of this page
  await card.locator('[data-zt-plan]').click();
  await expect(page.locator('[data-wx-best]')).toBeVisible();
  await page.getByRole('tab', { name: 'Jetzt' }).click();
  await card.locator('[data-zt-pack]').click();
  await expect(page).toHaveURL(/#\/pack\?day/);
  expect(errors).toEqual([]);
});

test('Wetter: without the weather service the card says so and keeps its ways', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: fixture(), weather: (c) => c.route(/open-meteo\.com/, (r) => r.abort()) });
  await page.goto('./#/wetter');
  const card = page.locator('[data-zur-tour]');
  await expect(card).toBeVisible({ timeout: 20_000 });
  await expect(card.locator('[data-zt-none]')).toContainText('nicht erreichbar', { timeout: 20_000 });
  await expect(card.locator('[data-zt-weather]')).toHaveCount(0);
  await expect(card.locator('[data-zt-pack]')).toBeVisible();
  await card.screenshot({ path: info.outputPath(`zur-tour-ohne-${info.project.name}.png`) });
  await card.locator('[data-zt-wear]').click();
  await expect(page).toHaveURL(/#\/$/);
  expect(errors).toEqual([]);
});

test('Wetter: no planned trip, no card', async ({ page, context }, info) => {
  const data = fixture();
  data.tables.trips = data.tables.trips.filter((x) => x.status === 'done');
  await openHome(page, context, info, { data });
  await page.goto('./#/wetter');
  await expect(page.locator('[data-page="wetter"]')).toBeVisible();
  await expect(page.locator('[data-zur-tour]')).toHaveCount(0);
});
