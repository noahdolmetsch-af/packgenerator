// «Abendblick» (Noah 23.11.2026 «G2»): on the evening of a tour of two days, On the way has a fold «Abendblick»:
// a tap on a thing says not used, another broken, another used again; what was missing is added below. The marks are
// the ones of the debrief (debrief.items, debrief.missing). On the last day there is no evening, so no Abendblick.
// German UI, fictional data (tests/e2e/fixture.json), nothing leaves the preview server.
import { test, expect } from './clock.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const day = (n) => {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Zurich' }));
  d.setDate(d.getDate() + n);
  return iso(d);
};
const MARK = { key: 'test_data_gtp_marker', value: 1 };
const TRIP = 'test_data_gtp_trip-abend';
const entry = (itemId, slot = 'seat') => ({ itemId, slot, qty: 1, packed: false });

function fixture(path) {
  const data = structuredClone(base);
  data.tables.trips.push({
    id: TRIP, domain: 'bikepacking', title: 'test_data_gtp_ Two days', days: 2, startDate: day(0), bikeId: 'bike-test', bike: 'Test gravel bike',
    setup: { seat: 'bag-TA01', frame: 'bag-TA02', top: 'bag-TA03' },
    entries: [entry('EL01', 'mounted'), entry('EL02', 'frame'), entry('EL03', 'frame'), entry('LI01', 'mounted'), entry('TO01', 'top'), entry('TO02', 'top')],
    ready: [], status: 'planned', hours: 4, overnight: 'lodging', wx: { min: 6, max: 10, rain: 'none' },
  });
  data.tables.settings.push(MARK);
  writeFileSync(path, JSON.stringify(data));
}
const table = (page, name) =>
  page.evaluate((s) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(s).objectStore(s).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);
const debrief = async (page) => (await table(page, 'debriefs')).find((d) => d.tripId === TRIP);
const sideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

async function start(page, context, info) {
  const file = info.outputPath('abendblick.json');
  fixture(file);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript((id) => {
    localStorage.setItem('lang', 'de');
    localStorage.setItem('pack.currentTrip', id);
  }, TRIP);
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await expect.poll(async () => (await table(page, 'settings')).some((s) => s.key === MARK.key)).toBe(true);
}

test('Evening look: tap marks a thing not used, then broken, then used; what was missing is added and taken out', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context, info);
  await page.goto('./#/ride');
  const fold = page.locator('[data-fold="abend"]');
  await expect(fold.locator('summary')).toContainText(T('Evening look'));
  await fold.locator('summary').click();
  const box = fold.locator('[data-abend]');
  await expect(box).toBeVisible();
  await expect(box.locator('[data-abend-row]')).toHaveCount(6);
  expect(await sideways(page)).toBe(0);

  const row = box.locator('[data-abend-row="TO01"]');
  await row.locator('button').click();
  await expect(row).toHaveAttribute('data-mark', 'unused');
  await expect(box.locator('[data-abend-sum]')).toContainText(T('Not used so far: {n} thing', { n: 1 }));
  await expect.poll(async () => (await debrief(page))?.items?.TO01).toBe('unused');
  // the marked one stands first in the list
  await expect(box.locator('[data-abend-row]').first()).toHaveAttribute('data-abend-row', 'TO01');
  await row.locator('button').click();
  await expect.poll(async () => (await debrief(page))?.items?.TO01).toBe('broken');
  await row.locator('button').click();
  await expect(row).toHaveAttribute('data-mark', 'used');
  await expect.poll(async () => (await debrief(page))?.items?.TO01).toBeUndefined();
  await expect(box.locator('[data-abend-sum]')).toHaveCount(0);

  // what was missing: add, then take out again
  await box.locator('[data-abend-input]').fill('test_data_gtp_ Handschuhe');
  await box.locator('[data-abend-add]').click();
  await expect(box.locator('[data-abend-missing]')).toContainText('test_data_gtp_ Handschuhe');
  await expect.poll(async () => (await debrief(page))?.missing?.map((m) => m.name)).toEqual(['test_data_gtp_ Handschuhe']);
  await box.locator('[data-abend-missing] .dx').click();
  await expect.poll(async () => (await debrief(page))?.missing).toEqual([]);

  // the last day has no evening, so no Abendblick
  await page.getByRole('button', { name: new RegExp(`^${T('Day {n}', { n: 2 })}`) }).click();
  await expect(page.locator('[data-fold="abend"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
