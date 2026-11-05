// «Temperaturen nach Höhe» in «Tour planen» (Noah 05.11.2026 «4b»): the eight heights on the day of the tour, the start and
// peak heights, the temperature at the start as a button, the hints. German UI, fictional data (test_data_gtp_), made-up air
// layers (hoehe-fixture.js, today 4 degrees warmer than the standard layers each day: the tour day, 13 December, is +8);
// the clock stands on Saturday 12 December 2026, 09:00. Open-Meteo is mocked, everything else outside is blocked.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { layers } from './hoehe-fixture.js';
import { importAndSettle } from './settle.js';

const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const D0 = '2026-12-12';
const day = (n) => new Date(Date.parse(`${D0}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
const WITH = 'test_data_gtp_hsk_with';
const WITHOUT = 'test_data_gtp_hsk_without';
const packs = [{ key: 'pack', name: 'Backpack 30 L', volumeL: 30 }];

function fixture(path) {
  const data = structuredClone(base);
  const trip = (id, extra) => ({ id, domain: 'ski', title: `test_data_gtp_ ${id}`, startDate: day(1), days: 1, bikeId: null, bike: null, setup: {}, packs, entries: [], ready: [], status: 'planned', ...extra });
  data.tables.trips = [trip(WITH, { place: { name: 'test_data_gtp_ Beispieltal', lat: 46.8, lon: 9.8 } }), trip(WITHOUT, {})];
  data.tables.debriefs = [];
  writeFileSync(path, JSON.stringify(data));
}

async function open(page, context, info, hash) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.route(/api\.open-meteo\.com\/v1\/forecast\?.*cloud_cover_low/, (r) => r.fulfill({ json: layers(day(-1), 410) }));
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.setFixedTime(new Date(`${D0}T09:00:00+01:00`));
  const file = info.outputPath('hsk-fixture.json');
  fixture(file);
  await page.goto('./');
  await importAndSettle(page, file);
  await page.goto(`./${hash}`);
  await expect(page.locator('h1')).toHaveCount(1);
}

test('Tour planen shows the eight heights on the tour day, the temperature at the start as a button and the hints', async ({ page, context }, info) => {
  await open(page, context, info, `#/ski/plan/${WITH}`);
  const card = page.locator('[data-plan="heights"]');
  await expect(card.locator('[data-heights-row]')).toHaveCount(8, { timeout: 20_000 });
  // the tour day is +8: 1000 m at 6 h is 11.5 °C, 3000 m −1 °C, 4000 m −9 °C
  await expect(card.locator('[data-heights-row="1000"] td').first()).toHaveText('12°');
  await expect(card.locator('[data-heights-row="3000"] td').first()).toHaveText('−1°');
  await expect(card.locator('[data-heights-row="4000"] td').first()).toHaveText('−9°');
  await expect(card.locator('thead th')).toHaveCount(5);
  // the 0 °C line at the planned time of the peak (11 h without a time): between 800 hPa (1950 m, 5.5 °C) and 700 hPa (3000 m, −1 °C)
  await expect(card.locator('[data-heights-hint="zero"]')).toContainText('2’800 m');

  // the start height: the temperature at the start (7 h) and the button; nothing is filled in on its own
  await expect(page.locator('[data-f="temp"]')).toHaveValue('');
  await card.locator('[data-f="startM"]').fill('1000');
  await card.locator('[data-f="startM"]').blur();
  await expect(card.locator('[data-heights-start]')).toContainText('07:00');
  await expect(card.locator('[data-heights-start]')).toContainText('12 °C');
  await expect(card.locator('[data-heights-hint="startWarm"]')).toBeVisible();
  await card.locator('[data-heights-use]').click();
  await expect(page.locator('[data-f="temp"]')).toHaveValue('12');
  await expect(card.locator('[data-heights-use]')).toBeDisabled();

  // the peak height: 4000 m is very cold on the tour day? −9 °C is not colder than −10: no cold hint; a low peak above zero gets the wet-snow hint
  await card.locator('[data-f="peakM"]').fill('4000');
  await card.locator('[data-f="peakM"]').blur();
  await expect(card.locator('[data-heights-hint="peakCold"]')).toHaveCount(0);
  await card.locator('[data-f="peakM"]').fill('1500');
  await card.locator('[data-f="peakM"]').blur();
  await expect(card.locator('[data-heights-hint="peakWarm"]')).toContainText('1’500 m');

  await page.reload();
  await expect(card.locator('[data-f="startM"]')).toHaveValue('1000');
  await expect(card.locator('[data-f="peakM"]')).toHaveValue('1500');
  await card.scrollIntoViewIfNeeded();
  await card.screenshot({ path: info.outputPath(`hoehe-ski-${info.project.name}.png`) });
});

test('A tour without a place says what to do', async ({ page, context }, info) => {
  await open(page, context, info, `#/ski/plan/${WITHOUT}`);
  const card = page.locator('[data-plan="heights"]');
  await expect(card.locator('[data-heights-noplace]')).toBeVisible({ timeout: 20_000 });
  await expect(card.locator('[data-heights-place]')).toBeVisible();
});
