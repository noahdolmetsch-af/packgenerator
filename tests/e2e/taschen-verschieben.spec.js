// «332 sichtbar» (Noah 26.10.2026 «alle taschen nebeneinander: per drag and drop items von einem in andere
// taschen verschieben»), German UI, fictional data only (test_data_gtp_):
// - on a big screen, in «Alle Taschen nebeneinander», an item can be dragged into another bag;
// - the arrows button next to it does the same without a mouse (rule: arrows and drag).
// - an empty bag stays as a column to drag into (Noah 26.10.2026 «3»: leere Taschen nehmen Teile auf).
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

// The empty bag stands far below the item: start the drag on the item first, then scroll and drop
// (dragTo scrolls before the drag starts, so it would pick up whatever item is then under the mouse).
async function dragFar(page, from, to) {
  await from.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  const a = await from.boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2 + 12, a.y + a.height / 2 + 12, { steps: 4 });
  await to.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  const b = await to.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
  await page.mouse.up();
}

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
  const moved = board.locator(`[data-board-bag="${keyB}"] [data-board-item="${id}"]`);
  await moved.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await moved.dragTo(board.locator(`[data-board-bag="${keyA}"] .bchead`));
  await expect(board.locator(`[data-board-bag="${keyA}"] [data-board-item="${id}"]`)).toHaveCount(1);

  // 3. an empty bag stays as a place to drag into: empty the bag with the fewest items, then fill it again
  const counts = [];
  for (let i = 0; i < (await cols.count()); i++) counts.push({ key: await cols.nth(i).getAttribute('data-board-bag'), n: await cols.nth(i).locator('[data-board-item]').count() });
  const small = counts.filter((c) => c.n > 0).sort((a, b) => a.n - b.n)[0];
  const other = counts.find((c) => c.key !== small.key).key;
  for (let i = 0; i < small.n; i++) {
    const it = board.locator(`[data-board-bag="${small.key}"] [data-board-item]`).first();
    await it.locator('[data-board-move]').click();
    await it.locator(`[data-board-move-to="${other}"]`).click();
  }
  const empty = board.locator(`[data-board-empty][data-board-bag="${small.key}"]`);
  await expect(empty).toBeVisible();
  await expect(empty).toContainText(T('Still empty: drag an item here, or use the arrows next to an item.'));
  const back = board.locator(`[data-board-bag="${other}"] [data-board-item]`).first();
  const backId = await back.getAttribute('data-board-item');
  await dragFar(page, back, empty);
  await expect(board.locator(`[data-board-bag="${small.key}"] [data-board-item="${backId}"]`)).toHaveCount(1);
  await expect(board.locator(`[data-board-empty][data-board-bag="${small.key}"]`)).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});
