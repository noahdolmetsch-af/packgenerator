// Material › Vorrat (Durchklick Etappe 2, Frage 4a und Design b, Noah 05.11.2026): «Auch als Vorrat führen» is a choice list of
// all items that are no supply yet. With many items it has a search field; the list shows what fits. Fictional data
// (home0460-fixture plus 30 invented items), German, phone and computer.
import { test, expect } from './clock.js';
import { openHome, homeFixture } from './home0460-fixture.js';

const extra = Array.from({ length: 30 }, (_, n) => ({ id: `test_data_gtp_vs${n}`, name: `test_data_gtp_ Ding ${String(n).padStart(2, '0')}`, category: 'hyg', weightG: 80, domains: ['bikepacking'] }));

test('Vorrat: the choice list of items has a search field, narrows, and adds the chosen item', async ({ page, context }, info) => {
  test.setTimeout(120_000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const data = homeFixture();
  data.tables.items.push(...extra);
  const T = await openHome(page, context, info, { data });
  await page.goto('./#/gear/supplies');
  const pick = page.locator('.add .pick');
  await expect(pick).toBeVisible();
  const search = pick.locator('[data-ss-search]');
  await expect(search).toBeVisible();
  const select = pick.locator('[data-ss-select]');
  const all = await select.locator('option').count();
  expect(all, 'many items in the list').toBeGreaterThan(20);
  // the search narrows the list (one item and the empty choice)
  await search.fill('ding 17');
  await expect(select.locator('option')).toHaveCount(2);
  await expect(select.locator('option').nth(1)).toHaveText(/Ding 17/);
  // a word that fits nothing says so
  await search.fill('zzzz');
  await expect(pick.locator('[data-ss-none]')).toHaveText(T('No item found.'));
  // choose and add
  await search.fill('Ding 17');
  await select.selectOption({ label: 'test_data_gtp_ Ding 17' });
  await pick.locator('xpath=following-sibling::button').click();
  await expect(page.getByText(T('"{name}" is now a supply.').replace('{name}', 'test_data_gtp_ Ding 17'))).toBeVisible();
  // no sideways scroll
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});
