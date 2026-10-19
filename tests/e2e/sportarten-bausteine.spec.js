// Paket O «Sportarten» (Noah 19.10.2026 «1b … 2a und b … individuelles tracking … 3 a und b»), German UI:
// - Aktiv › Sportarten: the mosaic and every sport, reorderable with arrows;
// - one sport (Gym): the basic blocks, its extra block «Trainingspläne», weather off indoors;
// - «Verlauf und Fortschritt»: an own measure (Beinpresse in kg), two values, the best with a star, the change;
// - «Bausteine anpassen»: switch a block off, add an own block, delete it and take it back with Undo;
//   the colour of the sport is saved.
// Fictional data only (test_data_gtp_); nothing leaves the preview server.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { BLOCK_NAMES } from '../../src/lib/sportsbase.js';
import { settle } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const MEASURE = 'test_data_gtp_ Beinpresse';
const OWN = 'test_data_gtp_ Aufwaermen';
const GYM = '#/flow/sport/act%3Agym';

const cfg = (page) =>
  page.evaluate(() => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction('settings').objectStore('settings').get('sportsCfg');
      q.onsuccess = () => { r.result.close(); ok(q.result?.value ?? {}); };
    };
  }));

test.beforeEach(async ({ page, context }) => {
  page.on('dialog', (d) => { throw new Error(`browser dialog: ${d.message()}`); });
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  await settle(page);
});

test('the hub lists every sport with the mosaic, and the order changes with the arrows', async ({ page }) => {
  await page.goto('./#/flow/sports');
  await expect(page.getByRole('heading', { level: 1, name: T('Sports|page') })).toBeVisible();
  await expect(page.locator('[data-mosaic]')).toBeVisible();
  const list = page.locator('[data-sport-list] > li');
  await expect(list.first()).toBeVisible();
  const first = await list.nth(0).getAttribute('data-sport');
  const second = await list.nth(1).getAttribute('data-sport');
  const name = (await list.nth(0).locator('.srow b').innerText()).trim();
  await page.getByRole('button', { name: T('Move {name} down', { name }) }).click();
  await expect(list.nth(0)).toHaveAttribute('data-sport', second);
  await expect(list.nth(1)).toHaveAttribute('data-sport', first);
  expect((await cfg(page))._order.slice(0, 2)).toEqual([second, first]);
});

test('Gym: the basic blocks, training plans, and own progress with the best value', async ({ page }) => {
  await page.goto(`./${GYM}`);
  for (const k of ['gear', 'pack', 'log', 'goals', 'care', 'next', 'plans']) {
    await expect(page.locator(`[data-block="${k}"]`), k).toBeVisible();
  }
  await expect(page.locator('[data-block="weather"]')).toHaveCount(0); // indoors: weather off by default
  await expect(page.getByRole('heading', { name: T(BLOCK_NAMES.log) })).toBeVisible();

  const log = page.locator('[data-block="log"]');
  await log.locator('[data-add-measure]').click();
  const form = log.locator('[data-add-measure-form]');
  await form.getByLabel(T('What do you measure?')).fill(MEASURE);
  await form.getByLabel(T('Unit')).selectOption('kg');
  await form.getByRole('button', { name: T('Add') }).click();

  const card = log.locator(`[data-measure="${MEASURE}"]`);
  await expect(card).toBeVisible();
  const value = card.getByLabel(T('Value of {name}', { name: MEASURE }));
  await value.fill('100');
  await card.locator('[data-quick]').getByRole('button', { name: T('Save') }).click();
  await expect(card.locator('[data-last]')).toContainText('100');
  // the quick entry keeps the last value; + raises it
  await expect(value).toHaveValue('100');
  await card.getByRole('button', { name: T('More'), exact: true }).click();
  await expect(value).not.toHaveValue('100');
  await value.fill('110');
  await card.locator('[data-quick]').getByRole('button', { name: T('Save') }).click();
  await expect(card.locator('[data-last]')).toContainText('110');
  await expect(card.locator('[data-best]')).toContainText('110');
  await expect(card.getByRole('img', { name: T('Curve of {name}: {n} values', { name: MEASURE, n: 2 }) })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('Adjust blocks: switch off, own block with delete and Undo, colour', async ({ page }) => {
  await page.goto(`./${GYM}`);
  await page.locator('[data-adjust]').click();
  const edit = page.locator('[data-block-edit]');
  await expect(edit).toBeVisible();
  // nothing sticks out past the right edge (phone too)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await edit.locator('[data-toggle="care"]').click();
  await expect(page.locator('[data-block="care"]')).toHaveCount(0);
  await edit.locator('[data-toggle="care"]').click();
  await expect(page.locator('[data-block="care"]')).toBeVisible();

  await edit.locator('[data-add-own]').click();
  const own = edit.locator('[data-own-form]');
  await own.getByLabel(T('Name')).fill(OWN);
  await own.getByRole('button', { name: T('Add') }).click();
  await expect(page.getByRole('heading', { level: 2, name: OWN })).toBeVisible();

  await edit.getByRole('button', { name: T('Delete «{name}»', { name: OWN }) }).click();
  await page.getByTestId('ask-delete').getByRole('button', { name: T('Delete'), exact: true }).click();
  await expect(page.getByRole('heading', { level: 2, name: OWN })).toHaveCount(0);
  await page.getByRole('button', { name: T('Undo') }).click();
  await expect(page.getByRole('heading', { level: 2, name: OWN })).toBeVisible();

  const pick = edit.locator('[data-colors] input[type=radio]:not(:checked)').first();
  const hex = await pick.getAttribute('value');
  await pick.check();
  await expect.poll(async () => (await cfg(page))['act:gym']?.color).toBe(hex);
});
