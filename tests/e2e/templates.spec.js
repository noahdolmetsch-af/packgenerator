// v0.39.0 (AP28, "Vorlagen neu"): the template list (area switch, last used, "long not used" with
// Keep and Archive), a new template in 3 steps (building blocks, single items, bike) and a trip
// started from a template (bike and hiking). Fictional fixture (test_data_gtp_), German, phone + desktop.
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';

const FIX = fileURLToPath(new URL('./templates-fixture.json', import.meta.url));
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};

async function start(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  // A fixed day, so "last used" and "long not used" do not drift.
  await page.clock.setFixedTime(new Date('2026-10-09T10:00:00+02:00'));
  await page.goto('./');
  const data = page.locator('details.data');
  await expect(async () => {
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
    expect(await data.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await data.getByLabel(T('Import backup')).setInputFiles(FIX);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await expect(data.getByText(/importiert/)).toBeVisible();
}

/** A table, read straight from IndexedDB. */
const table = (page, name) =>
  page.evaluate((n) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(n).objectStore(n).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);
const templates = async (page) => (await table(page, 'settings')).find((s) => s.key === 'templates').value;
const wide = (page) => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);

test('the list: last used first, area switch, long not used with Keep, Archive with Undo', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context);
  await page.goto('./#/pack/templates');
  const rows = page.locator('li.row:not(.arch)');
  // Bikepacking first (the area switch shows only areas with templates, plus All).
  await expect(rows).toHaveCount(4);
  // Sorted by last use: the after-work ride was used most recently.
  await expect(rows.first()).toContainText('test_data_gtp_ Feierabendrunde');
  // Composition on the row, with the building blocks by name.
  await expect(page.locator('[data-tpl="tpl-jura"]')).toContainText('Standard');
  await expect(page.locator('[data-tpl="tpl-jura"]')).toContainText('Regen');
  // Every template is linked after the start (one-time update, identical content).
  for (const tp of await templates(page)) expect(Array.isArray(tp.blocks)).toBe(true);

  // Area switch (Noah 4a, Q5a): only areas with templates, plus All.
  const areas = page.getByRole('group', { name: T('Area') });
  const seg = (name) => areas.getByRole('button', { name: new RegExp(`^${name}`) });
  await expect(areas.getByRole('button')).toHaveText([new RegExp(`^${T('Bikepacking')}`), new RegExp(`^${T('Hiking')}`), new RegExp(`^${T('All|areas')}`)]);
  await seg(T('Hiking')).click();
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('test_data_gtp_ Rigi-Wanderung');
  await seg(T('All|areas')).click();
  await expect(rows).toHaveCount(5);
  await expect(seg(T('All|areas'))).toHaveAttribute('aria-pressed', 'true');

  // "long not used" (6a): the Alpenbrevet template was last used in July 2025.
  const brevet = page.locator('[data-tpl="tpl-brevet"]');
  await expect(brevet).toContainText(T('long not used'));
  await brevet.getByRole('button', { name: T('Keep') }).click();
  await expect(brevet).not.toContainText(T('long not used'));
  await expect.poll(async () => (await templates(page)).find((x) => x.id === 'tpl-brevet').keptAt).toBeTruthy();

  // Archive via ••• and Undo: nothing is deleted.
  await page.locator('[data-tpl="tpl-regen"]').getByRole('button', { name: T('More for {name}', { name: 'test_data_gtp_ Regentag Pendeln' }) }).click();
  await page.getByRole('menuitem', { name: T('Archive') }).click();
  await expect(rows).toHaveCount(4);
  await expect.poll(async () => (await templates(page)).find((x) => x.id === 'tpl-regen').archivedAt).toBeTruthy();
  await page.getByRole('status').getByRole('button', { name: T('Undo') }).click();
  await expect(rows).toHaveCount(5);
  await expect.poll(async () => (await templates(page)).find((x) => x.id === 'tpl-regen').archivedAt ?? null).toBe(null);
  expect(await wide(page)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('a new template in 3 steps: building blocks, single items, bike', async ({ page, context }) => {
  await start(page, context);
  await page.goto('./#/pack/templates');
  await page.getByRole('link', { name: T('New template') }).click();
  await expect(page).toHaveURL(/#\/pack\/templates\/new/);
  // Step 1: name and building blocks (Standard always in it).
  await page.getByLabel(T('Name')).fill('test_data_gtp_ Herbst-Overnighter');
  await page.getByRole('checkbox', { name: /Regen/ }).check();
  await page.getByRole('button', { name: T('Next|step') }).click();
  // Step 2: single items.
  await page.getByLabel(T('Search an item')).fill('Riegel');
  await page.getByRole('button', { name: T('Add {name}', { name: 'test_data_gtp_ Riegel' }) }).click();
  await expect(page.getByRole('button', { name: T('More: {name}', { name: 'test_data_gtp_ Riegel' }) })).toBeVisible();
  await page.getByRole('button', { name: T('More: {name}', { name: 'test_data_gtp_ Riegel' }) }).click();
  await page.getByRole('button', { name: T('Next|step') }).click();
  // Step 3: the bike is optional; with a bike the items go into its bags.
  await page.getByRole('radio', { name: /Test gravel bike/ }).click();
  await expect(page.getByText(T('Spread over the bags'))).toBeVisible();
  expect(await wide(page)).toBeLessThanOrEqual(0);
  await page.getByRole('button', { name: T('Save template') }).click();
  await expect(page).toHaveURL(/#\/pack\/templates\/(?!new)/);
  await expect(page.getByRole('heading', { level: 1, name: 'test_data_gtp_ Herbst-Overnighter' })).toBeVisible();
  const made = (await templates(page)).find((x) => x.name === 'test_data_gtp_ Herbst-Overnighter');
  expect(made).toMatchObject({ domain: 'bikepacking', bikeId: 'bike-test', blocks: ['standard', 'u-regen'], extras: [{ itemId: 'FO01', qty: 2 }] });
  const ids = made.entries.map((e) => e.itemId);
  expect(ids).toEqual(expect.arrayContaining(['RA03', 'RA04', 'RA05', 'FO01', 'TO01']));
  expect(made.entries.find((e) => e.itemId === 'FO01').qty).toBe(2);
});

test('a trip starts from a template, with its area; hiking without a bike', async ({ page, context }) => {
  await start(page, context);
  // From the template page: "New trip from it".
  await page.goto('./#/pack/templates/tpl-jura');
  await page.getByRole('button', { name: T('New trip from it') }).click();
  let dlg = page.getByRole('dialog', { name: T('New trip') });
  await expect(dlg).toBeVisible();
  await dlg.getByRole('textbox', { name: T('Name') }).filter({ visible: true }).fill('test_data_gtp_ Jura im Oktober');
  await dlg.getByRole('button', { name: new RegExp(T('Create trip')) }).click();
  await expect(dlg).toBeHidden();
  await expect.poll(async () => (await table(page, 'trips')).find((x) => x.title === 'test_data_gtp_ Jura im Oktober')?.templateId).toBe('tpl-jura');
  const jura = (await table(page, 'trips')).find((x) => x.title === 'test_data_gtp_ Jura im Oktober');
  expect(jura.domain).toBe('bikepacking');
  expect(jura.entries.map((e) => e.itemId)).toEqual(expect.arrayContaining(['SL01', 'RA03', 'LI03']));

  // From the list via •••: a hiking template has no bike; the trip gets the hiking area.
  await page.goto('./#/pack/templates');
  await page.getByRole('group', { name: T('Area') }).getByRole('button', { name: new RegExp(`^${T('Hiking')}`) }).click();
  await page.locator('[data-tpl="tpl-rigi"]').getByRole('button', { name: T('More for {name}', { name: 'test_data_gtp_ Rigi-Wanderung' }) }).click();
  await page.getByRole('menuitem', { name: T('New trip') }).click();
  dlg = page.getByRole('dialog', { name: T('New trip') });
  await expect(dlg).toBeVisible();
  await expect(dlg.locator('.area-fold > summary')).toContainText(T('Hiking')); // v0.40.0: the area folded as one row
  await dlg.getByRole('textbox', { name: T('Name') }).filter({ visible: true }).fill('test_data_gtp_ Rigi im Herbst');
  await dlg.getByRole('button', { name: new RegExp(T('Create trip')) }).click();
  await expect(dlg).toBeHidden();
  await expect.poll(async () => (await table(page, 'trips')).find((x) => x.title === 'test_data_gtp_ Rigi im Herbst')?.templateId).toBe('tpl-rigi');
  const rigi = (await table(page, 'trips')).find((x) => x.title === 'test_data_gtp_ Rigi im Herbst');
  expect(rigi.domain).toBe('hiking');
  expect(rigi.bikeId ?? null).toBe(null);
  expect(rigi.entries.map((e) => e.itemId)).toEqual(expect.arrayContaining(['HK01', 'HK02', 'HK03']));
  expect(await wide(page)).toBeLessThanOrEqual(0);
});
