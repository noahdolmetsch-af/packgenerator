// «Lange Tage» (S1, Noah 21.11.2026 «1a»): the riding-hours guess of a long route counts how much slower your long rides were.
// Fictional data only (test_data_gtp_). SHOTS_DIR: where the pictures go (phone 390 and computer 1440).
import { test, expect } from './clock.js';
import { mkdirSync } from 'node:fs';
import { openHome, homeFixture, tr, trip, day } from './home0460-fixture.js';

const T = tr('de');
const PLAN = 'test_data_gtp_Route-L';
const SHOTS = process.env.SHOTS_DIR ?? null;
const shot = async (page, info, name) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.locator('.part:has([data-tired])').first().screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? '390' : '1440'}.png` });
};

const line = Array.from({ length: 31 }, (_, i) => [47.36 + i * 0.0019, 7.15 + i * 0.0039]);
const route = (km) => ({ name: 'test_data_gtp_ Lange Runde', km, gainM: 0, lossM: 0, start: { lat: line[0][0], lon: line[0][1] }, end: { lat: line.at(-1)[0], lon: line.at(-1)[1] }, line, profile: Array.from({ length: 20 }, (_, k) => [k * (km / 19), 450]) });
// a ride that took `f` times the standard guess (16 km/h, flat)
const ride = (i, km, f) => ({ id: `test_data_gtp_p${i}`, date: `2026-09-${String(i + 1).padStart(2, '0')}`, name: `test_data_gtp_ Fahrt ${i}`, km, gainM: 0, movingH: (km / 16) * f, use: true });

function data(km, longF) {
  const d = homeFixture();
  d.tables.trips = [trip('Route-L', day(4), { days: 1, route: route(km) }), ...d.tables.trips.filter((x) => !/Herbstrunde|TEST-Runde/.test(x.title))];
  const rides = [40, 45, 50, 55, 60, 65].map((km2, i) => ride(i, km2, 1)).concat([90, 100, 110].map((km2, i) => ride(10 + i, km2, longF)));
  d.tables.settings = d.tables.settings.filter((s) => s.key !== 'pace');
  d.tables.settings.push({ key: 'pace', value: { kmh: 16, climbMh: 600, stops: null, n: rides.length, rides } });
  return d;
}

async function open(page, context, info, km, longF) {
  await context.addInitScript((id) => localStorage.setItem('pack.currentTrip', id), PLAN);
  await openHome(page, context, info, { data: data(km, longF), hour: 9 });
  await page.goto('./#/pack');
  // the «Route» tile opens the trip conditions: the route part with its riding-hours guess
  await page.locator('button.cell', { hasText: T('Route') }).first().click();
  await expect(page.locator('.rw').first()).toBeVisible();
}

test('Long day: a line says how much longer long rides took, and the hours include it', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context, info, 100, 1.25);
  const rc = page.locator('.rw').first();
  const line = rc.locator('[data-tired]');
  await expect(line).toBeVisible();
  await expect(line).toContainText('etwa 25 % länger');
  await expect(line).toContainText('3 lange Fahrten');
  // 100 km at 16 km/h = 6.25 h; with the 25 % it is 7.8 h, so 8 h (0.5 steps)
  await expect(rc.getByRole('button', { name: /8 h/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  await shot(page, info, 'S1-lange-tage');
  expect(errors).toEqual([]);
});

test('Short route or no slowdown: no line, the hours stay as before', async ({ page, context }, info) => {
  await open(page, context, info, 60, 1.25);
  await expect(page.locator('.rw [data-tired]')).toHaveCount(0);
  await expect(page.locator('.rw').first().getByRole('button', { name: /4 h/ })).toBeVisible(); // 60 km / 16 = 3.75 h → 4 h
  await open(page, context, info, 100, 1);
  await expect(page.locator('.rw [data-tired]')).toHaveCount(0);
});
