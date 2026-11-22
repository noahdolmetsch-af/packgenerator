// «Route kennt deine Erfahrung» (S3, Noah 21.11.2026 «2b»): under the route of a trip the stretches marked as bad or good
// after a ride show with their km; one tap counts how much of the route is new. Fictional data only (test_data_gtp_).
// SHOTS_DIR: where the pictures go (phone 390 and computer 1440).
import { test, expect } from './clock.js';
import { mkdirSync } from 'node:fs';
import { openHome, homeFixture, tr, trip, day } from './home0460-fixture.js';

const T = tr('de');
const PLAN = 'test_data_gtp_Route-E';
const SHOTS = process.env.SHOTS_DIR ?? null;
const shot = async (page, info, name) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.locator('section.rc').screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? '390' : '1440'}.png` });
};
const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());

// 31 points about 0.4 km apart, from the south-west to the north-east (about 12 km)
const line = Array.from({ length: 31 }, (_, i) => [47.36 + i * 0.0019, 7.15 + i * 0.0039]);
const route = { name: 'test_data_gtp_ Jura-Runde', km: 12, gainM: 320, lossM: 320, start: { lat: line[0][0], lon: line[0][1] }, end: { lat: line.at(-1)[0], lon: line.at(-1)[1] }, line, profile: Array.from({ length: 20 }, (_, k) => [k * (12 / 19), 450 + k * 8]) };
const way = (id, rating, from, to) => ({ id, rideId: 'r0', day: '2026-09-12', fromKm: from * 0.4, toKm: to * 0.4, line: line.slice(from, to + 1), rating, name: '', at: 1 });

function data(withRides) {
  const d = homeFixture();
  d.tables.trips = [trip('Route-E', day(4), { days: 1, route }), ...d.tables.trips.filter((x) => !/Herbstrunde|TEST-Runde/.test(x.title))];
  d.tables.settings.push({ key: 'pg-way-memory', value: { v: 1, ways: [way('r0:0', 'down', 8, 11), way('r0:1', 'down', 21, 24), way('r0:2', 'up', 2, 5)] } });
  if (withRides) d.tables.rides = [{ id: 'test_data_gtp_ride1', date: '2026-09-12', name: 'test_data_gtp_ Feierabend', km: 6, line: line.slice(0, 16) }];
  return d;
}

async function open(page, context, info, withRides) {
  await context.addInitScript((id) => localStorage.setItem('pack.currentTrip', id), PLAN);
  return openHome(page, context, info, { data: data(withRides), hour: 9 });
}

test('Route: marked stretches show with km, one tap counts what is new', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context, info, true);
  await page.goto('./#/pack');
  const rc = page.locator('section.rc');
  await expect(rc).toBeVisible();
  const known = rc.locator('[data-route-known]');
  await expect(known).toBeVisible();
  const bad = known.locator('[data-route-known-line="bad"]');
  await expect(bad).toContainText(/^2 Stücke, die du als schlecht markiert hast, liegen auf dieser Route, zuerst bei km \d/);
  await expect(known.locator('[data-route-known-line="good"]')).toHaveText(T('One stretch you marked as good is on this route.'));
  await expect(known.locator('[data-route-known-hint]')).toHaveCount(0); // ways exist: no hint
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);

  // one tap: the rides are read, about half of the route was ridden before
  await tap(known.locator('[data-route-known-compare]'), info);
  const fresh = known.locator('[data-route-known-line="fresh"]');
  await expect(fresh).toContainText(/\d+ % dieser Route sind neu für dich/);
  await expect(known.locator('[data-route-known-compare]')).toHaveCount(0);
  await shot(page, info, 'S3-route-erfahrung');
  expect(errors).toEqual([]);
});

test('Route without marked stretches and without rides: the hint says where to mark, the count says why it is empty', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const d = data(false);
  d.tables.settings = d.tables.settings.filter((s) => s.key !== 'pg-way-memory');
  await context.addInitScript((id) => localStorage.setItem('pack.currentTrip', id), PLAN);
  await openHome(page, context, info, { data: d, hour: 9 });
  await page.goto('./#/pack');
  const known = page.locator('section.rc [data-route-known]');
  await expect(known.locator('[data-route-known-hint]')).toBeVisible();
  await expect(known.locator('[data-route-known-line]')).toHaveCount(0);
  await tap(known.locator('[data-route-known-compare]'), info);
  await expect(known.locator('[data-route-known-empty]')).toBeVisible();
  await shot(page, info, 'S3-route-leer');
  expect(errors).toEqual([]);
});
