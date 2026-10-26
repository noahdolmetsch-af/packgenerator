// «332 sichtbar» (Noah 26.10.2026 «alle taschen nebeneinander: per drag and drop items von einem in andere
// taschen verschieben»), German UI, fictional data only (test_data_gtp_):
// - on a big screen, in «Alle Taschen nebeneinander», an item can be dragged into another bag;
// - the arrows button next to it does the same without a mouse (rule: arrows and drag).
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const FIX = fileURLToPath(new URL('../fixtures/gesamttest/test_data_gtp_daten.json', import.meta.url));
const PACKING = 'test_data_gtp_trip27';

test('Packen side by side: move an item into another bag by drag and by the arrows', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.clock.setFixedTime(new Date('2026-10-12T10:00:00+02:00'));
  await page.goto('./');
  await importAndSettle(page, FIX);
  await page.evaluate((x) => {
    localStorage.setItem('pack.currentTrip', x);
    localStorage.setItem('pack-side-by-side', '1');
  }, PACKING);
  await page.goto('./#/pack?day');
  await page.reload();
  await expect(page.getByRole('region', { name: T('Bags'), exact: true })).toBeVisible();
  if (info.project.name === 'phone') {
    // the side-by-side board is only on a big screen
    await expect(page.locator('[data-pack-board]')).toHaveCount(0);
    return;
  }
  const board = page.locator('[data-pack-board]');
  if (!(await board.isVisible().catch(() => false))) await page.locator('[data-pack-side]').click();
  await expect(board).toBeVisible();
  await expect(board).toContainText(T('drag an item into another bag, or use the arrows next to it'));
  const cols = board.locator('[data-board-bag]:not([data-board-bag="ready"])');
  expect(await cols.count()).toBeGreaterThan(1);
  const keyA = await cols.nth(0).getAttribute('data-board-bag');
  const keyB = await cols.nth(1).getAttribute('data-board-bag');

  // 1. with the arrows: the first item of bag A goes to bag B
  const item = cols.nth(0).locator('[data-board-item]').first();
  const id = await item.getAttribute('data-board-item');
  await item.locator('[data-board-move]').click();
  await item.locator(`[data-board-move-to="${keyB}"]`).click();
  await expect(board.locator(`[data-board-bag="${keyB}"] [data-board-item="${id}"]`)).toHaveCount(1);
  await expect(board.locator(`[data-board-bag="${keyA}"] [data-board-item="${id}"]`)).toHaveCount(0);

  // 2. by drag: it goes back to bag A
  await board.locator(`[data-board-item="${id}"]`).dragTo(board.locator(`[data-board-bag="${keyA}"]`));
  await expect(board.locator(`[data-board-bag="${keyA}"] [data-board-item="${id}"]`)).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});
