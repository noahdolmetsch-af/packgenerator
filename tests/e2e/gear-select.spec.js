// v0.24.1 (Noah 5a): several gear items at once. Select two items and change their category
// (the IDs stay), clean up the test entries with search → Select → Select all → Delete (also
// off the trip and the template), Undo brings everything back, and a 320 px phone never
// scrolls sideways. Fictional fixture plus test_data_gtp_ items; nothing outside the preview server.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';

const tr = (lang) => (en, vars) => {
  const text = (lang === 'de' ? DE[en] : null) ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const TEST_IDS = ['HY91', 'HY92', 'EL91'];

function fixture(path) {
  const data = structuredClone(base);
  const add = (id, name, category) => data.tables.items.push({ id, name, category, weightG: 20, qty: 1, weightStatus: 'measured', defaultBag: 'top', ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'] });
  add('HY91', 'test_data_gtp_ Seife', 'hyg');
  add('HY92', 'test_data_gtp_ Kamm', 'hyg');
  add('EL91', 'test_data_gtp_ Kabel', 'elec');
  const bike = data.tables.bikes[0];
  data.tables.trips.push({
    id: 'trip-test_data_gtp_1', domain: 'bikepacking', title: 'test_data_gtp_ Tour', startDate: '2026-11-01', days: 1, bikeId: bike.id, bike: bike.name, setup: { ...bike.setup },
    entries: [{ itemId: 'HY91', slot: 'top', qty: 1, packed: false }, { itemId: 'EL01', slot: 'top', qty: 1, packed: false }],
    ready: [{ id: 'wallet', label: 'Phone, wallet, keys', done: false }], ride: null, hours: null, sets: {}, purpose: {}, status: 'planned', copiedFrom: null, createdAt: '2026-10-01T08:00:00.000Z',
  });
  data.tables.settings.push({ key: 'templates', value: [{ id: 'tpl-test_data_gtp_', name: 'test_data_gtp_ Vorlage', setup: {}, entries: [{ itemId: 'HY92', slot: 'top', qty: 1 }, { itemId: 'LI01', slot: 'top', qty: 1 }], ready: [], ride: null, hours: null, sets: {}, purpose: {}, updatedAt: '2026-10-01T08:00:00.000Z' }] });
  writeFileSync(path, JSON.stringify(data));
}

async function start(page, context, info, lang, viewport) {
  const file = info.outputPath('gear-select-fixture.json');
  fixture(file);
  if (viewport) await page.setViewportSize(viewport);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript((l) => localStorage.setItem('lang', l), lang);
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const data = page.locator('details.data');
  // the app opens this panel by itself on an empty start: make sure it ends up open
  await expect(async () => {
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
    expect(await data.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await data.getByLabel(tr(lang)('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: tr(lang)('Replace all data') }).press('Enter');
  await expect(data.getByText(/importiert|Imported/)).toBeVisible();
  await page.goto('./#/gear');
}

/** All records of a table, read straight from the browser database. */
const table = (page, name) =>
  page.evaluate((n) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(n).objectStore(n).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);

test('select two items and change their category, the IDs stay', async ({ page, context }, info) => {
  const T = tr('de');
  await start(page, context, info, 'de');
  const n0 = (await table(page, 'items')).length;
  // v0.47.2: the category is in the sheet "Sort and filter"
  await page.locator('.fbtn').click();
  await page.getByRole('dialog', { name: T('Sort and filter') }).getByRole('group', { name: T('Category') }).getByRole('button', { name: new RegExp(`^${T('Electronics')}`) }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: T('Select'), exact: true }).click();
  await page.getByRole('checkbox', { name: 'Bike computer' }).check();
  // A tap on the row (not the box) ticks it too.
  await page.locator('label.pr', { hasText: 'USB-C cable' }).locator('.w').click();
  await expect(page.getByRole('checkbox', { name: 'USB-C cable' })).toBeChecked();
  const bar = page.getByRole('region', { name: T('Selected items') });
  await expect(bar).toContainText(T('{n} selected', { n: 2 }));
  // v0.43.0: Category … is under ••• and opens the assign window.
  await bar.getByLabel(T('More actions')).click();
  await bar.getByRole('button', { name: T('Category …') }).click();
  const dlg = page.getByRole('dialog', { name: T('Category') });
  await dlg.getByLabel(T('Category'), { exact: true }).selectOption('tools');
  await dlg.getByRole('button', { name: T('Assign'), exact: true }).click();
  await expect(bar.getByRole('status')).toContainText(T('{n} items moved to {cat}. The IDs stay the same.', { n: 2, cat: T('Tools & repair') }));
  const items = await table(page, 'items');
  const cat = (id) => items.find((i) => i.id === id)?.category;
  expect([cat('EL01'), cat('EL03'), cat('EL02')]).toEqual(['tools', 'tools', 'elec']);
  expect(items).toHaveLength(n0);
  // Undo puts the category back.
  await bar.getByRole('button', { name: T('Undo') }).click();
  await expect.poll(async () => (await table(page, 'items')).find((i) => i.id === 'EL01').category).toBe('elec');
});

for (const lang of ['de', 'en']) {
  test(`clean up the test entries in 4 clicks, then undo, ${lang}`, async ({ page, context }, info) => {
    const T = tr(lang);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const confirms = [];
    page.on('dialog', (d) => confirms.push(d.message()));
    await start(page, context, info, lang);
    const n0 = (await table(page, 'items')).length;
    let clicks = 0;
    const click = async (loc) => {
      await loc.click();
      clicks++;
    };
    await page.getByLabel(T('Search gear')).fill('test_data_gtp_');
    await click(page.getByRole('button', { name: T('Select'), exact: true }));
    await click(page.locator('.selrow').getByRole('button', { name: T('Select all'), exact: true }));
    // v0.43.0: Delete sits under ••• in the bar, on every screen.
    await click(page.getByRole('region', { name: T('Selected items') }).getByLabel(T('More actions')));
    await click(page.getByRole('region', { name: T('Selected items') }).getByRole('button', { name: T('Delete'), exact: true }));
    clicks++; // the OK in the confirm (accepted by the test)
    await expect(page.getByText(T('{n} items deleted.', { n: 3 }))).toBeVisible();
    expect(clicks, 'search, then 5 clicks').toBe(5);
    expect(confirms[0]).toContain(T('Delete {n} items from your gear?', { n: 3 }));
    expect(confirms[0]).toContain('test_data_gtp_ Seife');
    expect(confirms[0]).toContain(T('{n} of them are on a trip or template; they disappear from there too.', { n: 2 }));

    const left = (await table(page, 'items')).map((i) => i.id);
    expect(left.filter((id) => TEST_IDS.includes(id))).toEqual([]);
    expect(left).toHaveLength(n0 - TEST_IDS.length);
    const trip = (await table(page, 'trips')).find((t) => t.id === 'trip-test_data_gtp_1');
    const onTrip = trip.entries.map((e) => e.itemId);
    expect(onTrip).toContain('EL01');
    expect(onTrip.filter((id) => TEST_IDS.includes(id))).toEqual([]);
    const tpl = (await table(page, 'settings')).find((s) => s.key === 'templates').value[0];
    expect(tpl.entries.map((e) => e.itemId)).toEqual(['LI01']);

    // Undo brings the items back, on the trip and the template too.
    await page.getByRole('button', { name: T('Undo') }).click();
    await expect(page.getByRole('checkbox', { name: 'test_data_gtp_ Seife' })).toBeVisible();
    expect((await table(page, 'items')).map((i) => i.id)).toEqual(expect.arrayContaining(TEST_IDS));
    expect((await table(page, 'trips')).find((t) => t.id === 'trip-test_data_gtp_1').entries.map((e) => e.itemId)).toEqual(onTrip.length ? ['HY91', ...onTrip] : ['HY91']);
    expect((await table(page, 'settings')).find((s) => s.key === 'templates').value[0].entries.map((e) => e.itemId)).toEqual(['HY92', 'LI01']);
    expect(errors).toEqual([]);
  });
}

test('selecting on a 320 px phone: no sideways scroll, the bar sits above the bottom bar', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'phone', 'phone only');
  const T = tr('de');
  await start(page, context, info, 'de', { width: 320, height: 640 });
  const wide = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const n0 = (await table(page, 'items')).filter((i) => i.ownership === 'owned' || i.ownership === 'unclear').length;
  await page.getByRole('button', { name: T('Select'), exact: true }).click();
  await page.locator('.selrow').getByRole('button', { name: T('Select all'), exact: true }).click();
  const bar = page.getByRole('region', { name: T('Selected items') });
  await expect(bar).toContainText(T('{n} selected', { n: n0 }));
  expect(await wide()).toBe(0);
  // The bar ends above the bottom navigation.
  const b = await bar.boundingBox();
  const nav = await page.locator('nav.bottom').boundingBox();
  expect(b.y + b.height).toBeLessThanOrEqual(nav.y);
  // v0.76.0 «Fünf Orte»: the round + lies under the bar, never on its buttons.
  expect(await page.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.closest('[role="region"]'), [b.x + b.width - 12, b.y + b.height / 2])).toBe(true);
  // Group "Select all" works on a folded category.
  await page.locator('.selrow').getByRole('button', { name: T('Select none'), exact: true }).click();
  await page.getByRole('button', { name: T('Select all: {cat}', { cat: T('Lights') }) }).click();
  const lights = (await table(page, 'items')).filter((i) => i.category === 'light' && i.ownership === 'owned');
  await expect(bar).toContainText(T('{n} selected', { n: lights.length }));
  await bar.getByLabel(T('More actions')).click();
  await bar.getByRole('button', { name: T('To wishlist') }).click();
  await expect(bar.getByRole('status')).toBeVisible();
  expect(await wide()).toBe(0);
  const own = (await table(page, 'items')).filter((i) => lights.some((l) => l.id === i.id)).map((i) => i.ownership);
  expect(own).toEqual(lights.map(() => 'wishlist'));
});
