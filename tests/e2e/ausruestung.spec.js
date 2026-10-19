// AU1 «Ausrüstung» (Noah 15.10.2026 «5b» own place, «1-5a» with «1b»): an item of Material becomes main
// equipment (3a), the page groups it by sport (2a) with its counter from past trips, «Pflege fällig» with
// «Erledigt», the sports without equipment stay visible (5a), the care due shows on Heute (4a); on a
// phone Velos and Ausrüstung share one slot with a switch on top (1b), on a computer the sidebar has its
// own row. In German, no sideways scroll, no page errors. Fictional data only.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { TODAY, D0, addDays, put } from './aktiv-fixture.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};

async function open(page, context, hash) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`./${hash}`);
  return errors;
}
async function fits(page, where) {
  const w = page.viewportSize().width;
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw, `${where}: no sideways scroll`).toBeLessThanOrEqual(w);
}

// two fictional items and three past ski tours with the skis on the list
const items = [
  { id: 'test_au_ski', name: 'Tourenski Test', category: 'other', ownership: 'owned', domains: ['ski'], weightG: 2800, weightStatus: 'measured', sets: [], kits: [] },
  { id: 'test_au_cushion', name: 'Sitzkissen Test', category: 'other', ownership: 'owned', domains: ['everyday'], weightG: 900, weightStatus: 'measured', sets: [], kits: [] },
];
const trips = [1, 2, 3].map((i) => ({ id: `test_au_trip_${i}`, title: `Skitour Test ${i}`, domain: 'ski', status: 'done', startDate: addDays(TODAY, -30 * i), days: 1, entries: [{ itemId: 'test_au_ski', slot: 'pack' }], packs: [{ key: 'pack', name: 'Rucksack', volumeL: 30 }] }));

test('Ausrüstung: from Material to the page, care due with Erledigt, the row on Heute', async ({ page, context }) => {
  const errors = await open(page, context, '#/equipment');
  await expect(page.locator('main')).toBeVisible();
  await put(page, { items, trips });
  await page.reload();
  const main = page.locator('main');
  const phone = page.viewportSize().width < 720;

  // the place: own row in the sidebar (computer), one slot with Velos and a switch on top (phone)
  if (phone) {
    await expect(page.locator('nav.bottom a[aria-current="page"]')).toHaveText(T('Bikes|place'));
    await expect(page.locator('[data-place-switch] a[aria-current="page"]')).toHaveText(T('Equipment|place'));
  } else {
    await expect(page.locator('.side li.pl > a.pa[aria-current]')).toHaveText(T('Equipment|place'));
    await expect(page.locator('[data-place-switch]')).toBeHidden();
  }
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(T('Equipment|place'));
  await expect(main.locator('[data-mg-empty]')).toBeVisible();
  await fits(page, 'empty');

  // add the skis from Material: the care comes filled in as a suggestion; make waxing due after 3 uses
  await main.locator('[data-mg-empty] button').click();
  const sheet = page.locator('[data-main-sheet]');
  await expect(sheet).toBeVisible();
  await sheet.locator('[data-mg-save]').click();
  await expect(sheet.locator('.err')).toHaveText(T('Choose an item from your gear.'));
  await sheet.locator('[data-mg-search]').fill('Tourenski');
  await sheet.getByLabel('Tourenski Test').check();
  await sheet.locator('[data-mg-sport="dom:ski"]').click();
  const care = sheet.locator('[data-mg-care]');
  await expect(care).toHaveCount(2);
  await expect(care.first().locator('input').first()).toHaveValue('Wax the base');
  await care.first().locator('input.every').fill('3');
  await sheet.locator('[data-mg-save]').click();
  await expect(sheet).toBeHidden();

  // grouped by sport, counted from the three past ski tours, waxing due
  const group = main.locator('[data-mg-group="dom:ski"]');
  await expect(group).toContainText('Tourenski Test');
  await expect(group).toContainText(T('{n} uses', { n: 3 }));
  const due = main.locator('[data-mg-due]');
  await expect(due).toContainText(`Tourenski Test: ${T('Wax the base')}`);
  // the sports without equipment stay visible (5a)
  await expect(main.locator('[data-mg-without]')).toContainText(T('Without equipment so far'));
  await fits(page, 'with skis');

  // the detail: numbers and care; «Einsatz eintragen» counts one more
  await main.locator('[data-mg-row="Tourenski Test"]').click();
  const det = main.locator('[data-mg-detail]');
  await expect(det.getByRole('heading', { level: 2 })).toHaveText('Tourenski Test');
  await det.locator('[data-mg-use]').click();
  await expect(sheet).toBeVisible();
  await sheet.locator('[data-mg-save]').click();
  await expect(sheet).toBeHidden();
  await expect(group).toContainText(T('{n} uses', { n: 4 }));

  // Heute shows the care due (4a) and leads back here
  await page.goto('./#/');
  const row = page.locator('main').getByText(`Tourenski Test: ${T('Wax the base')}`).first();
  await expect(row).toBeAttached();

  // «Erledigt» starts the step again; «Rückgängig» brings it back
  await page.goto('./#/equipment');
  await due.locator('[data-mg-done]').click();
  await expect(main.locator('[data-mg-due]')).toHaveCount(0);
  await main.locator('.undo button').click();
  await expect(main.locator('[data-mg-due]')).toBeVisible();

  // the switch leads to Velos and back (phone)
  if (phone) {
    await page.locator('[data-place-switch] a[href="#/bikes"]').click();
    await expect(page).toHaveURL(/#\/bikes/);
    await expect(page.locator('[data-place-switch] a[aria-current="page"]')).toHaveText(T('Bikes|place'));
  }
  expect(errors).toEqual([]);
});

test('Ausrüstung: Material item window marks an item as main equipment', async ({ page, context }) => {
  const errors = await open(page, context, '#/gear');
  await expect(page.locator('main')).toBeVisible();
  await put(page, { items });
  await page.goto('./#/gear?item=test_au_cushion');
  await page.reload();
  const mark = page.locator('[data-main-gear]').filter({ visible: true }).first();
  await expect(mark).toHaveText(T('Make it main equipment'));
  await mark.click();
  await expect(page).toHaveURL(/#\/equipment\?add=test_au_cushion$/);
  const sheet = page.locator('[data-main-sheet]');
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('.kick')).toHaveCount(0); // add mode: the item is chosen, the title says what
  await sheet.locator('[data-mg-sport="act:meditation"]').click();
  await expect(sheet.locator('[data-mg-care]')).toHaveCount(0);
  await sheet.locator('[data-mg-save]').click();
  await expect(sheet).toBeHidden();
  await expect(page.locator('main [data-mg-group="act:meditation"]')).toContainText('Sitzkissen Test');
  expect(errors).toEqual([]);
});
