// «Nebelgrenze» (Noah 05.11.2026 «1a 2b 3a 4b»): the fog line on the weather page and on Today.
// Made-up place and weather; Open-Meteo is mocked, everything else outside is blocked (openHome).
import { test, expect } from './clock.js';
import { openHome, homeFixture, day } from './home0460-fixture.js';

const OFF = 7200;
const LEVELS = { 1000: 110, 975: 330, 950: 550, 925: 780, 900: 1000, 850: 1500 };
const DAMP = { 1000: 98, 975: 98, 950: 97, 925: 96, 900: 40, 850: 30 };
const DRY = { 1000: 60, 975: 55, 950: 50, 925: 45, 900: 40, 850: 30 };
const WARM_ABOVE = { 1000: 3, 975: 2.5, 950: 2, 925: 1, 900: 9, 850: 8 };
const COOLING = { 1000: 6, 975: 4, 950: 3, 925: 1, 900: -1, 850: -4 };

// 3 days from day(-1): fog until 10 h local (low cloud 100 %), then clear; or clear all day
function fog(from, { clear = false } = {}) {
  const t0 = Date.parse(`${from}T00:00:00Z`) - OFF * 1000;
  const time = Array.from({ length: 72 }, (_, i) => (t0 + i * 36e5) / 1000);
  const foggy = (i) => !clear && i % 24 <= 10;
  const col = (f) => time.map((_, i) => f(i));
  const hourly = {
    time,
    temperature_2m: col((i) => (foggy(i) ? 3.5 : 9)),
    relative_humidity_2m: col((i) => (foggy(i) ? 98 : 55)),
    cloud_cover_low: col((i) => (foggy(i) ? 100 : 5)),
    cloud_cover_mid: col(() => 0),
    cloud_cover_high: col(() => 0),
    visibility: col((i) => (foggy(i) ? 600 : 24000)),
  };
  for (const [l, z] of Object.entries(LEVELS)) {
    hourly[`geopotential_height_${l}hPa`] = col(() => z);
    hourly[`temperature_${l}hPa`] = col((i) => (foggy(i) ? WARM_ABOVE[l] : COOLING[l]));
    hourly[`relative_humidity_${l}hPa`] = col((i) => (foggy(i) ? DAMP[l] : DRY[l]));
  }
  return { latitude: 47.39, longitude: 8.04, elevation: 410, utc_offset_seconds: OFF, hourly };
}
function core(from) {
  const t0 = Date.parse(`${from}T00:00:00Z`) - OFF * 1000;
  const time = Array.from({ length: 24 * 16 }, (_, i) => (t0 + i * 36e5) / 1000);
  const all = (v) => time.map(() => v);
  return {
    latitude: 47.39, longitude: 8.04, elevation: 410, utc_offset_seconds: OFF,
    hourly: { time, temperature_2m: all(6), apparent_temperature: all(4), precipitation_probability: all(5), precipitation: all(0), weather_code: all(3), wind_speed_10m: all(10), wind_gusts_10m: all(15), wind_direction_10m: all(270), cape: all(0), freezing_level_height: all(2200), visibility: all(20000), snowfall: all(0), snow_depth: all(0), snowfall_height: all(1900) },
    daily: { time: [0, 1, 2].map((d) => (t0 + d * 864e5) / 1000), sunrise: [0, 1, 2].map((d) => (t0 + d * 864e5 + 7 * 36e5) / 1000), sunset: [0, 1, 2].map((d) => (t0 + d * 864e5 + 17 * 36e5) / 1000), uv_index_max: [2, 2, 2] },
  };
}
const mock = async (context, opts) => {
  await context.route(/api\.open-meteo\.com\/v1\/forecast\?.*cape/, (r) => r.fulfill({ json: core(day(-1)) }));
  await context.route(/api\.open-meteo\.com\/v1\/forecast\?.*cloud_cover_low/, (r) => r.fulfill({ json: fog(day(-1), opts) }));
};

test('The weather page and Today show the fog line, with your place, the clearing and a switch', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: homeFixture() });
  await mock(context);

  await page.goto('./#/wetter');
  const now = page.locator('[data-fogline-now]');
  await expect(now).toBeVisible({ timeout: 20_000 });
  await expect(now).toHaveText('Nebelgrenze ca. 800 m ü. M., darüber Sonne');
  await expect(page.locator('[data-fogline-own]')).toContainText('Dein Ort (410 m) liegt im Nebel');
  await expect(page.locator('[data-fogline-clearing]')).toContainText('gegen 11 Uhr auf');
  await expect(page.locator('[data-fogline-slots] li')).toHaveCount(6);
  await expect(page.locator('[data-fogline-up]')).toContainText('wärmer als bei dir');
  await expect(page.locator('[data-fogline-sight]')).toHaveText('Sicht 600 m');
  await page.locator('[data-wx-today]').screenshot({ path: info.outputPath(`nebel-wetter-${info.project.name}.png`) });

  // 3a: your height (set with the snow line) above the line → above the fog
  await page.locator('[data-snowline-set] summary').click();
  await page.locator('[data-snowline-own]').fill('1200');
  await page.locator('[data-snowline-set] button[type="submit"]').click();
  await expect(page.locator('[data-fogline-own]')).toContainText('Dein Ort (1’200 m) liegt über dem Nebel');

  // Today: the line for the home place
  await page.goto('./#/');
  const line = page.locator('[data-heute-fogline]');
  await expect(line).toBeVisible({ timeout: 20_000 });
  await expect(line).toContainText('Nebelgrenze');
  await expect(line).toContainText('Sicht 600 m');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: info.outputPath(`nebel-heute-${info.project.name}.png`) });

  // switched off on the weather page, gone on Today
  await page.goto('./#/wetter');
  await page.locator('[data-fogline-set] summary').click();
  await page.locator('[data-fogline-home]').uncheck();
  await page.goto('./#/');
  await expect(page.locator('[data-heute-wetter]')).toBeAttached();
  await expect(page.locator('[data-heute-fogline]')).toHaveCount(0);
});

test('On a clear day the page says there is no fog line (2b: always shown)', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: homeFixture() });
  await mock(context, { clear: true });
  await page.goto('./#/wetter');
  await expect(page.locator('[data-fogline-now]')).toHaveText('Keine Nebelgrenze: kein Hochnebel erwartet', { timeout: 20_000 });
  await expect(page.locator('[data-fogline-own]')).toHaveCount(0);
  await expect(page.locator('[data-fogline-sight]')).toHaveText('Sicht über 20 km');
});
