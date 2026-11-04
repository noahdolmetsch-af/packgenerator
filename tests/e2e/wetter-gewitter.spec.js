// «Wetter neu» PR 3 (Noah 04.11.2026 «5 alle»): the thunderstorm hint with times on the weather page.
// Made-up place and weather; the outside service is mocked.
import { test, expect } from './clock.js';
import { openHome, D0 } from './home0460-fixture.js';

const OFF = 7200;
function core() {
  const t0 = Date.parse(`${D0}T00:00:00Z`) - OFF * 1000;
  const time = Array.from({ length: 72 }, (_, i) => (t0 + i * 36e5) / 1000);
  const h = (i) => i % 24;
  const storm = (i) => i < 24 && h(i) >= 15 && h(i) <= 17;
  return {
    latitude: 47.39, longitude: 8.04, elevation: 400, utc_offset_seconds: OFF,
    hourly: {
      time,
      temperature_2m: time.map(() => 22),
      apparent_temperature: time.map(() => 22),
      precipitation_probability: time.map((_, i) => (storm(i) ? 70 : 5)),
      precipitation: time.map((_, i) => (storm(i) ? 2 : 0)),
      weather_code: time.map((_, i) => (storm(i) ? 95 : 3)),
      wind_speed_10m: time.map(() => 10),
      wind_gusts_10m: time.map(() => 20),
      wind_direction_10m: time.map(() => 270),
      cape: time.map((_, i) => (storm(i) ? 1500 : 0)),
      freezing_level_height: time.map(() => 3500),
      visibility: time.map(() => 20000),
      snowfall: time.map(() => 0),
      snow_depth: time.map(() => 0),
    },
    daily: { time: [0, 1, 2].map((d) => (t0 + d * 864e5) / 1000), sunrise: [0, 1, 2].map((d) => (t0 + d * 864e5 + 6 * 36e5) / 1000), sunset: [0, 1, 2].map((d) => (t0 + d * 864e5 + 20 * 36e5) / 1000), uv_index_max: [6, 6, 6] },
  };
}

test('Weather: thunderstorms possible with a time span', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await context.route(/api\.open-meteo\.com\/v1\/forecast\?.*cape/, (route) => route.fulfill({ json: core() }));
  await page.goto('./#/wetter');
  await page.reload();
  const hint = page.locator('[data-wx-thunder="today"]');
  await expect(hint).toBeVisible({ timeout: 15_000 });
  await expect(hint).toContainText('15:00');
  await expect(hint).toContainText('18:00');
  await expect(hint).toContainText('70');
  await expect(page.locator('[data-wx-warn="thunder"]')).toHaveCount(1); // one hint, not the old «from» line next to it
  const side = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(side).toBeLessThanOrEqual(1);
  await page.locator('[data-wx-today]').screenshot({ path: info.outputPath(`wetter-gewitter-${info.project.name}.png`) });
});
