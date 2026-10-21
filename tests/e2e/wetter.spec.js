// Paket Y «Wetter-Kern» (Noah 20.10.2026 «1-5a», «1-8 alle», «1a»): the line on Heute when a ride is planned
// today, the weather page (today, best window, Landi radar), and «Meine Webcams» with the home cam on Heute.
// Made-up places and weather; every outside request is mocked or blocked (openHome).
import { test, expect } from '@playwright/test';
import { openHome, D0 } from './home0460-fixture.js';

const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
const OFF = 7200;

/** The core answer (unixtime, local offset): 3 days, 12 °C at 6:00 rising to 20 °C, wind 30 km/h from the west, rain from 15:00 on the first day. */
function core() {
  const t0 = Date.parse(`${D0}T00:00:00Z`) - OFF * 1000;
  const time = Array.from({ length: 72 }, (_, i) => (t0 + i * 36e5) / 1000);
  const h = (i) => i % 24;
  const rain = (i) => i < 24 && h(i) >= 15;
  return {
    latitude: 47.39,
    longitude: 8.04,
    elevation: 400,
    utc_offset_seconds: OFF,
    hourly: {
      time,
      temperature_2m: time.map((_, i) => 12 + Math.min(8, Math.max(0, h(i) - 6))),
      apparent_temperature: time.map((_, i) => 10 + Math.min(8, Math.max(0, h(i) - 6))),
      precipitation_probability: time.map((_, i) => (rain(i) ? 80 : 5)),
      precipitation: time.map((_, i) => (rain(i) ? 1.5 : 0)),
      weather_code: time.map(() => 3),
      wind_speed_10m: time.map(() => 30),
      wind_gusts_10m: time.map(() => 45),
      wind_direction_10m: time.map(() => 270),
      cape: time.map(() => 0),
      freezing_level_height: time.map(() => 3000),
      visibility: time.map(() => 20000),
      snowfall: time.map(() => 0),
      snow_depth: time.map(() => 0),
    },
    daily: { time: [0, 1, 2].map((d) => (t0 + d * 864e5) / 1000), sunrise: [0, 1, 2].map((d) => (t0 + d * 864e5 + 7 * 36e5) / 1000), sunset: [0, 1, 2].map((d) => (t0 + d * 864e5 + 19 * 36e5) / 1000), uv_index_max: [3, 3, 3] },
  };
}
const noSideways = async (page, where) => {
  const d = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(d, where).toBeLessThanOrEqual(1);
};

test('Weather: the line on Today, the weather page, and a home webcam', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await context.route(/api\.open-meteo\.com\/v1\/forecast\?.*cape/, (route) => route.fulfill({ json: core() }));
  await context.route(/cams\.example/, (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PNG }));
  await page.reload();

  // Heute: a ride is planned today (the fixture's trip) → one weather line
  const line = page.locator('[data-heute-wetter-line]');
  await expect(line).toBeVisible({ timeout: 15_000 });
  await expect(line).toContainText('°C');
  await expect(line).toContainText('30 km/h');
  await expect(line).toContainText('15:00');
  await noSideways(page, 'today');

  // the weather page
  await tap(line, info);
  await expect(page).toHaveURL(/#\/wetter/);
  await expect(page.locator('[data-page="wetter"]')).toBeVisible();
  await expect(page.locator('[data-wx-today]')).toContainText('30 km/h');
  await expect(page.locator('[data-landi]')).toHaveAttribute('href', 'https://www.landi.ch/wetter/niederschlagsradar');
  const best = page.locator('[data-wx-bestline]');
  await expect(best).toBeVisible();
  await tap(page.locator('[data-wx-dur="2"]'), info);
  await expect(page.locator('[data-wx-dur="2"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-wx-day]').first()).toBeVisible();
  await noSideways(page, 'weather page');
  await page.screenshot({ path: info.outputPath('wetter.png'), fullPage: true });

  // Meine Webcams: add a home cam → small on Heute; delete with the app's question
  await page.locator('[data-webcam-name]').fill('test_data_gtp_ See');
  await page.locator('[data-webcam-url]').fill('https://cams.example/see.jpg');
  await page.locator('[data-webcam-add] input[type="checkbox"]').check();
  await tap(page.locator('[data-webcam-add] button[type="submit"]'), info);
  await expect(page.locator('[data-webcam]')).toHaveCount(1);
  await expect(page.locator('[data-webcam] img')).toBeVisible();
  await page.goto('./#/');
  await expect(page.locator('[data-heute-cam]')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('[data-heute-cam]')).toContainText('test_data_gtp_ See');
  await page.goto('./#/wetter');
  await tap(page.locator('[data-webcam-delete]'), info);
  await tap(page.getByTestId('ask-delete').locator('.btn.del'), info);
  await expect(page.locator('[data-webcam]')).toHaveCount(0);
  await expect(page.locator('[data-webcam-empty]')).toBeVisible();

  // «Wie war es draussen?» (2a): a note with feel, where and what you wore → listed; delete asks first
  const feel = page.locator('[data-wx-feel]');
  await tap(feel.locator('[data-feel="cold"]'), info);
  await tap(feel.locator('[data-feel-part="hands"]'), info);
  await feel.locator('[data-feel-wore]').fill('test_data_gtp_ dünne Handschuhe');
  await tap(feel.locator('[data-feel-save]'), info);
  await expect(feel.locator('[data-feel-list] li')).toHaveCount(1);
  await expect(feel.locator('[data-feel-list]')).toContainText('test_data_gtp_ dünne Handschuhe');
  await tap(feel.locator('[data-feel-list] button'), info);
  await tap(page.getByTestId('ask-delete').locator('.btn.del'), info);
  await expect(feel.locator('[data-feel-list]')).toHaveCount(0);
  await noSideways(page, 'weather page with the feel card');
});
