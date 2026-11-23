// «Wetterseite aufräumen» (Noah 23.11.2026 «ja»): one rain start time for the whole page, the short answer at the top,
// pollen and ozone closed, the rain chart with an axis and the value on pointing, the shown place name.
// Made-up place and weather; Open-Meteo is mocked, everything else outside is blocked.
import { test, expect } from './clock.js';
import { openHome, homeFixture, trip, day, D0 } from './home0460-fixture.js';

const OFF = 7200; // 09:00 on D0 is 07:00 UTC
const NOW = Date.parse(`${D0}T07:00:00Z`);
const Q = 15 * 60 * 1000;
// rain today in the hours stamped 12 and 13 (= 11:00 to 13:00 local) and tomorrow stamped 6, 7 and 8 (= 05:00 to 08:00)
const WET = (i) => [12, 13].includes(i) || [24 + 6, 24 + 7, 24 + 8].includes(i);
function core() {
  const t0 = Date.parse(`${D0}T00:00:00Z`) - OFF * 1000;
  const time = Array.from({ length: 72 }, (_, i) => (t0 + i * 36e5) / 1000);
  const all = (v) => time.map(() => v);
  return {
    latitude: 47.39, longitude: 8.04, elevation: 400, utc_offset_seconds: OFF,
    hourly: {
      time,
      temperature_2m: time.map((_, i) => 3 + Math.min(2, Math.max(0, (i % 24) - 8))),
      apparent_temperature: time.map((_, i) => 1 + Math.min(2, Math.max(0, (i % 24) - 8))),
      precipitation_probability: time.map((_, i) => (WET(i) ? 80 : 5)), precipitation: time.map((_, i) => (WET(i) ? 0.8 : 0)), weather_code: all(61),
      wind_speed_10m: all(9), wind_gusts_10m: all(14), wind_direction_10m: all(270),
      cape: all(0), freezing_level_height: all(3000), visibility: all(20000), snowfall: all(0), snow_depth: all(0),
    },
    daily: { time: [0, 1, 2].map((d) => (t0 + d * 864e5) / 1000), sunrise: [0, 1, 2].map((d) => (t0 + d * 864e5 + 7 * 36e5) / 1000), sunset: [0, 1, 2].map((d) => (t0 + d * 864e5 + 17 * 36e5) / 1000), uv_index_max: [1, 1, 1] },
  };
}
const mockCore = (context) => context.route(/api\.open-meteo\.com\/v1\/forecast\?.*cape/, (route) => route.fulfill({ json: core() }));
// the quarters agree with the hours: dry until 11:00 local (09:00 UTC), then rain (the stamp is the end of the quarter)
const stamps = Array.from({ length: 20 }, (_, i) => NOW + i * Q);
const mockRain = (context) => context.route(/api\.open-meteo\.com\/v1\/forecast\?.*minutely_15/, (r) => r.fulfill({
  json: { minutely_15: { time: stamps.map((ms) => ms / 1000), precipitation: stamps.map((_, i) => (i >= 9 ? 0.6 : 0)) } },
}));

test('One rain start time on the tour card, in Today, in the short answer and under the 3 hours', async ({ page, context }, info) => {
  const data = homeFixture();
  data.tables.trips = [trip('Herbstrunde', day(1), { days: 1 })];
  data.tables.debriefs = [];
  await openHome(page, context, info, { data, weather: mockCore });
  await mockRain(context);
  await page.goto('./#/wetter');
  const answer = page.locator('[data-wx-answer]');
  await expect(answer).toBeVisible({ timeout: 20_000 });
  await expect(answer).toContainText('Regen ab 11:00');
  await expect(answer).toContainText('Regenzeug einpacken');
  await expect(page.locator('[data-wx-today] .wx-line')).toContainText('Regen ab 11:00');
  await expect(page.locator('[data-wx-r3-say]')).toContainText('Trocken bis 11:00', { timeout: 20_000 });
  // tomorrow the rain begins at 05:00, before the ride (07:00): the card names the real start
  await expect(page.locator('[data-zt-weather]')).toContainText('Regen ab 05:00', { timeout: 20_000 });
  // the short answer stands before everything else
  const [a, b] = await Promise.all([answer.boundingBox(), page.locator('[data-zur-tour]').boundingBox()]);
  expect(a.y).toBeLessThan(b.y);
});

test('The place shows as its name, pollen and ozone are closed, the rain chart has an axis and a value on pointing', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: homeFixture(), weather: mockCore });
  await mockRain(context);
  await page.goto('./#/wetter');
  await expect(page.locator('.wx-where b').first()).toHaveText('test_data_gtp_ Heimort', { timeout: 20_000 });
  const fold = page.locator('[data-wx-air-fold]');
  await expect(fold).toBeVisible();
  await expect(fold).not.toHaveAttribute('open', '');
  await fold.locator(':scope > summary').click();
  await expect(fold).toHaveAttribute('open', '');
  await page.locator('[data-wx-tab="radar"]').click();
  const chart = page.locator('[data-chart="wxr24"]');
  await expect(chart).toBeVisible({ timeout: 20_000 });
  await expect(chart.locator('[data-yticks]')).toBeVisible();
  await chart.locator('[data-plot]').click({ position: { x: 20, y: 30 } });
  await expect(chart.locator('[data-readout]')).toContainText('mm');
});

test('The lake chart has an axis and shows the water of a day on pointing', async ({ page, context }, info) => {
  const zurichDay = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T12:00:00Z`));
  await openHome(page, context, info, { data: homeFixture(), weather: mockCore });
  await context.route(/packgen-three\.vercel\.app\/api\/lake/, (route) =>
    route.fulfill({
      status: 200,
      headers: { 'access-control-allow-origin': '*', 'content-type': 'application/json' },
      body: JSON.stringify({
        at: new Date().toISOString(),
        now: { at: new Date(Date.now() - 20 * 60000).toISOString(), water: 12.4, air: 8.9 },
        days: Array.from({ length: 30 }, (_, i) => ({ day: zurichDay(i - 29), min: 12, max: 13, mean: 14.5 - i * 0.07, n: 144 })),
        forecast: [1, 2, 3].map((n) => ({ day: zurichDay(n), water: 12.3 - n * 0.1, min: 12, max: 12.5 })),
        sources: { measurement: true, forecast: true },
      }),
    }),
  );
  await page.goto('./#/wetter');
  const chart = page.locator('[data-card="lake"] [data-chart="lake"]');
  await expect(chart).toBeVisible({ timeout: 20_000 });
  await expect(chart.locator('[data-yticks]')).toBeVisible();
  await chart.locator('[data-plot]').click({ position: { x: 30, y: 30 } });
  await expect(chart.locator('[data-readout]')).toContainText('°C');
  await expect(chart.locator('[data-line="ahead"]')).toHaveCount(1); // the preview stays a line of its own
});
