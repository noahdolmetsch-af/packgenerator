// «Rückmeldungen» (Noah 19.10.2026 «1a 2a 3a 4b»), German UI: the whole way of one gear item, from
// making it to deleting it, and what the app says at every step:
// - a wrong weight says what is wrong; a double tap on «Speichern» makes ONE item; «gespeichert, unter …»;
// - ✕ after a change: «Änderungen an … gespeichert.»; «Verwerfen»: «… verworfen.» with «Rückgängig»;
// - «Löschen» asks in the app's own window (never the browser's), «Archivieren» first for a used item;
//   Escape keeps everything; «Löschen» takes it off the trip too; «Rückgängig» brings item and trip line back.
// Fictional fixture plus test_data_gtp_ items; nothing leaves the preview server.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const USED = 'test_data_gtp_ Testzelt';
const FREE = 'test_data_gtp_ Testlampe';
const NEW = 'test_data_gtp_ Neues Teil';
const TRIP = 'trip-test_data_gtp_r';

function fixture(path) {
  const data = structuredClone(base);
  const add = (id, name) => data.tables.items.push({ id, name, category: 'elec', weightG: 300, qty: 1, weightStatus: 'measured', defaultBag: 'top', ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'] });
  add('EL91', USED);
  add('EL92', FREE);
  const bike = data.tables.bikes[0];
  data.tables.trips.push({
    id: TRIP, domain: 'bikepacking', title: 'test_data_gtp_ Tour', startDate: '2026-11-01', days: 1, bikeId: bike.id, bike: bike.name, setup: { ...bike.setup },
    entries: [{ itemId: 'EL91', slot: 'top', qty: 1, packed: false }], ready: [], ride: null, hours: null, sets: {}, purpose: {}, status: 'planned', copiedFrom: null, createdAt: '2026-10-01T08:00:00.000Z',
  });
  writeFileSync(path, JSON.stringify(data));
}

const table = (page, name) =>
  page.evaluate((n) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(n).objectStore(n).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);

test('one gear item from start to end: every step says what happened', async ({ page, context }, info) => {
  const browserAsks = [];
  page.on('dialog', (d) => (browserAsks.push(d.message()), d.accept()));
  const file = info.outputPath('rueckmeldungen.json');
  fixture(file);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await page.goto('./#/gear');
  const toast = page.locator('.rtoast');

  // 1. Make a new item: a wrong weight says so, a double tap saves once
  await page.getByRole('button', { name: T('Add item') }).first().click();
  const dlg = page.getByRole('dialog', { name: T('Add item') });
  await dlg.getByRole('textbox', { name: new RegExp(`^${T('Name')}`) }).fill(NEW);
  await dlg.getByRole('combobox', { name: new RegExp(`^${T('Category')}`) }).selectOption('elec');
  await dlg.locator('#it-grams').fill('abc');
  await dlg.getByRole('button', { name: T('Save'), exact: true }).click();
  await expect(dlg.getByRole('alert')).toHaveText(T('Weight: whole grams from 1 to 30,000, or leave it empty.'));
  await dlg.locator('#it-grams').fill('450');
  await dlg.getByRole('button', { name: T('Save'), exact: true }).dblclick();
  await expect(toast).toContainText(T('"{name}" saved, under {cat}.', { name: NEW, cat: T('Electronics') }));
  await expect(dlg).toBeHidden();
  await expect.poll(async () => (await table(page, 'items')).filter((i) => i.name === NEW).length).toBe(1);

  // 2. Change it and close with ✕: saved, and the app says so
  const open = async (name) => {
    await page.getByLabel(T('Search gear')).fill(name);
    await page.getByRole('button', { name: new RegExp(name) }).first().click();
    const d = page.getByRole('dialog', { name });
    await expect(d).toBeVisible();
    return d;
  };
  let d = await open(FREE);
  await d.locator('details[data-fold="details"]').evaluate((el) => (el.open = true)); // the row opened last stays open
  await d.getByRole('textbox', { name: T('Brand') }).fill('Testmarke');
  await d.getByRole('button', { name: T('Close') }).first().click();
  await expect(toast).toContainText(T('Changes to "{name}" saved.', { name: FREE }));
  await expect.poll(async () => (await table(page, 'items')).find((i) => i.id === 'EL92').brand).toBe('Testmarke');

  // 3. «Verwerfen» after a change: gone at once, «Rückgängig» puts the change on again
  d = await open(FREE);
  await d.locator('details[data-fold="details"]').evaluate((el) => (el.open = true)); // the row opened last stays open
  await d.getByRole('textbox', { name: T('Brand') }).fill('Andere Marke');
  await d.getByRole('button', { name: T('Discard'), exact: true }).click();
  await expect(toast).toContainText(T('Changes to "{name}" discarded.', { name: FREE }));
  expect((await table(page, 'items')).find((i) => i.id === 'EL92').brand).toBe('Testmarke');
  await toast.getByRole('button', { name: T('Undo') }).click();
  await expect.poll(async () => (await table(page, 'items')).find((i) => i.id === 'EL92').brand).toBe('Andere Marke');

  // 4. Delete a used item: the app's own question, «Archivieren» first; Escape keeps everything
  d = await open(USED);
  await d.locator('details[data-fold="more"]').evaluate((el) => (el.open = true));
  await d.getByRole('button', { name: T('Delete'), exact: true }).click();
  const ask = page.getByTestId('ask-delete');
  await expect(ask).toBeVisible();
  await expect(ask.getByRole('heading')).toHaveText(T('Delete "{name}"?', { name: USED }));
  await expect(ask).toContainText(T('on {n} trip', { n: 1 }));
  await expect(ask.getByRole('button', { name: T('Archive') })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(ask).toBeHidden();
  await expect(d).toBeVisible();
  expect((await table(page, 'items')).some((i) => i.id === 'EL91')).toBe(true);

  // 5. «Löschen»: off the trip too; «Rückgängig» brings item and trip line back
  await d.getByRole('button', { name: T('Delete'), exact: true }).click();
  await ask.getByRole('button', { name: T('Delete'), exact: true }).click();
  await expect(toast).toContainText(T('"{name}" deleted.', { name: USED }));
  await expect(d).toBeHidden();
  await expect.poll(async () => (await table(page, 'items')).some((i) => i.id === 'EL91')).toBe(false);
  expect((await table(page, 'trips')).find((x) => x.id === TRIP).entries.map((e) => e.itemId)).not.toContain('EL91');
  await toast.getByRole('button', { name: T('Undo') }).click();
  await expect(toast).toContainText(T('"{name}" is back.', { name: USED }));
  await expect.poll(async () => (await table(page, 'items')).some((i) => i.id === 'EL91')).toBe(true);
  expect((await table(page, 'trips')).find((x) => x.id === TRIP).entries.map((e) => e.itemId)).toContain('EL91');

  expect(browserAsks, 'no grey browser question anywhere').toEqual([]);
});

test('the delete question fits a 320 px phone and comes from below', async ({ page, context }, info) => {
  await page.setViewportSize({ width: 320, height: 640 });
  const file = info.outputPath('rueckmeldungen-phone.json');
  fixture(file);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  // the row menu «Löschen» asks first now (rule «Löschen» 14.10.2026), in the same window as everywhere
  await page.goto('./#/gear');
  await page.getByLabel(T('Search gear')).fill(FREE);
  await page.locator('li', { hasText: FREE }).getByRole('button', { name: T('Actions') }).click();
  await page.locator('dialog.rowmenu').getByRole('button', { name: new RegExp(`^${T('Delete')}`) }).click();
  const ask = page.getByTestId('ask-delete');
  await expect(ask).toBeVisible();
  const box = await ask.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(320);
  expect(Math.round(box.y + box.height)).toBeGreaterThanOrEqual(600); // sits at the bottom
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await ask.getByRole('button', { name: T('Cancel') }).click();
  await expect(ask).toBeHidden();
  expect((await table(page, 'items')).some((i) => i.id === 'EL92')).toBe(true);
});
