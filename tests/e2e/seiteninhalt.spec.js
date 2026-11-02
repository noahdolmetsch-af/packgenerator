// «Wegweiser statt Katalog» PR 11 (Noah 01.11.2026 «1-5a», «einverstanden»): on the pages of Lust the card «What you can do
// here» lists the functions of the page with what they are for; «How it works» opens steps and example; × folds it to one line
// that stays folded after a reload. Fictional data (test_data_gtp_).
import { test, expect } from './clock.js';
import { openHome, tr } from './home0460-fixture.js';

const T = tr('de');
const tap = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());

test('Dreams shows what you can do here, opens how it works and folds to one line', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info);
  await page.goto('./#/trips/dreams');
  const card = page.locator('[data-seiteninhalt]');
  await expect(card).toContainText(T('What you can do here'));
  const first = card.locator('[data-seiteninhalt-item]').first();
  await expect(first.locator('.si-what')).not.toBeEmpty();
  await tap(first.getByRole('button', { name: T('How it works') }), info);
  await expect(card.locator('[data-seiteninhalt-how]').first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  await tap(card.locator('[data-seiteninhalt-fold]'), info);
  await expect(page.locator('[data-seiteninhalt-line]')).toBeVisible();
  await page.reload();
  await expect(page.locator('[data-seiteninhalt-line]')).toBeVisible();
  await expect(page.locator('[data-seiteninhalt]')).toHaveCount(0);
  // never on Today
  await page.goto('./#/');
  await expect(page.locator('[data-seiteninhalt], [data-seiteninhalt-line]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
