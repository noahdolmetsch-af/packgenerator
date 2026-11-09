// «Schneefallgrenze» (Noah 04.11.2026 «1b 2a 3a 4a 5a»): the snow line on the weather page and on Today.
// Made-up place and weather; Open-Meteo is mocked, everything else outside is blocked (openHome).
import { test, expect } from './clock.js';
import { openHome, homeFixture, day, D0 } from './home0460-fixture.js';

const OFF = 7200;
// snowy: wet and cold (1 °C, 80 % rain chance) from the hour `snowy` of every day (08.11.2026: the hint needs all three); line: a fixed snow line
function core(from, { own = true, snowy = null, line = null } = {}) {
  const t0 = Date.parse(`${from}T00:00:00Z`) - OFF * 1000;
  const time = Array.from({ length: 24 * 16 }, (_, i) => (t0 + i * 36e5) / 1000);
  const all = (v) => time.map(() => v);
  // snow line (Open-Meteo's own value) 1650 m at night, 2150 m in the afternoon; the freezing level 300 m higher
  const snowH = time.map((_, i) => line ?? 1900 + Math.round(250 * Math.sin((((i % 24) - 9) / 24) * 2 * Math.PI)));
  const cold = (i) => snowy != null && i % 24 >= snowy;
  return {
    latitude: 47.39, longitude: 8.04, elevation: 410, utc_offset_seconds: OFF,
    hourly: { time, temperature_2m: time.map((_, i) => (cold(i) ? 1 : 6)), apparent_temperature: all(4), precipitation_probability: time.map((_, i) => (cold(i) ? 80 : 5)), precipitation: all(0), weather_code: all(3), wind_speed_10m: all(10), wind_gusts_10m: all(15), wind_direction_10m: all(270), cape: all(0), freezing_level_height: snowH.map((m) => m + 300), visibility: all(20000), snowfall: all(0), snow_depth: all(0), snowfall_height: own ? snowH : all(null) },
    daily: { time: [0, 1, 2].map((d) => (t0 + d * 864e5) / 1000), sunrise: [0, 1, 2].map((d) => (t0 + d * 864e5 + 7 * 36e5) / 1000), sunset: [0, 1, 2].map((d) => (t0 + d * 864e5 + 17 * 36e5) / 1000), uv_index_max: [2, 2, 2] },
  };
}

test('The weather page and Today show the snow line, with a hint and a switch', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: homeFixture() });
  await context.route(/api\.open-meteo\.com\/v1\/forecast\?.*cape/, (r) => r.fulfill({ json: core(day(-1), { snowy: 0 }) }));

  await page.goto('./#/wetter');
  const now = page.locator('[data-snowline-now]');
  await expect(now).toBeVisible({ timeout: 20_000 });
  await expect(now).toContainText(/Schneefallgrenze [\d’']+ m ü\. M\./);
  await expect(page.locator('[data-snowline-slots] li')).toHaveCount(6);
  await expect(page.locator('[data-snowline-hint]')).toHaveCount(0); // 1650 m and more against the place at 410 m
  await page.locator('[data-wx-today]').screenshot({ path: info.outputPath(`schnee-wetter-${info.project.name}.png`) });

  // 4a: set a height above the line, with precipitation and cold weather: the hint shows
  await page.locator('[data-snowline-set] summary').click();
  await page.locator('[data-snowline-own]').fill('2000');
  await page.locator('[data-snowline-set] button[type="submit"]').click();
  await expect(page.locator('[data-snowline-hint]')).toBeVisible();
  await expect(page.locator('[data-snowline-hint]')).toContainText('2’000');
  await page.locator('[data-wx-today]').screenshot({ path: info.outputPath(`schnee-hinweis-${info.project.name}.png`) });

  // Today: the line for the home place (a trip is on today, but the line does not need one)
  await page.goto('./#/');
  const line = page.locator('[data-heute-snowline]');
  await expect(line).toBeVisible({ timeout: 20_000 });
  await expect(line).toContainText('Schneefallgrenze');
  await expect(line).toContainText('Schnee bei dir möglich');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: info.outputPath(`schnee-heute-${info.project.name}.png`) });

  // 2a: switched off on the weather page, gone on Today
  await page.goto('./#/wetter');
  await page.locator('[data-snowline-set] summary').click();
  await page.locator('[data-snowline-home]').uncheck();
  await page.goto('./#/');
  await expect(page.locator('[data-heute-wetter]')).toBeAttached();
  await expect(page.locator('[data-heute-snowline]')).toHaveCount(0);
});

test('Without Open-Meteo\'s own value the line is the freezing level minus 300 m, and the page says so', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: homeFixture() });
  await context.route(/api\.open-meteo\.com\/v1\/forecast\?.*cape/, (r) => r.fulfill({ json: core(day(-1), { own: false }) }));
  await page.goto('./#/wetter');
  await expect(page.locator('[data-snowline-now]')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('[data-snowline]')).toContainText('unter der Nullgradgrenze');
});

test('A dry mild day shows no snow hint, even when the line is down to the place (08.11.2026)', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: homeFixture() });
  // the line is at 400 m all day, the place at 410 m, but it is dry and 6 °C: no snow
  await context.route(/api\.open-meteo\.com\/v1\/forecast\?.*cape/, (r) => r.fulfill({ json: core(day(-1), { line: 400 }) }));
  await page.goto('./#/wetter');
  await expect(page.locator('[data-snowline-now]')).toContainText('400');
  await expect(page.locator('[data-snowline-hint]')).toHaveCount(0);
  await page.locator('[data-wx-today]').screenshot({ path: info.outputPath(`schnee-trocken-wetter-${info.project.name}.png`) });
  await page.goto('./#/');
  const line = page.locator('[data-heute-snowline]');
  await expect(line).toBeVisible({ timeout: 20_000 });
  await expect(line).toContainText('Schneefallgrenze 400 m');
  await expect(line).not.toContainText('Schnee bei dir möglich');
  await page.locator('[data-heute-wetter]').screenshot({ path: info.outputPath(`schnee-trocken-heute-${info.project.name}.png`) });
});

test('Snow at the place later today: the hint says from which hour', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: homeFixture() });
  // dry until 15 h, then wet and 1 °C with the line at 400 m
  await context.route(/api\.open-meteo\.com\/v1\/forecast\?.*cape/, (r) => r.fulfill({ json: core(day(-1), { line: 400, snowy: 15 }) }));
  await page.goto('./#/wetter');
  await expect(page.locator('[data-snowline-hint]')).toContainText('ab 15 Uhr', { timeout: 20_000 });
  await page.locator('[data-wx-today]').screenshot({ path: info.outputPath(`schnee-ab-wetter-${info.project.name}.png`) });
  await page.goto('./#/');
  const line = page.locator('[data-heute-snowline]');
  await expect(line).toContainText('Schnee bei dir möglich ab 15 Uhr', { timeout: 20_000 });
  await page.locator('[data-heute-wetter]').screenshot({ path: info.outputPath(`schnee-ab-heute-${info.project.name}.png`) });
});
