// v0.37.1 "Zusammenlegen" (merge items), German UI, phone and desktop:
// "Import prüfen" → "Nicht im Import" → "Zusammenlegen" on a double: the sheet proposes the imported
// item (badge "Vorschlag"), one orange button merges, the toast "Zusammengelegt · Rückgängig" undoes it.
// Then a collection item merged into its three pieces. The template and the planned trip take the new
// items, the past trip keeps the old one. On a computer the item window offers "Zusammenlegen mit …".
// Fictional data only (fixture.json + test_data_gtp_ items); nothing leaves the preview server.
// V0371_SHOTS=<folder> saves screenshots there.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const MARK = { key: 'test_data_gtp_marker', value: 1 };
const N = (s) => `test_data_gtp_${s}`;
const item = (id, name, category, extra = {}) => ({ id, name, category, weightG: null, qty: 1, weightStatus: 'missing', carry: 'luggage', defaultBag: 'top', ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'], ...extra });
const day = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

const ITEMS = [
  item('EL40', N('Garmin Halterung'), 'elec', { sourceId: 'T0104', weightG: 25 }),
  item('TO10', N('Minipumpe'), 'tools', { sourceId: 'T0101', weightG: 90 }),
  item('TO11', N('CO2 Kartusche'), 'tools', { sourceId: 'T0102' }),
  item('TO12', N('Pumpenkopf'), 'tools', { sourceId: 'T0103' }),
  item('ON05', N('Garmin-Halterung (rüttelfest)'), 'onbike', { weightG: 40, note: N('alte Notiz') }),
  item('TO05', N('Minipumpe / CO2 + Pumpenkopf'), 'tools', { weightG: 160 }),
];
const trip = (id, startDate, entries) => ({ id, domain: 'bikepacking', title: N(id), startDate, days: 1, bikeId: 'bike-test', bike: 'Test gravel bike', setup: { seat: 'bag-TA01', frame: 'bag-TA02', top: 'bag-TA03' }, entries, ready: [], status: 'planned', createdAt: '2026-09-01T10:00:00.000Z' });
const GEAR = {
  kind: 'gear-import',
  version: 1,
  items: ITEMS.filter((i) => i.sourceId).map((i) => ({ sourceId: i.sourceId, mergedIds: [], name: i.name, category: i.category, qty: 1, areas: ['Velo'], owned: true })),
};

const table = (page, name) =>
  page.evaluate((s) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(s).objectStore(s).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);
const one = async (page, name, id) => (await table(page, name)).find((x) => (x.id ?? x.key) === id);

async function openData(page) {
  const data = page.locator('details.data');
  await expect(async () => {
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
    expect(await data.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  return data;
}

async function start(page, context, info) {
  const data = structuredClone(base);
  data.tables.items.push(...ITEMS);
  data.tables.trips.push(
    trip('past', day(-20), [{ itemId: 'ON05', slot: 'mounted', qty: 1, packed: true }, { itemId: 'TO05', slot: 'top', qty: 1, packed: true }]),
    trip('next', day(20), [{ itemId: 'ON05', slot: 'mounted', qty: 1, packed: false }, { itemId: 'TO05', slot: 'top', qty: 1, packed: false }]),
  );
  data.tables.settings.push(MARK, { key: 'templates', value: [{ id: 'tpl-gtp', name: N('Pendeln'), setup: {}, entries: [{ itemId: 'ON05', slot: 'mounted', qty: 1 }, { itemId: 'TO05', slot: 'top', qty: 2 }], ready: [], days: 1 }] });
  const file = info.outputPath('base.json');
  writeFileSync(file, JSON.stringify(data));
  const gear = info.outputPath('gear.json');
  writeFileSync(gear, JSON.stringify(GEAR));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await panel.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await expect.poll(async () => (await table(page, 'settings')).some((s) => s.key === MARK.key)).toBe(true);
  await expect(panel.getByRole('dialog')).toHaveCount(0);
  // The gear list names only the four imported items: the rest is "Nicht im Import".
  await panel.locator('input[type=file]').setInputFiles(gear);
  await panel.getByRole('dialog', { name: T('Check import') }).getByRole('link', { name: T('Check import') }).click();
  await expect(page).toHaveURL(/#\/gear\/import$/);
}

const section = (page, name) => page.locator('details.sec').filter({ has: page.locator('summary .h', { hasText: new RegExp(`^${name}$`) }) });
async function unfold(sec) {
  if (!(await sec.evaluate((d) => d.open))) await sec.locator('> summary').click();
  await expect.poll(() => sec.evaluate((d) => d.open)).toBe(true);
}
const fits = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

test('Zusammenlegen: propose, confirm, undo; a collection into its pieces; past trips untouched', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context, info);
  const shots = process.env.V0371_SHOTS;
  const ni = section(page, T('Not in the import'));
  await unfold(ni);
  const count = Number(await ni.locator('summary .n').textContent());
  expect(count).toBe(base.tables.items.length + 2);

  // 1. A double: the sheet proposes the imported item, chosen already.
  const old = N('Garmin-Halterung (rüttelfest)');
  const mergeBtn = ni.getByRole('button', { name: T('Merge {name}', { name: old }) });
  await expect(mergeBtn).toBeVisible();
  await mergeBtn.click();
  const sheet = page.getByRole('dialog', { name: old });
  await expect(sheet).toBeVisible();
  const proposal = sheet.getByRole('button', { name: new RegExp(N('Garmin Halterung')) });
  await expect(proposal).toHaveAttribute('aria-pressed', 'true');
  await expect(proposal.locator('.badge')).toHaveText(T('Suggestion'));
  await expect(sheet).toContainText(T('Replaces the item in templates, building blocks and bags. Past trips stay. Afterwards under Gone.'));
  const main = sheet.getByRole('button', { name: T('Merge|items'), exact: true });
  await expect(main).toHaveClass(/\bhi\b/);
  expect(await fits(page)).toBe(true);
  if (shots) {
    mkdirSync(shots, { recursive: true });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${shots}/merge-sheet-${info.project.name}.png` });
  }
  await main.click();
  await expect(sheet).toBeHidden();
  const toast = page.locator('.toast');
  await expect(toast).toContainText(T('Merged'));
  if (shots) await page.screenshot({ path: `${shots}/merge-toast-${info.project.name}.png` });
  await expect(ni.locator('summary .n')).toHaveText(String(count - 1));
  await expect(ni.getByRole('button', { name: T('Merge {name}', { name: old }) })).toHaveCount(0);

  expect(await one(page, 'items', 'ON05')).toMatchObject({ ownership: 'gone', archivedBy: 'merge', mergedInto: ['EL40'], archivedFrom: 'owned' });
  expect(await one(page, 'items', 'EL40')).toMatchObject({ weightG: 25, note: N('alte Notiz'), sourceId: 'T0104' });
  expect((await one(page, 'settings', 'templates')).value[0].entries[0]).toEqual({ itemId: 'EL40', slot: 'mounted', qty: 1 });
  // Only the test items (the app's own updates may add their items to a trip on load).
  const ids = async (id) => (await one(page, 'trips', id)).entries.map((e) => e.itemId).filter((x) => ITEMS.some((i) => i.id === x)).sort();
  expect(await ids('next')).toEqual(['EL40', 'TO05']);
  expect(await ids('past')).toEqual(['ON05', 'TO05']);

  // 2. "Rückgängig" in the toast: exactly as before.
  await toast.getByRole('button', { name: T('Undo') }).click();
  await expect.poll(async () => (await one(page, 'items', 'ON05')).ownership).toBe('owned');
  expect((await one(page, 'settings', 'templates')).value[0].entries[0].itemId).toBe('ON05');
  expect(await ids('next')).toEqual(['ON05', 'TO05']);
  await expect(ni.locator('summary .n')).toHaveText(String(count));

  // 3. A collection: the three pieces are proposed; the first is chosen, two more taps.
  const coll = N('Minipumpe / CO2 + Pumpenkopf');
  await ni.getByRole('button', { name: T('Merge {name}', { name: coll }) }).click();
  const sheet2 = page.getByRole('dialog', { name: coll });
  const pieces = sheet2.locator('ul[aria-label="' + T('Suggestions') + '"] .opt');
  await expect(pieces).toHaveCount(3);
  for (const p of await pieces.all()) if ((await p.getAttribute('aria-pressed')) !== 'true') await p.click();
  await expect(sheet2.locator('.opt[aria-pressed=true]')).toHaveCount(3);
  // The search finds any other item (here: one more is not needed; the field works).
  await sheet2.getByRole('searchbox', { name: T('Search all items') }).fill('Garmin');
  await expect(sheet2.getByRole('list', { name: T('Search results') })).toContainText(N('Garmin Halterung'));
  if (info.project.name === 'phone') {
    await page.setViewportSize({ width: 320, height: 700 });
    expect(await fits(page)).toBe(true);
    await page.setViewportSize({ width: 390, height: 844 });
  }
  if (shots) await page.screenshot({ path: `${shots}/merge-collection-${info.project.name}.png` });
  await sheet2.getByRole('button', { name: T('Merge|items'), exact: true }).click();
  await expect(sheet2).toBeHidden();
  await expect.poll(async () => (await one(page, 'items', 'TO05')).mergedInto?.length).toBe(3);
  const tpl = (await one(page, 'settings', 'templates')).value[0].entries;
  expect(tpl.filter((e) => e.itemId.startsWith('TO1')).sort((a, b) => a.itemId.localeCompare(b.itemId))).toEqual([
    { itemId: 'TO10', slot: 'top', qty: 2 },
    { itemId: 'TO11', slot: 'top', qty: 2 },
    { itemId: 'TO12', slot: 'top', qty: 2 },
  ]);
  expect(await ids('next')).toEqual(['ON05', 'TO10', 'TO11', 'TO12']);
  expect(await ids('past')).toEqual(['ON05', 'TO05']);
  expect(await one(page, 'items', 'TO11')).toMatchObject({ weightG: 160 });
  expect(await one(page, 'items', 'TO10')).toMatchObject({ weightG: 90 });
  expect((await table(page, 'items')).length).toBe(base.tables.items.length + ITEMS.length);
  if (shots) {
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${shots}/import-notin-${info.project.name}.png`, fullPage: true });
  }

  // 4. The item window offers "Zusammenlegen mit …" for any item; v0.45.1 (G014a) on the phone too.
  {
    await page.goto('./#/gear');
    await page.getByRole('searchbox', { name: T('Search gear') }).fill('rüttelfest');
    await page.getByRole('button', { name: new RegExp(N('Garmin-Halterung')) }).first().click();
    const dlg = page.locator('dialog.sheet:not(.merge)');
    await expect(dlg.getByRole('heading', { name: old })).toBeVisible();
    await dlg.getByRole('button', { name: T('Merge with …') }).click();
    const sheet3 = page.locator('dialog.merge');
    await expect(sheet3.getByRole('button', { name: new RegExp(N('Garmin Halterung')) })).toHaveAttribute('aria-pressed', 'true');
    if (shots) await page.screenshot({ path: `${shots}/merge-itemdialog-${info.project.name}.png` });
    await sheet3.getByRole('button', { name: T('Merge|items'), exact: true }).click();
    await expect(dlg.getByRole('status')).toContainText(T('Merged into {names}. The item is now under Gone; past trips keep it.', { names: N('Garmin Halterung') }));
    await expect.poll(async () => (await one(page, 'items', 'ON05')).ownership).toBe('gone');
    await dlg.getByRole('button', { name: T('Undo') }).click();
    await expect.poll(async () => (await one(page, 'items', 'ON05')).ownership).toBe('owned');
  }
  expect(errors).toEqual([]);
});
