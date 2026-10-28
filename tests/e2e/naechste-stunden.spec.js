// Ziel 6 «Die nächsten Stunden» (Noah 27.10.2026 «4a»): the weather page shows the next 2, 4, 6 and 8 hours from
// several weather models side by side. Made-up weather; every outside request is mocked or blocked (openHome).
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { MODELS } from '../../src/lib/wetter/stunden.js';

const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());

/** 10 hours from t0; two models see rain from hour 5, the others stay dry, one model does not cover the place. */
function models(t0) {
  const time = Array.from({ length: 10 }, (_, i) => (t0 + i * 36e5) / 1000);
  const hourly = { time };
  for (const m of MODELS) {
    const out = m.id === 'icon_d2';
    const wet = m.id === 'meteoswiss_icon_ch1' || m.id === 'ecmwf_ifs025';
    hourly[`temperature_2m_${m.id}`] = time.map((_, i) => (out ? null : 14 + i));
    hourly[`precipitation_${m.id}`] = time.map((_, i) => (out ? null : wet && i >= 5 ? 1.2 : 0));
    hourly[`wind_speed_10m_${m.id}`] = time.map(() => (out ? null : 12));
    hourly[`wind_gusts_10m_${m.id}`] = time.map(() => (out ? null : 35));
    hourly[`weather_code_${m.id}`] = time.map(() => (out ? null : 3));
  }
  return { latitude: 47.39, longitude: 8.04, utc_offset_seconds: 3600, hourly };
}

/** A small core answer (the page needs it for «Heute»): 2 days, dry. */
function core(t0) {
  const time = Array.from({ length: 48 }, (_, i) => (t0 - 6 * 36e5 + i * 36e5) / 1000);
  const v = (x) => time.map(() => x);
  return {
    latitude: 47.39, longitude: 8.04, elevation: 400, utc_offset_seconds: 3600,
    hourly: { time, temperature_2m: v(15), apparent_temperature: v(14), precipitation_probability: v(5), precipitation: v(0), weather_code: v(2), wind_speed_10m: v(10), wind_gusts_10m: v(20), wind_direction_10m: v(270), cape: v(0), freezing_level_height: v(3000), visibility: v(20000), snowfall: v(0), snow_depth: v(0) },
    daily: { time: [0, 1].map((d) => (t0 + d * 864e5) / 1000), sunrise: [0, 1].map((d) => (t0 + d * 864e5 - 2 * 36e5) / 1000), sunset: [0, 1].map((d) => (t0 + d * 864e5 + 10 * 36e5) / 1000), uv_index_max: [3, 3] },
  };
}

test('Weather: the next hours from several models', async ({ page, context }, info) => {
  await openHome(page, context, info);
  const now = await page.evaluate(() => Date.now());
  const t0 = Math.floor(now / 36e5) * 36e5;
  await context.route(/api\.open-meteo\.com\/v1\/forecast\?.*cape/, (route) => route.fulfill({ json: core(t0) }));
  await context.route(/api\.open-meteo\.com\/v1\/forecast\?.*models=/, (route) => route.fulfill({ json: models(t0) }));
  await page.goto(`${page.url().split('#')[0]}#/wetter`);
  const card = page.locator('[data-wx-hours]');
  await expect(card).toBeVisible({ timeout: 15_000 });
  await expect(card.locator('[data-wx-hours-step]')).toHaveCount(4);
  // in 2 and 4 h all four models are dry; in 6 and 8 h two of four see rain
  await expect(card.locator('[data-wx-hours-step="2"]')).toHaveAttribute('data-agree', 'dry');
  await expect(card.locator('[data-wx-hours-step="8"]')).toHaveAttribute('data-agree', 'split');
  await expect(card.locator('[data-wx-hours-step="8"]')).toContainText(/2 (of|von) 4/);
  await tap(card.locator('[data-wx-hours-models]'), info);
  await expect(card.locator('tbody tr')).toHaveCount(4);
  await expect(card).toContainText('MeteoSchweiz 1 km');
  const d = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(d).toBeLessThanOrEqual(1);
  await card.screenshot({ path: info.outputPath('naechste-stunden.png') });
});
