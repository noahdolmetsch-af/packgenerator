// «Temperaturen nach Höhe» (Noah 05.11.2026 «1b 2a und c 3a …»): the card on the weather page, more places, a peak, an own place.
// Made-up place and air layers; Open-Meteo is mocked, everything else outside is blocked (openHome).
import { test, expect } from './clock.js';
import { openHome, homeFixture, day } from './home0460-fixture.js';

const OFF = 7200;
const Z = { 1000: 110, 975: 330, 950: 550, 925: 780, 900: 1000, 850: 1500, 800: 1950, 700: 3000, 600: 4200 };
const T = { 1000: 10, 975: 8, 950: 6.5, 925: 5, 900: 3.5, 850: 0.5, 800: -2.5, 700: -9, 600: -19 };

// 4 days of hours from day(-1): every day 4 degrees warmer than the one before
function layers(from, elevation) {
  const t0 = Date.parse(`${from}T00:00:00Z`) - OFF * 1000;
  const time = Array.from({ length: 96 }, (_, i) => (t0 + i * 36e5) / 1000);
  const col = (f) => time.map((_, i) => f(i));
  const hourly = { time, temperature_2m: col((i) => 9 + Math.floor(i / 24) * 4), relative_humidity_2m: col(() => 60), cloud_cover_low: col(() => 5), cloud_cover_mid: col(() => 0), cloud_cover_high: col(() => 0), visibility: col(() => 24000) };
  for (const l of Object.keys(Z)) {
    hourly[`geopotential_height_${l}hPa`] = col(() => Z[l]);
    hourly[`temperature_${l}hPa`] = col((i) => T[l] + Math.floor(i / 24) * 4);
    hourly[`relative_humidity_${l}hPa`] = col(() => 50);
  }
  return { latitude: 47.39, longitude: 8.04, elevation, utc_offset_seconds: OFF, hourly };
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
const mock = async (context) => {
  await context.route(/api\.open-meteo\.com\/v1\/forecast\?.*cape/, (r) => r.fulfill({ json: core(day(-1)) }));
  // a place above 1000 m (Davos: latitude 46.8) lies higher than the first layers; the others at 410 m
  await context.route(/api\.open-meteo\.com\/v1\/forecast\?.*cloud_cover_low/, (r) => r.fulfill({ json: layers(day(-1), /latitude=46\.80/.test(r.request().url()) ? 1560 : 410) }));
  await context.route(/geocoding-api\.open-meteo\.com\//, (r) => r.fulfill({ json: { results: [{ name: 'Splügen', latitude: 46.55, longitude: 9.33, admin1: 'Graubünden', country: 'Schweiz' }] } }));
};

test('The weather page shows the temperature by height, for more places and a peak, and an own place with Undo', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: homeFixture() });
  await mock(context);

  await page.goto('./#/wetter');
  const card = page.locator('[data-hoehe]');
  await expect(card.locator('[data-hoehe-row="1000"]')).toBeVisible({ timeout: 20_000 });
  // the three heights, highest first; today is 4 degrees warmer than the standard layers: 1000 m is 7.5 °C, 3000 m −5 °C
  await expect(card.locator('[data-hoehe-row]')).toHaveCount(3);
  await expect(card.locator('[data-hoehe-row="1000"] [data-hoehe-now]')).toHaveText('8°');
  await expect(card.locator('[data-hoehe-row="3000"] [data-hoehe-now]')).toHaveText('−5°');
  await expect(card.locator('[data-hoehe-zero]')).toContainText('2’200 m');
  await expect(card.locator('[data-hoehe-table] thead th')).toHaveCount(5); // height, now, 6, 12, 18
  await expect(card.locator('[data-hoehe-days] thead th')).toHaveCount(3); // height and two days

  // more places: Davos lies higher than 1000 m, so its 1000 m row has no value; a peak shows its own height
  await card.locator('[data-hoehe-set] summary').click();
  await card.locator('[data-hoehe-pick="davos"]').click();
  await card.locator('[data-hoehe-pick="peak:corvatsch"]').click();
  await expect(card.locator('[data-hoehe-item="davos"] [data-hoehe-row="1000"] [data-hoehe-now]')).toHaveText('–');
  await expect(card.locator('[data-hoehe-item="davos"] [data-hoehe-row="2000"] [data-hoehe-now]')).toHaveText('1°');
  await expect(card.locator('[data-hoehe-item="peak:corvatsch"] [data-hoehe-row="3303"] [data-hoehe-now]')).toHaveText('−8°');
  await expect(card.locator('[data-hoehe-item]')).toHaveCount(3);
  await page.locator('[data-wx-today]').screenshot({ path: info.outputPath(`hoehe-wetter-${info.project.name}.png`) });

  // taking one away again
  await card.locator('[data-hoehe-pick="davos"]').click();
  await expect(card.locator('[data-hoehe-item="davos"]')).toHaveCount(0);

  // an own place: search, add, rename, delete, Undo
  await card.locator('[data-hoehe-q]').fill('Splügen');
  await card.locator('.hh-find button[type="submit"]').click();
  await card.locator('[data-hoehe-add]').click();
  await expect(card.locator('[data-hoehe-own]')).toHaveCount(1);
  await expect(card.locator('[data-hoehe-item^="own:"]')).toContainText('Über Splügen');
  await card.locator('[data-hoehe-rename]').click();
  await page.locator('#rn-in').fill('Splügenpass');
  await page.locator('#rn-in').press('Enter');
  await expect(card.locator('[data-hoehe-own]')).toContainText('Splügenpass');
  await card.locator('[data-hoehe-delete]').click();
  await page.getByTestId('ask-delete').getByRole('button', { name: 'Löschen' }).click();
  await expect(card.locator('[data-hoehe-own]')).toHaveCount(0);
  await page.getByRole('button', { name: /Rückgängig/ }).click();
  await expect(card.locator('[data-hoehe-own]')).toHaveCount(1);
});

test('Without a choice only the place of the page shows, and the card says it is a guess', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: homeFixture() });
  await mock(context);
  await page.goto('./#/wetter');
  const card = page.locator('[data-hoehe]');
  await expect(card.locator('[data-hoehe-item]')).toHaveCount(1, { timeout: 20_000 });
  await expect(card).toContainText('Eine Schätzung zum Planen');
});
