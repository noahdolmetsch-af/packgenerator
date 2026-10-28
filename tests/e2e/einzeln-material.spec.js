// Einzelideen Material und Überall (996 Ideen, Noah 25.10.2026: 19–22, 24, 37, 38, 40). A favourite gets a short
// reason, a wish the trouble it solves, a bottle its content apart from the empty weight, the picture tool keeps the old
// names, and the search asks when a word means two things. Fictional data only (test_data_gtp_).
import { test, expect } from './clock.js';
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

// Einzelidee 21 «Zu viel an derselben Stelle» and 22 «Kategorien als Ansichten» (mockups OK by Noah 26.10.2026)
const cloth = (id, name, f) => item(id, `test_data_gtp_ ${name}`, { category: 'onbike', weightG: 180, defaultBag: 'seat', ...f });
function data2() {
  const d = data();
  const t = d.tables;
  t.items.push(
    cloth('test_data_gtp_B1', 'Merino Langarm', { layer: 'base', zone: 'torso', tempMin: 4, tempMax: 15, ownViews: ['repair'] }),
    cloth('test_data_gtp_B2', 'Merino Langarm Ersatz', { layer: 'base', zone: 'torso', tempMin: 5, tempMax: 15, ownViews: ['repair', 'always'] }),
  );
  t.trips[0].entries = ['test_data_gtp_B1', 'test_data_gtp_B2'].map((itemId) => ({ itemId, slot: 'body', qty: 1, packed: false })).concat(t.trips[0].entries);
  return d;
}

test('22: own views show an item in several places, without a copy; add a view, tick it in the item window', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: data2() });
  await page.goto('./#/gear');
  const row = page.locator('[data-own-views]');
  await expect(row).toBeVisible();
  await expect(row.locator('[data-own-view="repair"] .num')).toHaveText('2');
  await expect(row.locator('[data-own-view="always"] .num')).toHaveText('1');
  await tap(row.locator('[data-own-view="repair"]'), info);
  await expect(page.locator('#vh-h')).toHaveText(T('Repair|view'));
  await expect(page).toHaveURL(/mine=repair/);
  await expect(page.getByText('test_data_gtp_ Merino Langarm Ersatz').first()).toBeVisible();
  await expect(page.getByText('test_data_gtp_ Stirnlampe')).toHaveCount(0);
  expect(await noSideways(page)).toBe(0);
  // a second tap closes the view
  await tap(row.locator('[data-own-view="repair"]'), info);
  await expect(page.locator('#vh-h')).not.toHaveText(T('Repair|view'));
  // edit: add a view
  await tap(row.locator('[data-own-views-edit]'), info);
  const sheet = page.locator('dialog.ov-sheet');
  await expect(sheet).toBeVisible();
  await sheet.locator('[data-kind-new]').fill('test_data_gtp_ Kinder');
  await tap(sheet.getByRole('button', { name: T('Add'), exact: true }), info);
  await expect(sheet.locator('[data-kinds] li')).toHaveCount(4);
  await tap(sheet.getByRole('button', { name: T('Close') }), info);
  await expect(row.getByText('test_data_gtp_ Kinder')).toBeVisible();
  // tick it in the item window
  const dlg = await openFold(page, info, 'test_data_gtp_fav', 'details');
  const box = dlg.locator('[data-item-views]');
  await tap(box.getByLabel('test_data_gtp_ Kinder'), info);
  await tap(dlg.getByRole('button', { name: T('Save'), exact: true }), info);
  await expect.poll(async () => ((await rows(page, 'items')).find((i) => i.id === 'test_data_gtp_fav')?.ownViews ?? []).length).toBe(1);
  expect(errors).toEqual([]);
});

test('21: the layer check asks about two pieces with the same task', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: data2() });
  const tripId = data2().tables.trips[0].id;
  await page.evaluate((id) => localStorage.setItem('pack.currentTrip', id), tripId);
  await page.goto('./#/');
  await page.goto('./#/pack');
  const line = page.locator('.onion .oline');
  await expect(line).toBeVisible();
  if (!(await page.locator('[data-onion-twice]').isVisible())) await tap(line, info);
  const twice = page.locator('[data-onion-twice]');
  await expect(twice).toBeVisible();
  await expect(twice).toContainText(T('Same task twice'));
  expect(await noSideways(page)).toBe(0);
  await tap(twice.locator('[data-twice-ok]'), info);
  await expect(twice).toHaveCount(0);
  await expect.poll(async () => ((await rows(page, 'trips')).find((x) => x.id === tripId)?.twiceOk ?? []).length).toBe(1);
  expect(errors).toEqual([]);
});
