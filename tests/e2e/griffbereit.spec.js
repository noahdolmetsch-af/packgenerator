// «Griffbereit» (Noah 23.11.2026 «G3»): food, rain gear and marked things should lie in a bag a hand reaches while
// riding. The card «Bereit zur Abfahrt?» says when one lies deep, a tap opens a window with «In … legen» and
// «Diesmal nicht»; in the window of an item the row «Griffbereit» chooses. German UI, fictional data
// (tests/e2e/fixture.json), nothing leaves the preview server.
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
const TRIP = 'trip-test_data_gtp_griff';

const zurich = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const plusDays = (day, n) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

// the rain jacket (RA01) lies in the seat pack, the top tube bag of the bike is on the trip
function fixture(path, { reach } = {}) {
  const data = structuredClone(base);
  const bike = data.tables.bikes[0];
  const day = plusDays(zurich(), 5);
  if (reach !== undefined) data.tables.items = data.tables.items.map((i) => (i.id === 'RA01' ? { ...i, reach } : i));
  data.tables.trips.push({
    id: TRIP, domain: 'bikepacking', title: 'test_data_gtp_ Jura Runde', startDate: day, days: 1, bikeId: bike.id, bike: bike.name, setup: { ...bike.setup },
    entries: [['RA01', 'seat'], ['EL01', 'mounted'], ['TO01', 'frame']].map(([itemId, slot]) => ({ itemId, slot, qty: 1, packed: false })),
    ready: [{ id: 'wallet', label: 'Phone, wallet, keys', done: false }], ride: null, hours: null, sets: {}, purpose: {}, status: 'planned', copiedFrom: null, createdAt: '2026-10-01T08:00:00.000Z',
    wx: { min: 15, max: 15, rain: 'none' },
  });
  const today = zurich();
  data.tables.settings.push({ key: 'homeWindows', value: { eve: { done: today }, week: { done: today } } });
  writeFileSync(path, JSON.stringify(data));
}

async function start(page, context, info, opts, hash = './#/pack') {
  const file = info.outputPath('griffbereit.json');
  fixture(file, opts);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await panel.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await page.evaluate((id) => localStorage.setItem('pack.currentTrip', id), TRIP);
  await page.goto(hash);
  await page.reload();
  await expect(page.locator('main')).toBeVisible();
}
const rec = (page, store, id) =>
  page.evaluate(
    ([s, k]) =>
      new Promise((res) => {
        const q = indexedDB.open('pack-generator');
        q.onsuccess = () => {
          const r = q.result.transaction(s).objectStore(s).get(k);
          r.onsuccess = () => res(r.result);
        };
      }),
    [store, id],
  );
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test('Within reach: the card names the rain jacket and Move puts it into the top tube bag', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context, info, {});
  const card = page.locator('[data-ampel]');
  await card.locator('summary').click();
  const row = card.locator('[data-ampel-row="griff"]');
  await expect(row).toContainText(T('Within reach: {name} lies deep in a bag', { name: 'Rain jacket' }));
  await row.locator('button').click();
  const sheet = page.locator('[data-griff-sheet]');
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('[data-griff-row="RA01"]')).toContainText(T('Rain gear is needed fast'));
  expect(await noSideways(page)).toBe(0);
  await sheet.locator('[data-griff-row="RA01"] [data-griff-move]').click();
  // the last row is gone: the window closes by itself, the line is gone, the jacket lies in the top tube bag, open to pack again
  await expect(sheet).toBeHidden();
  await expect.poll(async () => (await rec(page, 'trips', TRIP)).entries.find((e) => e.itemId === 'RA01')?.slot).toBe('top');
  await expect(card.locator('[data-ampel-row="griff"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Within reach: Not this time leaves it where it is for this trip only', async ({ page, context }, info) => {
  await start(page, context, info, {});
  const card = page.locator('[data-ampel]');
  await card.locator('summary').click();
  await card.locator('[data-ampel-row="griff"] button').click();
  await page.locator('[data-griff-row="RA01"] [data-griff-skip]').click();
  await expect(page.locator('[data-griff-sheet]')).toBeHidden();
  await expect(card.locator('[data-ampel-row="griff"]')).toHaveCount(0);
  const trip = await rec(page, 'trips', TRIP);
  expect(trip.griffSkip).toEqual(['RA01']);
  expect(trip.entries.find((e) => e.itemId === 'RA01').slot).toBe('seat');
  expect((await rec(page, 'items', 'RA01')).reach).toBeUndefined(); // the item itself stays
});

test('Within reach: a thing you said no to has no line, and the row in the item window saves the choice', async ({ page, context }, info) => {
  await start(page, context, info, { reach: false });
  const card = page.locator('[data-ampel]');
  await card.locator('summary').click();
  await expect(card.locator('[data-ampel-row="griff"]')).toHaveCount(0);
  await page.goto('./#/gear?item=RA01');
  const dlg = page.locator('dialog.sheet[aria-labelledby="item-h"]');
  await expect(dlg).toBeVisible();
  await dlg.locator('[data-fold="where"] summary').click();
  const field = dlg.locator('[data-reach-field] select');
  await expect(field).toHaveValue('no');
  await field.selectOption('yes');
  await dlg.getByRole('button', { name: T('Save'), exact: true }).click();
  await expect.poll(async () => (await rec(page, 'items', 'RA01')).reach).toBe(true);
});
