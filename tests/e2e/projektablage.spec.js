// Paket P7 «Projekt-Ablage» (Noah 21.10.2026 «6a», mockups design/projekt-ablage A–C): Ich › Projekt-Ablage with the
// head (ideas live), «Für dich jetzt» (own points: add, change, move, delete), «Der Weg», the folded idea board by goal
// and the releases. German UI, fictional data (test_data_gtp_), the clock on Fri 9.10.2026 09:00.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

const noSideScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

test('Projekt-Ablage: head, own points, the way, idea board and releases', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info);
  await page.goto('./#/me');
  await page.locator('a[data-row="next"]').click();
  const root = page.locator('[data-page="projekt-ablage"]');
  await expect(root.locator('h1')).toHaveText(T('Project shelf'));
  await expect(root.locator('[data-pa-live]')).toContainText(/\d+/);
  await expect(root.locator('[data-way="now"]')).toHaveCount(1);
  // own points
  const fy = root.locator('[data-for-you]');
  for (const txt of ['test_data_gtp_ Erstens', 'test_data_gtp_ Zweitens']) {
    await fy.locator('[data-for-you-add]').click();
    await fy.locator('[data-for-you-text]').fill(txt);
    await fy.locator('[data-for-you-save]').click();
  }
  const pts = fy.locator('[data-for-you-point]');
  await expect(pts).toHaveCount(2);
  await fy.getByRole('button', { name: T('Move {name} up', { name: 'test_data_gtp_ Zweitens' }) }).click();
  await expect(pts.first()).toContainText('test_data_gtp_ Zweitens');
  await pts.first().locator('[data-for-you-edit]').click();
  await fy.locator('[data-for-you-edit-text]').fill('test_data_gtp_ Zwei');
  await fy.locator('[data-for-you-edit-text]').press('Enter');
  await expect(pts.first()).toContainText('test_data_gtp_ Zwei');
  await pts.last().locator('[data-for-you-delete]').click();
  await page.getByTestId('ask-delete').getByRole('button', { name: T('Delete'), exact: true }).click();
  await expect(pts).toHaveCount(1);
  // the idea board, filtered by a goal
  const ideas = root.locator('[data-pa-fold="ideas"]');
  await ideas.locator('summary').click();
  const board = ideas.locator('[data-idea-board]');
  await expect(board.locator('[data-idea-col]')).toHaveCount(4);
  const live = board.locator('[data-idea-col="live"] [data-idea]');
  await expect(live).toHaveCount(6);
  await board.locator('[data-idea-more="live"]').click();
  expect(await live.count()).toBeGreaterThan(6);
  const all = await live.count();
  await board.locator('[data-idea-goal="2"]').click();
  await expect(board.locator('[data-idea-goal="2"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await live.count()).toBeLessThan(all);
  // the releases
  const rel = root.locator('[data-pa-fold="releases"]');
  await rel.locator('summary').click();
  await expect(rel.locator('[data-release]').first()).toBeVisible();
  await expect(rel.locator('a[href="#/me/news"]')).toBeVisible();
  expect(await noSideScroll(page)).toBe(true);
  expect(errors).toEqual([]);
});
