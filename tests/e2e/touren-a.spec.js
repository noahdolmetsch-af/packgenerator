// Touren-Ideen 41–49 (996 Ideen, Noah 25.10.2026), the small ones in the browser:
//   41 «Route prüfen»: a GPX without heights shows the hints before it becomes the route; «Trotzdem übernehmen».
//   42 «Kleider für Wartezeiten»: the onion counts colder with time standing still.
//   43 «Was hätte gefehlt?»: what was taken off the list shows in the debrief; one tap = was missing.
//   46 «Plan B mit Auslöser»: the own trigger on Planen; on Unterwegs the agreed trigger in the hint.
// Fictional data only (test_data_gtp_), the clock on Friday 9 October 2026 (home0460-fixture.js).
import { test, expect } from './clock.js';
import { openHome, homeFixture, tr, trip, day, D0 } from './home0460-fixture.js';

const T = tr('de');
const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const line = Array.from({ length: 30 }, (_, i) => [47.36 + i * 0.002, 7.15 + i * 0.004]);
const route = (name, km) => ({ name, km, gainM: 600, lossM: 600, start: { lat: 47.36, lon: 7.15 }, end: { lat: 47.418, lon: 7.266 }, line, profile: Array.from({ length: 20 }, (_, k) => [k * (km / 19), 450 + k * 10]) });
const wet = (d) => ({ fetchedAt: `${D0}T07:00:00.000Z`, places: [{ name: 'Start of the day', lat: 47.36, lon: 7.15, hours: Array.from({ length: 24 }, (_, h) => ({ t: `${d}T${String(h).padStart(2, '0')}:00`, h, temp: 9, rainMm: h >= 8 && h <= 16 ? 2.4 : 0, rainPct: 90, wind: 20, gust: 30 })) }] });
// a GPX of 40 track points without heights
const GPX = `<?xml version="1.0"?><gpx version="1.1"><trk><name>test_data_gtp_Ohne Hoehen</name><trkseg>${Array.from({ length: 40 }, (_, i) => `<trkpt lat="${(47.36 + i * 0.001).toFixed(4)}" lon="${(7.15 + i * 0.001).toFixed(4)}"></trkpt>`).join('')}</trkseg></trk></gpx>`;

const PLAN = 'test_data_gtp_Plan-A';
const RUN = 'test_data_gtp_Regen-A';
const PAST = 'test_data_gtp_Zurueck-A';

function data() {
  const d = homeFixture();
  const items = d.tables.items;
  d.tables.trips = [
    trip('Plan-A', day(4), { days: 2 }),
    trip('Regen-A', day(-1), { days: 3, route: route('test_data_gtp_ Lang', 186), planB: { kind: 'train', note: '', route: null, trigger: { mm: 20, gust: null } }, rideWx: { [day(0)]: wet(day(0)) } }),
    trip('Zurueck-A', day(-3), { days: 2, finished: day(-2), leftOut: [{ itemId: items[12].id, at: `${day(-6)}T08:00:00.000Z` }] }),
    ...d.tables.trips.filter((x) => !/Herbstrunde|TEST-Runde/.test(x.title)),
  ];
  return d;
}

async function open(page, context, info, chosen) {
  await context.addInitScript((id) => localStorage.setItem('pack.currentTrip', id), chosen);
  return openHome(page, context, info, { data: data(), hour: 9 });
}

test('41 + 46 Plan: the route check before a GPX without heights, the own plan B trigger', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context, info, PLAN);
  await page.goto('./#/pack');
  const rc = page.locator('section.rc');
  await expect(rc).toBeVisible();
  await rc.locator('input[type=file]').setInputFiles({ name: 'test_data_gtp_ohne-hoehen.gpx', mimeType: 'application/gpx+xml', buffer: Buffer.from(GPX) });
  const check = rc.locator('[data-route-check]');
  await expect(check).toBeVisible();
  await expect(check.locator('[data-route-check-line="ele"]')).toHaveText(T('The file has no heights: no climbing and no profile.'));
  expect(await noSideways(page)).toBe(0);
  await tap(check.locator('[data-route-check-use]'), info);
  await expect(check).toHaveCount(0);
  await expect(rc.locator('.sub')).toContainText('km');

  // 46: the own trigger
  const pb = page.locator('[data-door-planb]');
  await tap(pb.locator('summary'), info);
  await tap(pb.getByRole('button', { name: T('Train home') }), info);
  const trig = pb.locator('[data-door-trigger]');
  await expect(trig).toBeVisible();
  await tap(trig.getByRole('button', { name: T('from {n} mm', { n: 10 }) }), info);
  await expect(trig.getByRole('button', { name: T('from {n} mm', { n: 10 }) })).toHaveAttribute('aria-pressed', 'true');
  expect(await noSideways(page)).toBe(0);
  expect(errors).toEqual([]);
});

test('46 On the way: the hint names the agreed trigger', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context, info, RUN);
  await page.goto('./#/ride');
  const door = page.locator('[data-ride-door]');
  await expect(door.locator('[data-ride-trigger]')).toContainText(T('from {n} mm of rain a day', { n: 20 }));
  expect(errors).toEqual([]);
});

test('43 Debrief: what was left at home, one tap = was missing', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context, info, PLAN);
  await page.goto(`./#/debrief/${PAST}`);
  const left = page.locator('[data-leftout]');
  await expect(left).toContainText(T('You left these at home. Was one of them missing?'));
  const chip = left.locator('[data-leftout-item]').first();
  const name = (await chip.textContent()).replace(/^\+\s*/, '').trim();
  await tap(chip, info);
  await expect(page.locator('section.miss-fold ul.exc')).toContainText(name);
  await expect(page.locator('[data-leftout]')).toHaveCount(0);
  expect(await noSideways(page)).toBe(0);
  expect(errors).toEqual([]);
});
