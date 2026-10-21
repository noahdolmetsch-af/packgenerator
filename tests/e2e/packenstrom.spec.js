// Paket P1 «Packen und Strom» (Noah 21.10.2026, mockups NP1, L1, L2, L4): «Neues Teil erfassen und einpacken»
// under the building blocks, the row «Strom» of a device (values with their source, half and a quarter
// worked out, light levels, the stopwatch), and a repair kit naming a battery is no device on #/gear/power.
// German UI, fictional data (test_data_gtp_).
import { test, expect } from '@playwright/test';
import { openHome, homeFixture } from './home0460-fixture.js';

const LAMP = { id: 'LI90', name: 'test_data_gtp_ Frontlampe', category: 'light', weightG: 150, qty: 1, weightStatus: 'measured', defaultBag: 'mounted', ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'] };
const KIT = { id: 'TO90', name: 'test_data_gtp_ Flickzeug-Beutel (Kleber, Batterie, Messer)', category: 'tools', weightG: 120, qty: 1, weightStatus: 'measured', defaultBag: 'frame', ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'] };
const fixture = () => {
  const data = homeFixture();
  data.tables.items.push(LAMP, KIT);
  // the kit is on every trip, so the power page of any trip would list it if it counted
  for (const trip of data.tables.trips) trip.entries = [...(trip.entries ?? []), { itemId: KIT.id, slot: 'frame', qty: 1, packed: false }];
  return data;
};
const item = (page, id) =>
  page.evaluate((x) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction('items').objectStore('items').get(x);
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), id);
const noSideScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

test('Neues Teil beim Packen: one visible button, the new item lands in the bag', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { data: fixture() });
  await page.goto('./#/pack');
  await page.getByRole('button', { name: T('Add material') }).filter({ visible: true }).first().click();
  const sheet = page.getByRole('dialog', { name: T('Add material') });
  const btn = sheet.locator('[data-new-item]');
  await expect(btn).toHaveText(`+ ${T('Add a new item and pack it')}`);
  await btn.click();
  const nd = page.getByRole('dialog').filter({ has: page.getByLabel(T('Name')) }).last();
  await nd.getByLabel(T('Name')).fill('test_data_gtp_ Regenhülle');
  await nd.getByLabel(T('Category')).selectOption('rain');
  await nd.getByRole('button', { name: T('Save') }).click();
  await expect(nd).toBeHidden();
  await sheet.getByRole('button', { name: T('Done') }).click();
  await expect(page.getByText('test_data_gtp_ Regenhülle').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('Strom im Teil: source per value, half and a quarter, light levels, the stopwatch', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { data: fixture() });
  await page.goto(`./#/gear?item=${LAMP.id}`);
  const dlg = page.locator('dialog[open]');
  const fold = dlg.locator('details.fold[data-fold="power"]');
  await fold.locator('summary').click();
  await fold.getByLabel(T('Charging takes (h)')).fill('3');
  await fold.getByLabel(T('Charging takes (h)')).blur();
  // typed by hand: the maker's value until changed
  await expect(fold.locator('[data-src="chargeH"]')).toHaveValue('maker');
  await fold.locator('[data-src="chargeH"]').selectOption('test');
  await expect(fold.locator('[data-partial]')).toContainText(T('Full {full} · half {half} · a quarter {quarter}', { full: '3:00 h', half: '1:12 h', quarter: '36 min' }));
  // two light levels, the second moved up
  for (const [name, h] of [['Hoch', '1.5'], ['Tief', '12']]) {
    await fold.locator('[data-mode-new]').fill(name);
    await fold.locator('[data-mode-h]').fill(h);
    await fold.locator('[data-mode-h]').press('Enter');
  }
  await expect(fold.locator('[data-mode]')).toHaveCount(2);
  await fold.getByRole('button', { name: T('Move {name} up', { name: 'Tief' }) }).click();
  await expect(fold.locator('[data-mode]').first()).toHaveAttribute('data-mode', 'Tief');
  expect(await noSideScroll(page)).toBe(true);
  await dlg.getByRole('button', { name: T('Save') }).click();
  await expect.poll(async () => (await item(page, LAMP.id))?.lightModes?.map((m) => m.name)).toEqual(['Tief', 'Hoch']);
  const saved = await item(page, LAMP.id);
  expect(saved.chargeH).toBe(3);
  expect(saved.powerSrc).toEqual({ chargeH: 'test' });
  // the stopwatch: start, an hour and a half later «Voll · stoppen» → measured
  await page.goto('./#/gear');
  await page.goto(`./#/gear?item=${LAMP.id}`);
  const fold2 = page.locator('dialog[open] details.fold[data-fold="power"]');
  // the row opened last opens again by itself
  if ((await fold2.getAttribute('open')) === null) await fold2.locator('summary').click();
  await fold2.locator('[data-plug]').selectOption('bank');
  await fold2.locator('[data-start]').click();
  await expect.poll(async () => (await item(page, LAMP.id))?.chargeTimer?.plug).toBe('bank');
  await page.clock.setFixedTime(new Date(Date.parse((await item(page, LAMP.id)).chargeTimer.startedAt) + 90 * 60e3));
  await fold2.locator('[data-stop]').click();
  await expect.poll(async () => (await item(page, LAMP.id))?.chargeH).toBe(1.5);
  const done = await item(page, LAMP.id);
  expect(done.powerSrc.chargeH).toBe('measured');
  expect(done.chargePlug).toBe('bank');
  expect(done.chargeTimer).toBeNull();
  expect(errors).toEqual([]);
});

test('Strom: a repair kit naming a battery is no device', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: fixture() });
  await page.goto('./#/gear/power');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('[data-power-result]')).toBeVisible();
  await expect(page.getByText('test_data_gtp_ Flickzeug-Beutel', { exact: false })).toHaveCount(0);
});
