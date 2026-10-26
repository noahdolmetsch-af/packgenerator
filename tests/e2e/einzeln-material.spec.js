// Einzelideen Material und Überall (996 Ideen, Noah 25.10.2026: 19, 20, 24, 37, 38, 40). A favourite gets a short
// reason, a wish the trouble it solves, a bottle its content apart from the empty weight, the picture tool keeps the old
// names, and the search asks when a word means two things. Fictional data only (test_data_gtp_).
import { test, expect } from '@playwright/test';
import { openHome, homeFixture, tr } from './home0460-fixture.js';

const T = tr('de');
const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const rows = (page, name) =>
  page.evaluate((n) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(n).objectStore(n).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);
const item = (id, name, extra = {}) => ({ id, name, category: 'cook', weightG: 120, qty: 1, weightStatus: 'measured', carry: 'luggage', defaultBag: null, ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'], ...extra });

function data() {
  const d = homeFixture();
  d.tables.items.push(
    item('test_data_gtp_fav', 'test_data_gtp_ Stirnlampe', { category: 'elec', favorite: true, favNote: null }),
    item('test_data_gtp_wish', 'test_data_gtp_ Tarp', { category: 'sleep', weightG: 300, ownership: 'wishlist' }),
    item('test_data_gtp_bottle', 'test_data_gtp_ Flasche'),
    item('test_data_gtp_zz', 'test_data_gtp_ zzkette'),
  );
  d.tables.notes = [...(d.tables.notes ?? []), { id: 'test_data_gtp_note', text: 'test_data_gtp_ zzkette quietscht', status: 'open', at: '2026-10-08T10:00:00.000Z' }];
  return d;
}

async function openFold(page, info, id, fold) {
  await page.goto('./#/');
  await page.goto(`./#/gear?item=${id}`);
  const dlg = page.getByRole('dialog');
  const d = dlg.locator(`details[data-fold="${fold}"]`);
  await expect(d).toBeVisible();
  // the window remembers the last open row: open it only when it is closed
  if ((await d.getAttribute('open')) === null) await tap(d.locator('> summary'), info);
  await expect(d).toHaveAttribute('open', '');
  return dlg;
}

test('19 + 20: a favourite gets a short reason, a wish the trouble it solves', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: data() });
  let dlg = await openFold(page, info, 'test_data_gtp_fav', 'details');
  await tap(dlg.locator('[data-fav-why]').getByRole('button', { name: `+ ${T('Reliable|why')}` }), info);
  await expect(dlg.locator('#it-favnote')).toHaveValue(T('Reliable|why'));
  expect(await noSideways(page)).toBe(0);
  await tap(dlg.getByRole('button', { name: T('Save'), exact: true }), info);
  await expect.poll(async () => (await rows(page, 'items')).find((i) => i.id === 'test_data_gtp_fav')?.favNote).toBe(T('Reliable|why'));

  dlg = await openFold(page, info, 'test_data_gtp_wish', 'details');
  await tap(dlg.locator('[data-wish-solves]').getByLabel(T('Stays dry|solves')), info);
  await tap(dlg.getByRole('button', { name: T('Save'), exact: true }), info);
  await expect.poll(async () => (await rows(page, 'items')).find((i) => i.id === 'test_data_gtp_wish')?.solves).toEqual(['dry']);
  await page.goto('./#/gear?view=wish');
  await expect(page.getByText(T('Solves: {list}', { list: T('Stays dry|solves') })).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('24: a bottle keeps its content apart from the empty weight', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: data() });
  const dlg = await openFold(page, info, 'test_data_gtp_bottle', 'weight');
  await dlg.locator('#it-fill').fill('750');
  await expect(dlg.locator('[data-full-weight]')).toHaveText(T('full {g} g', { g: 870 }));
  expect(await noSideways(page)).toBe(0);
  await tap(dlg.getByRole('button', { name: T('Save'), exact: true }), info);
  await expect.poll(async () => (await rows(page, 'items')).find((i) => i.id === 'test_data_gtp_bottle')?.fillG).toBe(750);
  expect(errors).toEqual([]);
});

test('38 + 40: the picture tool keeps the old names; the search asks which meaning', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: data() });
  await page.goto('./#/me/tools/convert');
  await expect(page.locator('[data-convert-keep]')).toBeVisible();

  await page.goto('./#/');
  const field = page.getByLabel(T('What do you want to do? Search or say an action'));
  if (phone(info)) await page.getByRole('button', { name: T('Search everything') }).click();
  else await field.click();
  await field.fill('zzkette');
  const ask = page.locator('[data-search-meanings]');
  await expect(ask).toBeVisible();
  await expect(ask.locator('[data-meaning]')).toHaveCount(2);
  await ask.locator('[data-meaning="gear"]').click();
  await expect(field).toHaveValue('material zzkette');
  await expect(ask).toHaveCount(0);
  expect(await noSideways(page)).toBe(0);
  expect(errors).toEqual([]);
});
