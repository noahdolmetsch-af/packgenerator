// Paket U3 «Live-Karte», the ways in and after the ride (Noah 19.10.2026 «5a», Heute «1a», «2a», «4a»):
// - Heute: the tile «Ausfahrt starten» is in the catalog only (not on the ready wall); added it leads to the
//   live map of today's trip, or to a free ride without one;
// - Aktiv, Unterwegs, the trip (Packen) and the race mode link to #/live/<trip>;
// - the Reise-Spur shows the evening line of a day from the own recordings;
// - the family link shows the live point while it is younger than 30 minutes.
// Fictional data only (test_data_gtp_), the clock on Friday 9 October 2026 09:00, every outside address blocked.
import { test, expect } from '@playwright/test';
import { openHome, homeFixture, tr, trip, day } from './home0460-fixture.js';
import { linkPayload, seal, newKey } from '../../src/lib/spur/link.js';
import { withLive } from '../../src/lib/live/familylive.js';
import { TILE } from '../../src/lib/home/tiles.js';

const T = tr('de');
const JURA = 'test_data_gtp_Jura-Wochenende';
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/** The home data with a trip running today (yesterday to tomorrow) and one closed recording of today. */
function data({ today = true } = {}) {
  const d = homeFixture();
  d.tables.trips = d.tables.trips.filter((x) => !/TEST-Runde/.test(x.title));
  if (today) d.tables.trips.unshift(trip('Jura-Wochenende', day(-1), { days: 3 }));
  const start = Date.parse(`${day(0)}T07:00:00+02:00`);
  const pts = [];
  for (let i = 0; i <= 20; i++) pts.push([47.3 + i * 0.002, 7.2, i * 30]);
  for (let i = 1; i <= 10; i++) pts.push([47.34, 7.2, 600 + i * 30]); // a 5 min stop
  for (let i = 1; i <= 10; i++) pts.push([47.34 + i * 0.002, 7.2, 900 + i * 30]);
  d.tables.tracks = today ? [{ id: 'test_data_gtp_rec1', kind: 'rec', tripId: JURA, day: day(0), startAt: start, endAt: start + 1200_000, pts, km: 6.7, open: false }] : [];
  return d;
}

test('Heute: the tile Start a ride comes from the catalog and leads to the live map of today', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: data() });
  // not on the ready wall (HN4 stays as approved)
  await expect(page.locator('.wall [data-tile="liveride"]')).toHaveCount(0);
  await page.getByRole('button', { name: T('Add a tile') }).click();
  const sheet = page.getByRole('dialog', { name: T('Add a tile') });
  await sheet.getByRole('searchbox', { name: T('Search tiles') }).fill(T(TILE.liveride.label).slice(0, 8));
  await sheet.locator('[data-add="liveride"]').click();
  await page.keyboard.press('Escape');
  const tile = page.locator('.wall [data-tile="liveride"] a');
  await expect(tile).toHaveAttribute('href', `#/live/${JURA}`);
  await expect(tile).toContainText('test_data_gtp_ Jura-Wochenende');
  expect(await noSideways(page)).toBe(0);
  expect(errors).toEqual([]);
});

test('Heute: without a trip today the tile starts a free ride', async ({ page, context }, info) => {
  const d = data({ today: false });
  d.tables.settings.push({ key: 'homeWall', value: { v: 10, tiles: [{ id: 'daycard', size: 'long' }, { id: 'liveride', size: 's' }] } });
  await openHome(page, context, info, { data: d });
  await expect(page.locator('.wall [data-tile="liveride"] a')).toHaveAttribute('href', '#/live');
});

test('Aktiv, On the way and the trip link to the live map of the trip', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.addInitScript((id) => localStorage.setItem('pack.currentTrip', id), JURA);
  await openHome(page, context, info, { data: data() });
  await page.goto('./#/flow');
  await expect(page.locator('main header [data-live-start]')).toHaveAttribute('href', `#/live/${JURA}`);
  await page.goto('./#/ride');
  await expect(page.locator('[data-uw-helpers] [data-live-start]')).toHaveAttribute('href', `#/live/${JURA}`);
  expect(await noSideways(page)).toBe(0);
  await page.goto('./#/pack');
  await expect(page.locator('main [data-live-start]').first()).toHaveAttribute('href', `#/live/${JURA}`);
  expect(errors).toEqual([]);
});

test('Reise-Spur: the evening line of today from the own recording', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: data() });
  await page.goto(`./#/spur/${JURA}`);
  const line = page.locator('[data-day-sum]');
  await expect(line).toHaveCount(1);
  await expect(line).toContainText(/6[.,]7 km/);
  await expect(line).toContainText('5 min');
});

test('the family link shows the live point while it is fresh', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const key = await newKey();
  const id = 'test_data_gtp_live0001'.padEnd(22, 'x').slice(0, 22);
  const spur = { km: 6.7, days: [{ day: day(0), n: 1, km: 6.7, lines: [{ id: 'l', pts: [[47.3, 7.2], [47.34, 7.2], [47.36, 7.2]] }], places: [], notes: [] }] };
  const at = Date.parse(`${day(0)}T08:50:00+02:00`);
  const payload = withLive(linkPayload({ title: 'test_data_gtp_ Jura-Wochenende', startDate: day(0) }, spur, { cut: false }), { lat: 47.36, lon: 7.2, at }, { cut: false });
  const e = await seal(payload, key);
  await openHome(page, context, info, { data: data() });
  await context.route(/packgen-three\.vercel\.app\/api\/sync\?action=spur/, (route) => route.fulfill({ json: { ok: true, e, at: new Date(at).toISOString() } }));
  await page.goto(`./#/spur-link/${id}/${key}`);
  await expect(page.locator('[data-family-live]')).toHaveText(T('Live: here at {time}', { time: '08:50' }));
  expect(errors).toEqual([]);
});
