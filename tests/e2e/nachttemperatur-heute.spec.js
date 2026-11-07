// «Nachttemperatur» (Noah 06.11.2026 «1a und c 2a 3a 4a 5a», PR 2): the calm line on Today.
// Made-up place and weather; Open-Meteo is mocked, everything else outside is blocked (openHome).
import { test, expect } from './clock.js';
import { openHome, homeFixture, day } from './home0460-fixture.js';

const OFF = 7200; // 9 October 2026 is summer time in Zurich
const atLocal = (date, h) => Date.parse(`${date}T00:00:00Z`) + h * 36e5 - OFF * 1000;

// 8 days back, 9 ahead; `lows[k]` = the lowest value of the night that ends on the morning of today+k (at 4 h), else 6 degrees more
function nacht(lows) {
  const t0 = atLocal(day(-8), 0);
  const time = Array.from({ length: 17 * 24 }, (_, i) => (t0 + i * 36e5) / 1000);
  const temperature_2m = time.map((s, i) => {
    const h = i % 24;
    const k = Math.floor(i / 24) - 8 + (h >= 18 ? 1 : 0);
    const low = lows[k] ?? 5;
    return h === 4 ? low : low + 6;
  });
  return { latitude: 47.39, longitude: 8.04, elevation: 410, utc_offset_seconds: OFF, hourly: { time, temperature_2m } };
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
const mock = async (context, lows) => {
  await context.route(/api\.open-meteo\.com\/v1\/forecast\?.*cape/, (r) => r.fulfill({ json: core(day(-1)) }));
  await context.route(/api\.open-meteo\.com\/v1\/forecast\?.*past_days=8/, (r) => r.fulfill({ json: nacht(lows) }));
};

test('Today shows one calm line for the home place; it can be switched off on the weather page', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: homeFixture() });
  // this morning 5, yesterday 3, tomorrow 7, then falling; frost only on night 6 (no frost hint on Today)
  await mock(context, { '-7': -5, '-1': 3, 0: 5, 1: 7, 2: 5, 3: 3, 4: 1, 5: 0, 6: -1, 7: 2 });

  await page.goto('./#/');
  const line = page.locator('[data-heute-nacht]');
  await expect(line).toBeVisible({ timeout: 20_000 });
  await expect(line).toContainText('Nacht: heute früh 5 °C, morgen früh 7 °C');
  await expect(line).toContainText('2° wärmer als gestern früh');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: info.outputPath(`nacht-heute-${info.project.name}.png`) });

  // a tap opens the weather page, where the switch lives
  await line.click();
  await expect(page.locator('[data-nacht]')).toBeVisible({ timeout: 20_000 });
  await page.locator('[data-nacht-set] summary').click();
  await page.locator('[data-nacht-home]').uncheck();
  await page.goto('./#/');
  await expect(page.locator('[data-heute-wetter]')).toBeAttached();
  await expect(page.locator('[data-heute-nacht]')).toHaveCount(0);
});

test('Frost within three days is the hint on Today, before the change against yesterday', async ({ page, context }) => {
  await openHome(page, context, test.info(), { data: homeFixture() });
  await mock(context, { '-1': 3, 0: 5, 1: 7, 2: 4, 3: -2, 4: 1, 5: 1, 6: 1, 7: 1 });
  await page.goto('./#/');
  const line = page.locator('[data-heute-nacht]');
  await expect(line).toContainText('Frost in 3 Tagen (unter 0 °C)', { timeout: 20_000 });
  await expect(line).not.toContainText('wärmer als gestern');
});
