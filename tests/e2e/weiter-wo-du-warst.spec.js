// «Weiter, wo du warst» (Noah 23.11.2026 «1-5a»): the line on Today takes you back to a running ride and to a trip
// without a date; «Not today any more» puts it away for the day. Fictional data only (test_data_gtp_ records).
import { test, expect } from '@playwright/test';
import { base, tr, mockWeather } from './home0460-fixture.js';
import { importAndSettle, settle } from './settle.js';

const T = tr('de');
const D0 = '2026-10-14'; // a Wednesday, 09:00 Europe/Zurich
const ID = (s) => `test_data_gtp_${s}`;
const entries = (n) => base.tables.items.slice(3, 3 + n).map((i) => ({ itemId: i.id, slot: 'seat', qty: 1, packed: false }));
const trip = (id, extra = {}) => ({
  id: ID(id), title: `test_data_gtp_ ${id}`, domain: 'bikepacking', days: 2, bikeId: 'bike-test', bike: 'test_data_gtp_ Scale',
  setup: { seat: 'bag-TA01', frame: 'bag-TA02', top: 'bag-TA03' }, entries: entries(4), ready: [], status: 'planned', createdAt: `${D0}T05:00:00.000Z`, updatedAt: `${D0}T06:00:00.000Z`, ...extra,
});

async function open(page, context, trips) {
  await context.route(/^https?:\/\/(?!localhost[:/])(?!.*open-meteo)/, (route) => route.abort());
  await mockWeather(context);
  await page.clock.setFixedTime(new Date(`${D0}T09:00:00+02:00`));
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/gear');
  const d = structuredClone(base);
  d.tables.trips = trips;
  d.tables.debriefs = [];
  d.tables.notes = [];
  d.tables.settings = [{ key: 'homePlace', value: { name: 'test_data_gtp_ Heimort', lat: 47.39, lon: 8.04 } }];
  await page.goto('./#/');
  await importAndSettle(page, { name: 'weiter.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(d)) });
  await page.goto('./#/');
  await settle(page);
}

const putTrack = (page, row) =>
  page.evaluate((r) => new Promise((done, fail) => {
    const req = indexedDB.open('pack-generator');
    req.onerror = fail;
    req.onsuccess = () => {
      const tx = req.result.transaction('tracks', 'readwrite');
      tx.objectStore('tracks').put(r);
      tx.oncomplete = () => (req.result.close(), done());
      tx.onerror = () => fail(tx.error);
    };
  }), row);

test('Weiter wo du warst: a trip without a date stands in the line, Not today any more puts it away for the day', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context, [trip('wochenende')]);
  const line = page.locator('[data-section="continue"] [data-row="begun"]');
  await expect(line).toBeVisible();
  await expect(line).toContainText('test_data_gtp_ wochenende');
  await expect(line).toContainText(T('Where you left off'));
  const away = page.locator('[data-weiter-away]');
  await expect(away).toHaveText(T('Not today any more'));
  await away.click();
  await expect(line).toHaveCount(0);
  await page.reload();
  await settle(page);
  await expect(page.locator('[data-row="begun"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Weiter wo du warst: an old trip without a date is left out of the line', async ({ page, context }) => {
  await open(page, context, [trip('alt', { updatedAt: '2026-10-05T06:00:00.000Z', createdAt: '2026-10-05T05:00:00.000Z' })]);
  await expect(page.locator('[data-row="begun"]')).toHaveCount(0);
});

test('Weiter wo du warst: a running ride stands first and opens the live view', async ({ page, context }) => {
  await open(page, context, [trip('wochenende')]);
  await putTrack(page, { id: 'rec-test-1', kind: 'rec', open: true, startAt: Date.parse(`${D0}T07:05:00+02:00`), pts: [] });
  await page.reload();
  await settle(page);
  const ride = page.locator('[data-section="continue"] [data-row="ride"]');
  await expect(ride).toBeVisible();
  await expect(ride).toContainText('07:05');
  await expect(page.locator('[data-row="begun"]')).toHaveCount(0);
  await expect(ride).toHaveAttribute('href', '#/live');
});
