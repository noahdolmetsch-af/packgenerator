// «Packliste aufräumen» (Noah 21.10.2026 «5a»), in German, with the fictional data of home0460-fixture.js.
// Bausteine › «Aufräumen»: the suggestion «Immer dabei», a thing added from the search and moved up with the
// arrow, «Übernehmen» writes it, «Rückgängig» takes it back. No horizontal scrolling.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

const table = (page, name) =>
  page.evaluate((n) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(n).objectStore(n).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);
const rules = async (page) => (await table(page, 'settings')).find((s) => s.key === 'pack-rules')?.value ?? null;
const std = async (page, id) => {
  const i = (await table(page, 'items')).find((x) => x.id === id);
  return !!(i?.sets?.includes('standard') || i?.role === 'standard' || i?.always);
};

test('Packliste aufraeumen: suggestion, add, order, apply, undo', async ({ page, context }, info) => {
  test.setTimeout(120_000);
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  const T = await openHome(page, context, info);
  const main = page.locator('main');

  await page.goto('./#/blocks');
  await main.getByRole('link', { name: T('Tidy up') }).click();
  await expect(main.getByRole('heading', { level: 1, name: T('Tidy up the packing list') })).toBeVisible();

  // 1. the suggestion: what fits Noah's order from the own things (rain jacket, bike computer)
  const box = main.locator('[data-tidy="std"]');
  const rows = box.locator('ol.order > li');
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText('Rain jacket');
  await expect(rows.nth(1)).toContainText('Bike computer');
  await expect(box.locator('[data-tidy="left"] summary')).toHaveText(T('No longer always with you: {n} things').replace('{n}', '8'));

  // 2. add a thing from the search and move it up one place
  await box.getByRole('searchbox').fill('Multi');
  await box.getByRole('button', { name: 'Multi tool' }).click();
  await expect(rows).toHaveCount(3);
  await box.getByRole('button', { name: T('Move {name} up').replace('{name}', 'Multi tool') }).click();
  await expect(rows.nth(1)).toContainText('Multi tool');

  // Repair stays a button on a day ride; the three steps of cold carry Noah's limits
  await expect(main.locator('[data-tidy="day"]').getByRole('checkbox', { name: T('Repair|block') })).toBeChecked();
  await expect(main.locator('[data-step="cold"] input[type="number"]')).toHaveValue('12');
  await expect(main.locator('[data-step="coldHands"] input[type="number"]')).toHaveValue('8');
  await expect(main.locator('[data-step="coldLayers"] input[type="number"]')).toHaveValue('4');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);

  // 3. apply: written at once, Undo offered
  await main.getByRole('button', { name: T('Apply') }).click();
  await expect.poll(async () => (await rules(page))?.stdOrder).toEqual(['RA01', 'TO01', 'EL01']);
  expect((await rules(page)).dayOff).toEqual(['repair']);
  expect(await std(page, 'EL02')).toBe(false);
  expect(await std(page, 'TO01')).toBe(true);

  // 4. undo: everything as before
  await page.locator('button.undo').filter({ hasText: T('Undo') }).click();
  await expect.poll(() => rules(page)).toBeNull();
  expect(await std(page, 'EL02')).toBe(true);
  expect(errors).toEqual([]);
});
