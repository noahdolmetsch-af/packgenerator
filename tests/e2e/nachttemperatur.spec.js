// «Nachttemperatur» (Noah 06.11.2026 «1a und c 2a 3a 4a 5a»): the card on the weather page.
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

test('The weather page shows the night temperature with the changes, the bars, the trend and frost', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: homeFixture() });
  // this morning 5, yesterday 3, a week ago -5; tomorrow 7, then falling to frost on night 6
  await mock(context, { '-7': -5, '-1': 3, 0: 5, 1: 7, 2: 5, 3: 3, 4: 1, 5: 0, 6: -1, 7: 2 });

  await page.goto('./#/wetter');
  const card = page.locator('[data-nacht]');
  await expect(card).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('[data-nacht-last]')).toContainText('Heute früh');
  await expect(page.locator('[data-nacht-last] b')).toContainText('5');
  await expect(page.locator('[data-nacht-next] b')).toContainText('7');
  await expect(page.locator('[data-nacht-vs-yesterday]')).toContainText('2° wärmer als gestern früh');
  await expect(page.locator('[data-nacht-vs-week]')).toContainText('10° wärmer als vor einer Woche');
  await expect(page.locator('[data-nacht-next-vs]')).toContainText('Morgen früh 2° wärmer als heute früh');
  await expect(page.locator('[data-nacht-bars] li')).toHaveCount(14);
  await expect(page.locator('[data-nacht-bars] li.today')).toHaveCount(1);
  await expect(page.locator('[data-nacht-trend-word]')).toContainText('Prognose: sinkend');
  await expect(page.locator('[data-nacht-frost]')).toContainText('Frost in 6 Tagen (unter 0 °C)');
  await expect(page.locator('[data-nacht-plus]')).toHaveCount(0); // last night was 5 °C already
  await expect(page.locator('[data-nacht-src]')).toContainText('kein Thermometer');
  await card.screenshot({ path: info.outputPath(`nacht-karte-${info.project.name}.png`) });
});

test('A cold night: «Wieder 5 Plus in 6 Tagen» and the note that a forecast is unsure after 5 days', async ({ page, context }) => {
  await openHome(page, context, test.info(), { data: homeFixture() });
  await mock(context, { 0: 3, 1: 2, 2: 1, 3: 2, 4: 3, 5: 4, 6: 6, 7: 6 });
  await page.goto('./#/wetter');
  await expect(page.locator('[data-nacht-plus]')).toContainText('Wieder 5 Plus in 6 Tagen', { timeout: 20_000 });
  await expect(page.locator('[data-nacht-trend]')).toContainText('Nach 5 Tagen ist eine Prognose unsicher');
  await expect(page.locator('[data-nacht-frost]')).toHaveCount(0);
});

test('Without an answer from the weather service the card says why it is empty', async ({ page, context }) => {
  await openHome(page, context, test.info(), { data: homeFixture() });
  await context.route(/api\.open-meteo\.com\/v1\/forecast\?.*cape/, (r) => r.fulfill({ json: core(day(-1)) }));
  await context.route(/api\.open-meteo\.com\/v1\/forecast\?.*past_days=8/, (r) => r.abort());
  await page.goto('./#/wetter');
  await expect(page.locator('[data-nacht-empty]')).toContainText('Noch keine Nachtwerte', { timeout: 20_000 });
});
