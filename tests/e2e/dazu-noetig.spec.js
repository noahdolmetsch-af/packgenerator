// «Dazu nötig» (Noah 23.11.2026 «G1»): in the window of an item the row «Dazu nötig» names its companions; on a
// planned trip the card «Bereit zur Abfahrt?» says when one is missing, a tap opens a window with «Hinzufügen» and
// «Diesmal nicht». German UI, fictional data (tests/e2e/fixture.json), nothing leaves the preview server.
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
const TRIP = 'trip-test_data_gtp_dazu';

const zurich = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const plusDays = (day, n) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

// the bike computer (EL01) on the list, its cable (EL03) not; linked or not
function fixture(path, { linked = true } = {}) {
  const data = structuredClone(base);
  const bike = data.tables.bikes[0];
  const day = plusDays(zurich(), 5);
  const ids = ['EL01', 'EL02', 'LI01', 'LI02', 'RA01', 'RA02', 'TO01', 'TO02', 'TO03', 'HY02'];
  if (linked) data.tables.items = data.tables.items.map((i) => (i.id === 'EL01' ? { ...i, withIds: ['EL03'] } : i));
  data.tables.trips.push({
    id: TRIP, domain: 'bikepacking', title: 'test_data_gtp_ Jura Runde', startDate: day, days: 1, bikeId: bike.id, bike: bike.name, setup: { ...bike.setup },
    entries: ids.map((itemId, i) => ({ itemId, slot: ['top', 'frame', 'seat'][i % 3], qty: 1, packed: i < 6 })),
    ready: [{ id: 'wallet', label: 'Phone, wallet, keys', done: false }], charge: { EL01: true }, ride: null, hours: null, sets: {}, purpose: {}, status: 'planned', copiedFrom: null, createdAt: '2026-10-01T08:00:00.000Z',
    wx: { min: 15, max: 15, rain: 'none' },
  });
  const today = zurich();
  data.tables.settings.push({ key: 'homeWindows', value: { eve: { done: today }, week: { done: today } } });
  writeFileSync(path, JSON.stringify(data));
}

async function start(page, context, info, opts, hash = './#/pack') {
  const file = info.outputPath('gehoert-dazu.json');
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

test('Needed-with: the card names the missing cable and Add puts it on the list', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context, info, { linked: true });
  const card = page.locator('[data-ampel]');
  await card.locator('summary').click();
  const row = card.locator('[data-ampel-row="dazu"]');
  await expect(row).toContainText(T('Needed with it: {name} is missing', { name: 'USB-C cable' }));
  await row.locator('button').click();
  const sheet = page.locator('[data-dazu-sheet]');
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('[data-dazu-row="EL03"]')).toContainText(T('For {names}', { names: 'Bike computer' }));
  expect(await noSideways(page)).toBe(0);
  await sheet.locator('[data-dazu-row="EL03"] [data-dazu-add]').click();
  // the last row is gone: the window closes by itself, the line is gone, the cable is on the trip
  await expect(sheet).toBeHidden();
  await expect.poll(async () => (await rec(page, 'trips', TRIP)).entries.some((e) => e.itemId === 'EL03')).toBe(true);
  await expect(card.locator('[data-ampel-row="dazu"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Needed-with: Not this time leaves it out for this trip only', async ({ page, context }, info) => {
  await start(page, context, info, { linked: true });
  const card = page.locator('[data-ampel]');
  await card.locator('summary').click();
  await card.locator('[data-ampel-row="dazu"] button').click();
  await page.locator('[data-dazu-row="EL03"] [data-dazu-skip]').click();
  await expect(page.locator('[data-dazu-sheet]')).toBeHidden();
  await expect(card.locator('[data-ampel-row="dazu"]')).toHaveCount(0);
  expect((await rec(page, 'trips', TRIP)).dazuSkip).toEqual(['EL03']);
  expect((await rec(page, 'items', 'EL01')).withIds).toEqual(['EL03']); // the link itself stays
});

test('Needed-with: no link means no line, and the row in the item window saves the link', async ({ page, context }, info) => {
  await start(page, context, info, { linked: false });
  const card = page.locator('[data-ampel]');
  await card.locator('summary').click();
  await expect(card.locator('[data-ampel-row="dazu"]')).toHaveCount(0);
  await page.goto('./#/gear?item=EL01');
  const dlg = page.locator('dialog.sheet[aria-labelledby="item-h"]');
  await expect(dlg).toBeVisible();
  await dlg.locator('[data-fold="with"] summary').click();
  const field = dlg.locator('[data-dazu-field]');
  await field.getByRole('combobox').selectOption('EL03');
  await expect(field.locator('.dz-list')).toContainText('USB-C cable');
  // the x of a chip is visible and takes it out again; then it is chosen once more
  await expect(field.locator('.dzx')).toBeVisible();
  await field.locator('.dzx').click();
  await expect(field.locator('.dz-list')).toHaveCount(0);
  await field.getByRole('combobox').selectOption('EL03');
  await expect(field.locator('.dz-list')).toContainText('USB-C cable');
  await dlg.getByRole('button', { name: T('Save'), exact: true }).click();
  await expect.poll(async () => (await rec(page, 'items', 'EL01')).withIds).toEqual(['EL03']);
});
