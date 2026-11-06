// «Sonnen-Ausfahrt» (Noah 06.11.2026 «1-5a»): the card on Today with a ride above the fog. Made-up place, rides and weather;
// Open-Meteo is mocked, everything else outside is blocked (openHome). Today is 07:00 here; the fog clears at 11 h.
import { test, expect } from './clock.js';
import { openHome, homeFixture, day, trip } from './home0460-fixture.js';

const OFF = 7200;
const LEVELS = { 1000: 110, 975: 330, 950: 550, 925: 780, 900: 1000, 850: 1500 };
const DAMP = { 1000: 98, 975: 98, 950: 97, 925: 96, 900: 40, 850: 30 };
const DRY = { 1000: 60, 975: 55, 950: 50, 925: 45, 900: 40, 850: 30 };
const WARM_ABOVE = { 1000: 3, 975: 2.5, 950: 2, 925: 1, 900: 9, 850: 8 };
const COOLING = { 1000: 6, 975: 4, 950: 3, 925: 1, 900: -1, 850: -4 };

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

// a made-up ride from near home: 42 km, up from 420 m to 1120 m and back
const PLATEAU = { start: { lat: 47.4, lon: 8.05 }, km: 42, gainM: 700, profile: [[0, 420], [3, 430], [9, 820], [15, 1120], [30, 700], [42, 420]] };
const withRide = (n = 1) => {
  const data = homeFixture();
  const names = ['Hochplateau', 'Waldkamm'];
  for (let i = 0; i < n; i++) data.tables.trips.push({ ...trip(names[i], day(-30 - i), { status: 'done', title: names[i] }), route: { ...PLATEAU, start: { lat: 47.4 + i * 0.1, lon: 8.05 } } });
  return data;
};

test('On a foggy morning Today suggests a ride above the fog with its time window', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: withRide(2), hour: 7 });
  await mock(context);
  await page.goto('./#/');
  const card = page.locator('[data-heute-sonne="rides"]');
  await expect(card).toBeVisible({ timeout: 20_000 });
  await expect(card.locator('[data-heute-sonne-name]')).toHaveText('Hochplateau');
  await expect(card).toContainText('42 km');
  await expect(card.locator('[data-heute-sonne-when]')).toContainText('Los bis');
  await expect(card.locator('[data-heute-sonne-when]')).toContainText('Der Nebel löst sich gegen 11 Uhr auf');
  await expect(card.locator('[data-heute-sonne-cam]')).toHaveAttribute('href', /bergfex/);
  await page.locator('[data-heute-wetter]').screenshot({ path: info.outputPath(`sonne-heute-${info.project.name}.png`) });

  // «Other ride» goes to the next, «Open ride» opens it in the planning
  await card.locator('[data-heute-sonne-next]').click();
  await expect(card.locator('[data-heute-sonne-name]')).toHaveText('Waldkamm');
  await card.locator('[data-heute-sonne-open]').click();
  await expect(page).toHaveURL(/#\/pack/);
});

test('Not today puts the card aside for the day', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: withRide(1), hour: 7 });
  await mock(context);
  await page.goto('./#/');
  await expect(page.locator('[data-heute-sonne]')).toBeVisible({ timeout: 20_000 });
  await page.locator('[data-heute-sonne-skip]').click();
  await expect(page.locator('[data-heute-sonne]')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('[data-heute-fogline]')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('[data-heute-sonne]')).toHaveCount(0);
});

test('The switch on the weather page turns the card off', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: withRide(1), hour: 7 });
  await mock(context);
  await page.goto('./#/wetter');
  await page.locator('[data-fogline-set] summary').click();
  await expect(page.locator('[data-fogline-ride]')).toBeChecked();
  await page.locator('[data-fogline-ride]').uncheck();
  await page.goto('./#/');
  await expect(page.locator('[data-heute-fogline]')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('[data-heute-sonne]')).toHaveCount(0);
});

test('Without a ride that reaches above the fog the card says so and leads to the planning', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: homeFixture(), hour: 7 });
  await mock(context);
  await page.goto('./#/');
  const card = page.locator('[data-heute-sonne="none"]');
  await expect(card).toBeVisible({ timeout: 20_000 });
  await expect(card).toContainText('keine deiner gespeicherten Fahrten');
  await page.locator('[data-heute-wetter]').screenshot({ path: info.outputPath(`sonne-keine-${info.project.name}.png`) });
  await card.locator('[data-heute-sonne-plan]').click();
  await expect(page).toHaveURL(/#\/pack/);
});

test('On a clear day there is no card', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: withRide(1), hour: 7 });
  await mock(context, { clear: true });
  await page.goto('./#/');
  await expect(page.locator('[data-heute-fogline]')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('[data-heute-sonne]')).toHaveCount(0);
});
