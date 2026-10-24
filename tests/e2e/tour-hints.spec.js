// Paket G extras (Noah 19.10.2026 «1a 2a 3a», «4-6»): the packing list shows the sun hint with «dazu»
// (high UV), and Aktiv shows the card «Ozon und Pollen». Open-Meteo is answered by the test, everything
// else outside the preview is blocked. Fictional data only.
import { test, expect } from '@playwright/test';
import { homeFixture, trip, day, tr, D0 } from './home0460-fixture.js';
import { importAndSettle, settle } from './settle.js';

const T = tr('de');

async function open(page, context, data) {
  await context.route(/^https?:\/\/(?!localhost[:/])(?!.*open-meteo)/, (route) => route.abort());
  await context.route(/air-quality-api\.open-meteo\.com/, (route) => {
    const time = [day(0), day(1)].flatMap((d) => [...Array(24).keys()].map((h) => `${d}T${String(h).padStart(2, '0')}:00`));
    return route.fulfill({ json: { hourly: { time, ozone: time.map(() => 90), grass_pollen: time.map((s) => (s.startsWith(day(1)) ? 120 : 5)), birch_pollen: time.map(() => 0), alder_pollen: time.map(() => 0), mugwort_pollen: time.map(() => 0), ragweed_pollen: time.map(() => 0) } } });
  });
  await context.route(/\/\/api\.open-meteo\.com/, (route) => route.fulfill({ json: { daily: { time: [] } } }));
  await page.clock.setFixedTime(new Date(`${D0}T09:00:00+02:00`));
  await context.addInitScript(() => {
    localStorage.setItem('lang', 'de');
    localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.goto('./#/');
  await importAndSettle(page, { name: 'hints.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) });
}

test('Packen: high UV suggests the own sunglasses with «dazu»; Aktiv: strong grass pollen tomorrow', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const data = homeFixture();
  const sun = { ...data.tables.items[3], id: 'test_data_gtp_sun', name: 'test_data_gtp_ Sonnenbrille', ownership: 'owned' };
  data.tables.items.push(sun);
  data.tables.trips = [trip('Sonnig', day(1), { forecast: { fetchedAt: `${day(0)}T06:00:00.000Z`, place: { name: '', lat: 47.39, lon: 8.04 }, days: [{ date: day(1), min: 12, max: 26, rainMm: 0, rainPct: 5, uv: 7.6 }] } })];
  data.tables.debriefs = [];
  await open(page, context, data);

  await page.goto('./#/pack');
  await settle(page);
  const hint = page.locator('[data-sky="sun"]');
  await expect(hint).toBeVisible();
  await expect(hint).toContainText(T('UV index up to {uv}: high.', { uv: 8 }));
  await hint.locator('[data-sky-add="sunglasses"]').click();
  await expect(hint.getByText('test_data_gtp_ Sonnenbrille')).toBeVisible();
  await expect(hint.locator('[data-sky-add="sunglasses"]')).toHaveCount(0);

  await page.goto('./#/wetter'); // «Aktiv neu» (Noah 22.10.2026): ozone and pollen moved from Aktiv to the weather page
  await settle(page);
  const air = page.locator('[data-section="air"]');
  await expect(air.locator(`[data-air-day="${day(1)}"]`)).toContainText(T('Strong pollen: {list}.', { list: T('Grasses') }));
  await expect(air.locator(`[data-air-day="${day(0)}"]`)).toContainText(T('No strong pollen, ozone normal.'));

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});
