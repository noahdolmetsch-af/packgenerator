// v0.23.0 (AP08, AP09): Gear shows search and items before the weight analyses; a new item needs
// only name, category and status (weight may stay empty = not weighed); zero results offer to add
// what was searched for. Changing the category of an item keeps its ID and every link to it, also
// after a reload. Fictional data only (gear-fixture.json, test_data_gtp_…).
// v0.23.1 (Noah 5b): the category change runs on the phone too (its read-only view has the category
// next to the weight).
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import DE from '../../src/lib/i18n/de/index.js';

const FIXTURE = fileURLToPath(new URL('./gear-fixture.json', import.meta.url));
const ID = 'test_data_gtp_KL92';
const BAG = 'test_data_gtp_TA90';

/** The same lookup as t() in src/lib/i18n.svelte.js, so selectors follow the app's own texts. */
const tr = (lang) => (en, vars) => {
  const text = (lang === 'de' ? DE[en] : null) ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};

/** Read one table straight from IndexedDB (the app's own database). */
const table = (page, name) =>
  page.evaluate(
    (name) =>
      new Promise((resolve, reject) => {
        const open = indexedDB.open('pack-generator');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const req = open.result.transaction(name).objectStore(name).getAll();
          req.onsuccess = () => (open.result.close(), resolve(req.result));
          req.onerror = () => reject(req.error);
        };
      }),
    name,
  );

async function start(page, context, lang, fixture = FIXTURE) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript((l) => localStorage.setItem('lang', l), lang);
  page.on('dialog', (d) => d.accept());
  const T = tr(lang);
  await page.goto('./');
  const data = page.locator('details.data');
  // the app opens this panel by itself on an empty start: make sure it ends up open
  await expect(async () => {
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
    expect(await data.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await data.getByLabel(T('Import backup')).setInputFiles(fixture);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await expect(data.getByText(T('Imported {name} (replaced all data).', { name: basename(fixture) }))).toBeVisible();
  return T;
}

const fits = async (page, where) => {
  const width = page.viewportSize().width;
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw, `${where}: page is ${sw} px wide, viewport ${width} px`).toBeLessThanOrEqual(width);
};

for (const lang of ['en', 'de']) {
  test(`gear: list first, short add dialog, ${lang}`, async ({ page, context }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const T = await start(page, context, lang);
    await page.goto('./#/gear');

    // The analyses are folded shut below the list.
    const analysis = page.locator('details.analysis');
    await expect(analysis).toHaveJSProperty('open', false);
    const search = page.getByRole('searchbox', { name: T('Search gear') });
    const sBox = await search.boundingBox();
    const aBox = await analysis.boundingBox();
    expect(sBox.y).toBeLessThan(aBox.y);

    // A search result shows without scrolling.
    await search.fill('Multitool');
    const row = page.getByRole('button', { name: /test_data_gtp_ Multitool/ });
    await expect(row).toBeVisible();
    const rBox = await row.boundingBox();
    expect(rBox.y + rBox.height, 'the result is on the first screen').toBeLessThanOrEqual(page.viewportSize().height);
    await fits(page, 'search result');

    // Long names wrap, nothing scrolls sideways.
    await search.fill('Bike computer');
    await expect(page.getByText(T('not weighed'), { exact: true }).first()).toBeVisible();
    await fits(page, 'long name');

    // Zero results: add what was searched for, with name, category, status and no weight.
    const name = `test_data_gtp_ Spork ${lang}`;
    await search.fill(name);
    await expect(page.getByText(T('Nothing found.'))).toBeVisible();
    await fits(page, 'nothing found');
    await page.getByRole('button', { name: T('Add "{q}" as a new item', { q: name }) }).click();
    const dlg = page.getByRole('dialog', { name: T('Add item') });
    await expect(dlg.getByLabel(T('Name'))).toHaveValue(name);
    await expect(dlg.locator('details.more')).toHaveJSProperty('open', false);
    // Saving without a category is refused.
    await dlg.getByRole('button', { name: T('Save') }).click();
    await expect(dlg.getByText(T('Choose a category.'))).toBeVisible();
    await dlg.getByLabel(T('Category')).selectOption('cook');
    await dlg.getByRole('button', { name: T('Save') }).click();
    await expect(dlg).toBeHidden();
    await expect(page.getByRole('button', { name: new RegExp(name) })).toBeVisible();
    const saved = (await table(page, 'items')).find((i) => i.name === name);
    expect(saved).toMatchObject({ category: 'cook', ownership: 'owned', weightG: null, weightStatus: 'missing' });
    await fits(page, 'after adding');
    expect(errors).toEqual([]);
  });
}

test('gear: change the category, links survive a reload', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await start(page, context, 'de');
  await page.goto('./#/gear');
  const before = Object.fromEntries((await table(page, 'items')).map((i) => [i.id, i]));
  const [tripBefore] = await table(page, 'trips');
  expect(tripBefore.entries.find((e) => e.itemId === ID)).toEqual({ itemId: ID, slot: 'bar', qty: 2, packed: true });
  const search = page.getByRole('searchbox', { name: T('Search gear') });
  const strip = ({ updatedAt, ...rest }) => rest;

  // Open + save without a change: no field is lost (the item has every field set).
  await search.fill('Rain jacket');
  await page.getByRole('button', { name: /test_data_gtp_ Regenjacke/ }).click();
  let dlg = page.getByRole('dialog', { name: /test_data_gtp_ Regenjacke/ });
  await dlg.getByRole('button', { name: T('Save') }).click();
  await expect(dlg).toBeHidden();
  expect(strip((await table(page, 'items')).find((i) => i.id === ID))).toEqual(strip(before[ID]));

  // Change the category: On-bike clothing → Rain & cold; the bag item: Bags → Comfort & luxury.
  for (const [q, name, to, id] of [['Rain jacket', /test_data_gtp_ Regenjacke/, 'rain', ID], ['Roll bag', /test_data_gtp_ Rolltasche/, 'lux', BAG]]) {
    await search.fill(q);
    await page.getByRole('button', { name }).click();
    dlg = page.getByRole('dialog', { name });
    await dlg.getByLabel(T('Category')).selectOption(to);
    await expect(dlg.getByRole('status')).toContainText(id);
    await dlg.getByRole('button', { name: T('Save') }).click();
    await expect(dlg).toBeHidden();
  }

  await page.reload();
  const items = await table(page, 'items');
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  expect(byId[ID].category).toBe('rain');
  expect(byId[BAG].category).toBe('lux');
  expect(strip({ ...byId[ID], category: 'onbike' })).toEqual(strip(before[ID]));
  // (an item with fewer fields gets the empty rule fields as null, as before; nothing it had is lost)
  expect({ ...byId[BAG], category: 'bags' }).toMatchObject(strip(before[BAG]));
  expect(items).toHaveLength(Object.keys(before).length); // no copy under a new ID
  const [trip] = await table(page, 'trips');
  expect(trip.entries).toEqual(tripBefore.entries);
  expect(trip.setup.bar).toBe('bag-test_data_gtp_roll');
  expect((await table(page, 'containers')).find((c) => c.id === 'bag-test_data_gtp_roll')).toMatchObject({ itemId: BAG, pieces: 2 });
  const tpl = (await table(page, 'settings')).find((s) => s.key === 'templates').value[0];
  expect(tpl.entries).toEqual([{ itemId: ID, slot: 'bar', qty: 2 }]);
  expect((await table(page, 'weightChecks'))[0].itemId).toBe(ID);
  expect((await table(page, 'learnings'))[0].itemIds).toEqual([ID]);

  // Gear shows it under its new category.
  await page.getByRole('searchbox', { name: T('Search gear') }).fill('Rain jacket');
  const rain = page.locator('section.cat', { has: page.locator('#gh-rain') });
  await expect(rain.getByRole('button', { name: /test_data_gtp_ Regenjacke/ })).toBeVisible();

  // The bag keeps its gear item and its weight (2 × 300 g) in the bag dialog on Bikes.
  await page.goto('./#/bikes');
  const yours = page.locator('details', { hasText: T('Your bags') }).last();
  await yours.locator('summary').first().click();
  await yours.getByRole('button', { name: /test_data_gtp_ Roll bag/ }).click();
  const bagDlg = page.getByRole('dialog', { name: /test_data_gtp_ Roll bag/ });
  await expect(bagDlg.getByLabel(T('Weight from gear item'))).toHaveValue(BAG);
  await expect(bagDlg.getByText('600 g')).toBeVisible();
  await bagDlg.getByRole('button', { name: T('Save') }).click();
  await expect(bagDlg).toBeHidden();
  expect((await table(page, 'containers')).find((c) => c.id === 'bag-test_data_gtp_roll').itemId).toBe(BAG);
  expect(errors).toEqual([]);
});

// v0.27.0 (pffix 9): an item whose category the app does not know (someone else's import) is not invisible.
test('an item with an unknown category shows in "Other / unknown category" with a hint', async ({ page, context }, info) => {
  const data = JSON.parse(readFileSync(FIXTURE, 'utf8'));
  data.tables.items.push({ id: 'test_data_gtp_XX90', name: 'test_data_gtp_ Foreign jacket', category: 'clothing', weightG: 300, qty: 1, weightStatus: 'measured', defaultBag: 'seat', ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'] });
  const file = info.outputPath('gear-unknown-fixture.json');
  writeFileSync(file, JSON.stringify(data));
  const T = await start(page, context, 'de', file);
  await page.goto('./#/gear');
  const group = page.locator('section.cat').filter({ has: page.locator('#gh-other') });
  await expect(group.locator('h2')).toContainText(T('Other / unknown category'));
  if ((await group.locator('h2 button').getAttribute('aria-expanded')) === 'false') await group.locator('h2 button').click();
  await expect(group).toContainText('test_data_gtp_ Foreign jacket');
  await expect(group).toContainText(T('The app does not know the category of these items. Open one and pick a category.'));
  await fits(page, 'Gear with an unknown category');
});

