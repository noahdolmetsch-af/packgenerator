// «Wetter neu» PR 4 (Noah 04.11.2026 «5 alle»): sunrise, sunset and the time for the lights on the weather page.
// Made-up place and weather; the outside service is mocked.
import { test, expect } from './clock.js';
import { openHome, D0 } from './home0460-fixture.js';

const OFF = 7200;
function core() {
  const t0 = Date.parse(`${D0}T00:00:00Z`) - OFF * 1000;
  const time = Array.from({ length: 72 }, (_, i) => (t0 + i * 36e5) / 1000);
  return {
    latitude: 47.39, longitude: 8.04, elevation: 400, utc_offset_seconds: OFF,
    hourly: {
      time,
      temperature_2m: time.map(() => 12),
      apparent_temperature: time.map(() => 12),
      precipitation_probability: time.map(() => 5),
      precipitation: time.map(() => 0),
      weather_code: time.map(() => 3),
      wind_speed_10m: time.map(() => 10),
      wind_gusts_10m: time.map(() => 20),
      wind_direction_10m: time.map(() => 270),
      cape: time.map(() => 0),
      freezing_level_height: time.map(() => 3000),
      visibility: time.map(() => 20000),
      snowfall: time.map(() => 0),
      snow_depth: time.map(() => 0),
    },
    daily: { time: [0, 1, 2].map((d) => (t0 + d * 864e5) / 1000), sunrise: [0, 1, 2].map((d) => (t0 + d * 864e5 + 7.5 * 36e5) / 1000), sunset: [0, 1, 2].map((d) => (t0 + d * 864e5 + 16.75 * 36e5) / 1000), uv_index_max: [2, 2, 2] },
  };
}

test('Weather: sunrise, sunset and the lights', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await context.route(/api\.open-meteo\.com\/v1\/forecast\?.*cape/, (route) => route.fulfill({ json: core() }));
  await page.goto('./#/wetter');
  await page.reload();
  const card = page.locator('[data-wx-light]');
  await expect(card.locator('[data-wx-light-day="today"]')).toBeVisible({ timeout: 15_000 });
  await expect(card.locator('[data-wx-light-day="today"]')).toContainText('07:30');
  await expect(card.locator('[data-wx-light-day="today"]')).toContainText('16:45');
  await expect(card.locator('[data-wx-light-day="today"]')).toContainText('16:15'); // the lights half an hour before sunset
  await expect(card.locator('[data-wx-light-day="tomorrow"]')).toBeVisible();
  const side = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(side).toBeLessThanOrEqual(1);
  await card.screenshot({ path: info.outputPath(`wetter-licht-${info.project.name}.png`) });
});
