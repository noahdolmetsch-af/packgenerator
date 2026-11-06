// «Nebel auf der Tour-Route» (Noah 05.11.2026 «4b 5b»): the fog line against a planned route, in «Weather for this tour» and in the profile.
// Made-up place and weather; Open-Meteo is mocked, everything else outside is blocked (openHome).
import { test, expect } from './clock.js';
import { openHome, homeFixture, trip, day } from './home0460-fixture.js';

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
  return { latitude: 46.5, longitude: 7.5, elevation: 400, utc_offset_seconds: OFF, hourly };
}
function core(from) {
  const t0 = Date.parse(`${from}T00:00:00Z`) - OFF * 1000;
  const time = Array.from({ length: 24 * 16 }, (_, i) => (t0 + i * 36e5) / 1000);
  const all = (v) => time.map(() => v);
  return {
    latitude: 46.5, longitude: 7.5, elevation: 400, utc_offset_seconds: OFF,
    hourly: { time, temperature_2m: all(6), apparent_temperature: all(4), precipitation_probability: all(5), precipitation: all(0), weather_code: all(3), wind_speed_10m: all(10), wind_gusts_10m: all(15), wind_direction_10m: all(270), cape: all(0), freezing_level_height: all(2200), visibility: all(20000), snowfall: all(0), snow_depth: all(0), snowfall_height: all(1900) },
    daily: { time: [0, 1, 2].map((d) => (t0 + d * 864e5) / 1000), sunrise: [0, 1, 2].map((d) => (t0 + d * 864e5 + 7 * 36e5) / 1000), sunset: [0, 1, 2].map((d) => (t0 + d * 864e5 + 17 * 36e5) / 1000), uv_index_max: [2, 2, 2] },
  };
}
const mock = async (context, opts) => {
  await context.route(/api\.open-meteo\.com\/v1\/forecast\?.*cape/, (r) => r.fulfill({ json: core(day(-1)) }));
  await context.route(/api\.open-meteo\.com\/v1\/forecast\?.*cloud_cover_low/, (r) => r.fulfill({ json: fog(day(-1), opts) }));
};

const route = { name: 'test_data_gtp_ Nebelrunde', km: 40, gainM: 700, lossM: 700, start: { lat: 46.5, lon: 7.5 }, end: { lat: 46.5, lon: 7.9 }, line: [[46.5, 7.5], [46.5, 7.9]], profile: [[0, 400], [10, 600], [20, 900], [30, 1100], [40, 700]] };

test('A route that starts in the fog says where it climbs above it, when the fog clears, and shows the band', async ({ page, context }, info) => {
  const data = homeFixture();
  data.tables.trips = [trip('Nebelrunde', day(0), { route })];
  data.tables.debriefs = [];
  await openHome(page, context, info, { data });
  await mock(context);
  await page.goto('./#/pack');
  const line = page.locator('[data-tour-fog]');
  await expect(line).toBeVisible({ timeout: 20_000 });
  await expect(line).toContainText('Start im Nebel (Nebelgrenze ca. 800 m), ab km 16.7 über dem Nebel.');
  await expect(line).toContainText('löst sich gegen 11 Uhr auf');
  await page.locator('[data-tour-wetter]').screenshot({ path: info.outputPath(`nebel-tour-${info.project.name}.png`) });
  const tag = page.locator('[data-profile-fog]');
  await expect(tag).toBeVisible({ timeout: 20_000 });
  await expect(tag).toContainText('Nebel bis ca. 800 m um 9 Uhr');
  await page.locator('[data-route-climbs]').screenshot({ path: info.outputPath(`nebel-profil-${info.project.name}.png`) });
});

test('On a clear day the tour weather says no fog is expected and no band is drawn', async ({ page, context }, info) => {
  const data = homeFixture();
  data.tables.trips = [trip('Klarrunde', day(0), { route })];
  data.tables.debriefs = [];
  await openHome(page, context, info, { data });
  await mock(context, { clear: true });
  await page.goto('./#/pack');
  await expect(page.locator('[data-tour-fog]')).toContainText('Am Start wird kein Nebel erwartet.', { timeout: 20_000 });
  await expect(page.locator('[data-profile-fog]')).toHaveCount(0);
});
