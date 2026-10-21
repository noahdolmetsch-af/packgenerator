// Paket Z «Aus jeder Tour lernen» and Paket SP «Schneller packen» (Noah 20.10.2026): in the debrief a breakdown
// becomes a bike-care job, a rated place to sleep becomes an own point, the tour postcard is drawn on the device;
// on Planen the spare part comes back as a suggestion, the sleep spot nearby, and the card «Schneller packen»
// (two people, the wash, the morning, the packing time); on Unterwegs the morning list on the start day.
// Fictional data only (test_data_gtp_), the clock on Friday 9 October 2026 (home0460-fixture.js).
import { test, expect } from '@playwright/test';
import { openHome, homeFixture, tr, trip, day, entries } from './home0460-fixture.js';

const T = tr('de');
const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const line = Array.from({ length: 20 }, (_, i) => [47.36 + i * 0.002, 7.15 + i * 0.004]);
const route = (km) => ({ name: 'test_data_gtp_ Runde', km, gainM: 800, lossM: 800, start: { lat: 47.36, lon: 7.15 }, end: { lat: 47.398, lon: 7.226 }, line, profile: [[0, 450], [km, 500]] });
const PAST = 'test_data_gtp_Jura';
const NEXT = 'test_data_gtp_Herbstrunde';
const TODAY = 'test_data_gtp_Start-heute';

function data({ withBreakdown = false, withSpot = false } = {}) {
  const d = homeFixture();
  d.tables.items = [...d.tables.items, { ...d.tables.items[3], id: 'test_data_gtp_tube', name: 'test_data_gtp_ Spare tube', nameDe: 'test_data_gtp_ Ersatzschlauch', category: 'tools' }];
  d.tables.trips = d.tables.trips.map((x) => {
    if (x.id === PAST) return { ...x, route: route(110), ...(withBreakdown ? { breakdowns: [{ id: 'test_data_gtp_b1', kind: 'flat', part: 'test_data_gtp_ hinten', place: '', note: '', taskId: null, at: `${day(-9)}T12:00:00.000Z` }] } : {}) };
    if (x.id === NEXT) return { ...x, route: route(90) };
    return x;
  });
  if (withSpot) d.tables.settings = [...d.tables.settings, { key: 'own-points', value: { points: [{ id: 'test_data_gtp_p1', lat: 47.37, lon: 7.17, name: 'test_data_gtp_ Zeltplatz am See', note: 'test_data_gtp_ ruhig', kind: 'sleep', stars: 5, night: day(-9), tripId: PAST, createdAt: `${day(-9)}T20:00:00.000Z` }] } }];
  return d;
}
const read = (page, store, key) => page.evaluate(async ([s, k]) => {
  const req = indexedDB.open('pack-generator');
  const db = await new Promise((ok) => (req.onsuccess = () => ok(req.result)));
  return new Promise((ok) => {
    const os = db.transaction(s).objectStore(s);
    const r = k == null ? os.getAll() : os.get(k);
    r.onsuccess = () => ok(r.result);
  });
}, [store, key]);

test('Debrief: a breakdown becomes a bike-care job, a sleep spot an own point, the postcard is drawn', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: data() });
  await page.goto(`./#/debrief/${PAST}`);
  const card = page.locator('[data-tour-learn]');
  await expect(card).toContainText(T('For next time'));
  expect(await noSideways(page)).toBe(0);

  // the breakdown, with the bike-care job
  await tap(card.locator('[data-break-add]'), info);
  await tap(card.locator('[data-break-kind="flat"]'), info);
  await card.getByLabel(T('Part')).fill('test_data_gtp_ Schlauch hinten');
  await tap(card.locator('[data-break-save]'), info);
  await expect(card).toContainText(T('Saved. A bike-care job is waiting, and next time the spare part is suggested.'));
  await expect(card.locator('[data-learn-break]')).toContainText('test_data_gtp_ Schlauch hinten');
  await expect.poll(async () => (await read(page, 'maintenance')).filter((m) => m.source === 'Breakdown' && m.tripId === PAST).length).toBe(1);
  await expect.poll(async () => (await read(page, 'trips', PAST)).breakdowns?.length).toBe(1);

  // the sleep spot at the end of day 1 (the trip's route)
  await tap(card.locator('[data-sleep-add]'), info);
  await card.getByLabel(T('Name')).fill('test_data_gtp_ Biwak am Bach');
  await tap(card.locator('[data-star="4"]'), info);
  await tap(card.locator('[data-sleep-save]'), info);
  await expect(card.locator('[data-learn-sleep]')).toContainText('test_data_gtp_ Biwak am Bach');
  await expect(card.locator('[data-learn-sleep]')).toContainText('★★★★☆');
  const own = await read(page, 'settings', 'own-points');
  expect(own.value.points.find((p) => p.name === 'test_data_gtp_ Biwak am Bach')).toMatchObject({ kind: 'sleep', stars: 4, tripId: PAST, night: day(-9) });

  // the postcard: a picture made on the device
  await tap(card.locator('[data-postcard-open]'), info);
  const pc = page.locator('dialog[data-postcard]');
  await expect(pc).toHaveJSProperty('open', true);
  await expect(pc.locator('[data-postcard-img]')).toBeVisible();
  await expect(pc.locator('[data-postcard-save]')).toHaveAttribute('download', /\.jpg$/);
  await expect.poll(() => pc.locator('[data-postcard-img]').evaluate((im) => im.naturalWidth)).toBe(1080);
  await pc.getByRole('button', { name: T('Close') }).click();
  await expect(pc).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Planen: the spare part comes back, the sleep spot nearby, two people, the wash and the packing time', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.addInitScript((id) => localStorage.setItem('pack.currentTrip', id), NEXT);
  await openHome(page, context, info, { data: data({ withBreakdown: true, withSpot: true }) });
  await page.goto('./#/pack');

  // what earlier tours taught
  const hints = page.locator('[data-plan-learn]');
  await expect(hints.locator('[data-spare-hint="flat"]')).toContainText(T('Last time: {what}', { what: T('Flat tyre') }));
  await expect(hints.locator('[data-sleep-near]')).toContainText('test_data_gtp_ Zeltplatz am See');
  await tap(hints.locator('[data-spare-add="test_data_gtp_tube"]'), info);
  await expect.poll(async () => (await read(page, 'trips', NEXT)).entries.some((e) => e.itemId === 'test_data_gtp_tube')).toBe(true);
  await expect(hints.locator('[data-spare-add="test_data_gtp_tube"]')).toHaveCount(0);
  expect(await noSideways(page)).toBe(0);

  const card = page.locator('[data-pack-extras]');
  await expect(card).toContainText(T('Pack faster'));

  // two people
  const two = card.locator('[data-two]');
  await tap(two.locator('summary'), info);
  await two.locator('[data-two-name]').fill('test_data_gtp_Lea');
  await tap(two.getByRole('button', { name: T('Save') }), info);
  await expect(two.locator('summary')).toContainText('test_data_gtp_Lea');
  const first = entries(6)[0].itemId;
  await tap(two.locator(`[data-two-item="${first}"]`), info);
  await expect(two.locator(`[data-two-item="${first}"]`)).toHaveAttribute('aria-pressed', 'true');
  await expect(two.locator('[data-two-sum]')).toContainText('test_data_gtp_Lea');

  // the wash: the bib shorts of the fixture (clothing on the bike) are still in the wash
  const wash = card.locator('[data-wash]');
  await tap(wash.locator('summary'), info);
  await tap(wash.locator('[data-wash-item="ON01"]'), info);
  await expect(card.locator('[data-still-wash]')).toBeVisible();
  await expect.poll(async () => ((await read(page, 'settings', 'merken'))?.value ?? []).some((x) => x.src === `laundry:${NEXT}`)).toBe(true);

  // the packing time: start, stop, then hide and show again
  const pt = card.locator('[data-packtime]');
  await tap(pt.locator('summary'), info);
  await tap(pt.locator('[data-pack-start]'), info);
  await expect(pt.locator('[data-pack-stop]')).toBeVisible();
  await tap(pt.locator('[data-pack-stop]'), info);
  await expect.poll(async () => (await read(page, 'trips', NEXT)).packTime?.start).toBe(null);
  await tap(pt.getByRole('button', { name: T('Hide the packing time') }), info);
  await expect(card.locator('[data-packtime]')).toHaveCount(0);
  await tap(card.getByRole('button', { name: T('Show again') }), info);
  await expect(card.locator('[data-packtime]')).toBeVisible();
  expect(await noSideways(page)).toBe(0);
  expect(errors).toEqual([]);
});

test('Unterwegs: the morning list on the start day packs with a tick', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const d = data();
  const phoneItem = d.tables.items[4].id;
  d.tables.items = d.tables.items.map((i) => (i.id === phoneItem ? { ...i, morning: true } : i));
  d.tables.trips = [trip('Start-heute', day(0), { days: 1, route: route(60), entries: entries(4, 0) }), ...d.tables.trips.filter((x) => !/Herbstrunde|TEST-Runde/.test(x.title))];
  await context.addInitScript((id) => localStorage.setItem('pack.currentTrip', id), TODAY);
  await openHome(page, context, info, { data: d });
  await page.goto('./#/ride');
  const ml = page.locator('[data-morning-list]');
  await expect(ml).toContainText(T('This morning, still pack'));
  await expect(ml).toContainText(T('{n} left', { n: 1 }));
  await tap(ml.getByRole('checkbox').first(), info);
  await expect(ml).toContainText(T('All in. Have a good ride!'));
  await expect.poll(async () => (await read(page, 'trips', TODAY)).entries.find((e) => e.itemId === phoneItem)?.packed).toBe(true);
  expect(await noSideways(page)).toBe(0);
  expect(errors).toEqual([]);
});
