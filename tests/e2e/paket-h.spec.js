// Paket H «Packen leichter» (Noah 19.10.2026 «1b und a 2b 3a und b … 4a und b möglich 5 a und b»), in German,
// with the fictional data of home0460-fixture.js (clock on Friday 9 October 2026).
// 1. Material › Vorrat: an item with too little stock is under «Nachkaufen»; «Gekauft» takes it off.
// 2. Material › Ausgeliehen: a new lending list for a guest; «Alle zurück» closes it.
// 3. Computer: Material as «Tabelle», two rows ticked, one field «Für alle setzen», «Rückgängig» takes it back.
// 4. Packen (the Packen step): «Vorlesen» with «Nur Knopf»; the big button ticks the item off.
import { test, expect } from '@playwright/test';
import { openHome, homeFixture, day } from './home0460-fixture.js';

const fixture = () => {
  const data = homeFixture();
  data.tables.items.push(
    { id: 'test_data_gtp_gel', name: 'test_data_gtp_ Energie-Gel', category: 'food', weightG: 40, stock: 1, minStock: 4, domains: ['bikepacking'] },
    { id: 'test_data_gtp_riegel', name: 'test_data_gtp_ Riegel', category: 'food', weightG: 50, stock: 6, minStock: 2, expires: day(5), domains: ['bikepacking'] },
  );
  return data;
};

test('Paket H: supplies, lending, table, read aloud', async ({ page, context }, info) => {
  test.setTimeout(120_000);
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('dialog', (d) => d.accept());
  const T = await openHome(page, context, info, { data: fixture() });
  const main = page.locator('main');

  // 1. supplies
  await page.goto('./#/gear/supplies');
  await expect(main.getByRole('heading', { level: 1, name: T('Supplies') })).toBeVisible();
  const buy = main.locator('section[aria-labelledby="buy-h"]');
  await expect(buy.getByText('test_data_gtp_ Energie-Gel')).toBeVisible();
  const soon = main.locator('section[aria-labelledby="soon-h"]');
  await expect(soon.getByText('test_data_gtp_ Riegel')).toBeVisible();
  await buy.getByRole('button', { name: T('Bought') }).first().click();
  await expect(buy.getByText('test_data_gtp_ Energie-Gel')).toHaveCount(0);

  // 2. lending
  await page.goto('./#/gear/lend');
  await expect(main.getByRole('heading', { level: 1, name: T('Lent out') })).toBeVisible();
  await main.getByRole('button', { name: T('New lending list') }).first().click();
  const form = main.locator('form');
  await form.getByLabel(T('Who borrows it')).fill('test_data_gtp_ Gast');
  await form.getByLabel(T('Search in your gear')).fill('Power bank');
  await form.getByRole('checkbox').first().check();
  await form.getByRole('button', { name: T('Save') }).click();
  const card = main.locator('article', { has: page.getByRole('heading', { name: 'test_data_gtp_ Gast' }) });
  await expect(card).toBeVisible();
  await expect(card.getByText(/Power bank/)).toBeVisible();
  await card.getByRole('button', { name: T('All back') }).click();
  await expect(card).toHaveCount(0);
  await expect(main.locator('p.small')).toHaveText(T('{n} list is closed: everything is back.', { n: 1 }));

  // 3. table on the computer
  if (info.project.name === 'desktop') {
    await page.goto('./#/gear');
    await main.getByRole('group', { name: T('Show as') }).getByRole('button', { name: T('Table') }).click();
    const table = main.locator('section.ltab table');
    await expect(table).toBeVisible();
    const rows = table.locator('tbody tr');
    await rows.nth(0).getByRole('checkbox').first().check();
    await rows.nth(1).getByRole('checkbox').first().check();
    const bulk = main.getByRole('region', { name: T('Selected entries') });
    await expect(bulk).toBeVisible();
    await bulk.locator('select').first().selectOption({ label: T('Brand') });
    await bulk.getByRole('textbox').fill('test_data_gtp_ Marke');
    await bulk.getByRole('button', { name: T('Set for all') }).click();
    const marked = () => table.locator('input[type="text"]').evaluateAll((els) => els.filter((e) => e.value === 'test_data_gtp_ Marke').length);
    await expect.poll(marked).toBe(2);
    await page.locator('button.undo').filter({ hasText: T('Undo') }).click();
    await expect.poll(marked).toBe(0);
  }

  // 4. read aloud with the big button
  await page.goto('./#/pack?day');
  const ra = page.getByRole('button', { name: T('Read aloud') }).first(); // in the main bar, next to the ring
  await expect(ra).toBeVisible();
  await ra.click();
  const dlg = page.getByRole('dialog', { name: T('Read aloud') });
  await expect(dlg).toBeVisible();
  await dlg.getByRole('button', { name: T('Button only') }).click();
  const left = dlg.locator('.cnt');
  const before = Number((await left.textContent()).match(/\d+/)[0]);
  await dlg.getByRole('button', { name: T('Packed') }).click();
  await expect(left).toContainText(String(before - 1));
  await dlg.getByRole('button', { name: T('End') }).click();
  await expect(dlg).toHaveCount(0);

  expect(errors).toEqual([]);
});
