// «Wetter neu» PR 1 (Noah 04.11.2026 «1a 2a 3a 4b»): the rain strip and the windows for the Landi radar and the
// SRF webcams at the bottom of the weather page. Made-up place and weather; every outside page is mocked.
import { test, expect } from './clock.js';
import { openHome, D0 } from './home0460-fixture.js';

const OFF = 7200;
function core() {
  const t0 = Date.parse(`${D0}T00:00:00Z`) - OFF * 1000;
  const time = Array.from({ length: 72 }, (_, i) => (t0 + i * 36e5) / 1000);
  const h = (i) => i % 24;
  const rain = (i) => i < 30 && h(i) >= 15 && h(i) <= 19;
  const mm = (i) => (rain(i) ? [0.4, 1.2, 2.4, 1.1, 0.3][h(i) - 15] : 0);
  return {
    latitude: 47.39, longitude: 8.04, elevation: 400, utc_offset_seconds: OFF,
    hourly: {
      time,
      temperature_2m: time.map((_, i) => 12 + Math.min(8, Math.max(0, h(i) - 6))),
      apparent_temperature: time.map(() => 12),
      precipitation_probability: time.map((_, i) => (rain(i) ? 80 : 5)),
      precipitation: time.map((_, i) => mm(i)),
      weather_code: time.map(() => 3),
      wind_speed_10m: time.map(() => 12),
      wind_gusts_10m: time.map(() => 20),
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

test('Weather: the rain strip and the two windows at the bottom', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await context.route(/api\.open-meteo\.com\/v1\/forecast\?.*cape/, (route) => route.fulfill({ json: core() }));
  await context.route(/landi\.ch|srf\.ch/, (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<body style="font:16px sans-serif;background:#dbe8ef;padding:24px">Fenster der fremden Seite (Beispiel)</body>' }));
  await page.goto('./#/wetter?tab=radar');
  await page.reload();

  const strip = page.locator('[data-wx-r24]');
  await expect(strip).toBeVisible({ timeout: 15_000 });
  await expect(strip.locator('[data-wx-r24-say]')).toContainText('15:00');
  await expect(strip.locator('.wx-r24-bar')).toHaveCount(24);

  const landi = page.locator('[data-wx-window="landi"]');
  await expect(landi.locator('iframe')).toHaveCount(0); // closed: nothing is loaded by itself
  await landi.locator('[data-wx-window-toggle]').click();
  await expect(landi.locator('iframe')).toHaveAttribute('src', 'https://www.landi.ch/wetter/niederschlagsradar');
  await expect(landi.locator('[data-wx-window-tab]')).toHaveAttribute('href', 'https://www.landi.ch/wetter/niederschlagsradar');

  // a window that stays empty: switch it off on this device, the button stays
  await landi.locator('[data-wx-window-giveup]').click();
  await expect(landi.locator('[data-wx-window-off]')).toBeVisible();
  await expect(landi.locator('iframe')).toHaveCount(0);
  await expect(landi.locator('[data-wx-window-tab]')).toBeVisible();

  const srf = page.locator('[data-wx-window="srf"]');
  await srf.locator('[data-wx-window-toggle]').click();
  await expect(srf.locator('iframe')).toHaveAttribute('src', 'https://www.srf.ch/meteo/webcams');

  const side = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(side).toBeLessThanOrEqual(1);
  await strip.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500); // the scroll has settled
  // the part that is new: from the rain strip to the end of the SRF window
  const a = await strip.boundingBox();
  const b = await srf.boundingBox();
  const y = await page.evaluate(() => window.scrollY);
  await page.screenshot({ path: info.outputPath(`wetter-regen-fenster-${info.project.name}.png`), fullPage: true, clip: { x: Math.max(0, a.x - 12), y: a.y + y - 12, width: a.width + 24, height: b.y + b.height - a.y + 24 } });
});
