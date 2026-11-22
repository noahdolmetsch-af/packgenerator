// «Traum der Woche» (Noah 07.11.2026 «1a … 3a»): the tile on Heute shows a dream that fits now, with a countdown and the
// weather for exactly its days; it stays away without such a dream; a dream gets a fixed date and «Rides through the night».
// Fictional data only; the forecast is faked, nothing leaves the preview.
import { test, expect } from './clock.js';
import { mkdirSync } from 'node:fs';
import { openHome, homeFixture, day } from './home0460-fixture.js';

const P = 'test_data_gtp_';
const SHOTS = process.env.SHOTS_DIR ?? null;
const shot = async (loc, info, name) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await loc.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? '390' : '1440'}.png` });
};
const withDreams = (dreams) => {
  const d = homeFixture();
  d.tables.settings.push({ key: 'dreams', value: { dreams } });
  return d;
};
const race = { id: `${P}r1`, title: `${P} Nachtrennen`, kind: 'race', days: 2, note: '', url: '', at: '2026-10-01T08:00:00.000Z', raceDate: day(3), night: true };
// a forecast with a cold night on the second race day
const coldNight = (context) =>
  context.route(/api\.open-meteo\.com\/v1\/forecast/, (r) => {
    const days = [...Array(16).keys()].map((n) => day(n));
    return r.fulfill({ json: { daily: { time: days, temperature_2m_min: days.map((_, n) => (n === 4 ? 2 : 9)), temperature_2m_max: days.map(() => 16), precipitation_sum: days.map(() => 0), precipitation_probability_max: days.map(() => 5), wind_speed_10m_max: days.map(() => 12) } } });
  });

test('Traum der Woche: countdown and good weather for the days of a night race', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: withDreams([race]) });
  const tile = page.locator('[data-section="wochentraum"]');
  await expect(tile).toBeVisible();
  await expect(tile.locator('[data-wt-name]')).toContainText(`${P} Nachtrennen`);
  await expect(tile.locator('[data-wt-when]')).toContainText('In 3 Tagen');
  await expect(tile.locator('[data-wt-days] li')).toHaveCount(2);
  await expect(tile.locator('[data-wt-verdict]')).toContainText('Tage und Nacht sehen gut aus');
  await tile.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  await shot(tile, info, 'TW1-gut');
  await tile.locator('[data-wt-open]').click();
  await expect(page).toHaveURL(/#\/trips\/dreams$/);
  expect(errors).toEqual([]);
});

test('Traum der Woche: a cold night makes it not ideal and says why', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: withDreams([race]), weather: coldNight });
  const tile = page.locator('[data-section="wochentraum"]');
  await expect(tile.locator('[data-wt-verdict]')).toContainText('Nicht ideal: eine kalte Nacht');
  await tile.scrollIntoViewIfNeeded();
  await shot(tile, info, 'TW2-kalt');
});

test('Traum der Woche: without a fitting dream the tile stays away', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: withDreams([{ ...race, raceDate: '2027-05-05' }]) });
  await expect(page.locator('[data-section="wochentraum"]')).toHaveCount(0);
});

test('Traum der Woche: a dream gets a fixed date and the night flag in its window', async ({ page, context }, info) => {
  const free = { id: `${P}f1`, title: `${P} Eigener Traum`, kind: 'other', days: 2, note: '', url: '', at: '2026-10-01T08:00:00.000Z', months: [3] };
  await openHome(page, context, info, { data: withDreams([free]) });
  await expect(page.locator('[data-section="wochentraum"]')).toHaveCount(0);
  await page.goto('./#/trips/dreams');
  await page.locator('[data-dream]', { hasText: `${P} Eigener Traum` }).first().click();
  const dlg = page.locator('dialog[open]');
  await dlg.locator('[data-dream-date]').fill(day(3));
  await dlg.locator('[data-dream-night] input').check();
  await shot(dlg, info, 'TW3-feld');
  await dlg.getByRole('button', { name: /Schliessen|Fertig|Close/i }).first().click();
  await page.goto('./#/');
  const tile = page.locator('[data-section="wochentraum"]');
  await expect(tile).toBeVisible();
  await expect(tile.locator('[data-wt-name]')).toContainText(`${P} Eigener Traum`);
  await expect(tile.locator('[data-wt-days] li')).toHaveCount(2);
});
