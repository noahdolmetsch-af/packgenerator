// «Wohnort und Wetter pro Tour» (Noah 01.11.2026 «2a»): the weather page switches between the home place and the next tour.
// Made-up places; Open-Meteo is mocked, everything else outside is blocked (openHome).
import { test, expect } from './clock.js';
import { openHome, homeFixture, trip, day } from './home0460-fixture.js';

const OFF = 7200;
function core(from) {
  const t0 = Date.parse(`${from}T00:00:00Z`) - OFF * 1000;
  const time = Array.from({ length: 24 * 16 }, (_, i) => (t0 + i * 36e5) / 1000);
  const all = (v) => time.map(() => v);
  return {
    latitude: 47.39, longitude: 8.04, elevation: 400, utc_offset_seconds: OFF,
    hourly: { time, temperature_2m: all(14), apparent_temperature: all(13), precipitation_probability: all(5), precipitation: all(0), weather_code: all(3), wind_speed_10m: all(10), wind_gusts_10m: all(15), wind_direction_10m: all(270), cape: all(0), freezing_level_height: all(3000), visibility: all(20000), snowfall: all(0), snow_depth: all(0) },
    daily: { time: [0, 1, 2].map((d) => (t0 + d * 864e5) / 1000), sunrise: [0, 1, 2].map((d) => (t0 + d * 864e5 + 7 * 36e5) / 1000), sunset: [0, 1, 2].map((d) => (t0 + d * 864e5 + 19 * 36e5) / 1000), uv_index_max: [3, 3, 3] },
  };
}
const route = { name: 'test_data_gtp_ Runde', km: 50, gainM: 300, lossM: 300, start: { lat: 46.5, lon: 7.5 }, end: { lat: 46.5, lon: 8.15 }, line: [[46.5, 7.5], [46.5, 8.15]], profile: [] };

test('Weather page: switch between the home place and the next tour', async ({ page, context }, info) => {
  const data = homeFixture();
  data.tables.trips = [trip('Ortsrunde', day(1), { route, place: { name: 'test_data_gtp_ Testdorf', lat: 46.9, lon: 7.9 } })];
  data.tables.debriefs = [];
  await openHome(page, context, info, { data });
  await context.route(/api\.open-meteo\.com\/v1\/forecast\?.*cape/, (r) => r.fulfill({ json: core(day(0)) }));
  await page.goto('./#/wetter');
  const where = page.locator('.wx-where b');
  await expect(where).toContainText('Heimort', { timeout: 20_000 });
  await expect(page.locator('[data-wx-pick-home]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-wx-pick-next]').click();
  await expect(where).toContainText('Testdorf');
  await expect(page.locator('[data-wx-pick-next]')).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({ path: info.outputPath(`wetter-wahl-${info.project.name}.png`) });
  await page.locator('[data-wx-pick-home]').click();
  await expect(where).toContainText('Heimort');
});
