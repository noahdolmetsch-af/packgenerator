// «Wochenplan» Teil 4 (Noah 09.11.2026): fixed days with a wish time, moving a unit, «Warum hier?», and a conflict that offers
// two ways (the fix, or leave it). German, phone + desktop, fictional data only, clock fixed (Tuesday 10 Nov 2026).
// WOCHENPLAN_SHOTS=<dir> saves screenshots.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const SHOTS = process.env.WOCHENPLAN_SHOTS || '';

async function shot(page, info, name) {
  if (!SHOTS) return;
  const w = info.project.name === 'phone' ? 390 : 1440;
  await page.evaluate(() => window.scrollTo(0, 0));
  const vp = page.viewportSize();
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: vp.width, height: Math.max(vp.height, h) });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SHOTS}/${name}-${w}.png`, fullPage: true });
  await page.setViewportSize(vp);
}

async function open(page, context) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.setFixedTime(new Date('2026-11-10T09:00:00+01:00'));
  await page.goto('./#/flow/wochenplan');
  await ready(page);
  await page.locator('[data-wochenplan] [data-empty] button').first().click();
  await expect(page.locator('[data-wp-hvalue]')).toHaveText('15 Std');
  return errors;
}

test('Wochenplan: fixed days and the wish time change the week, and Undo takes them back', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const root = page.locator('[data-wochenplan]');
  // the basic plan has tennis fixed on Tuesday, Thursday, Saturday
  for (const d of [1, 3, 5]) await expect(root.locator(`[data-wp-fix="tennis:${d}"]`)).toHaveAttribute('aria-pressed', 'true');
  await expect(root.locator('[data-wp-fix="tennis:2"]')).toHaveAttribute('aria-pressed', 'false');
  await shot(page, info, 'fixtage');
  // Wednesday becomes a fixed tennis day: a fourth unit, at its usual time
  await root.locator('[data-wp-fix="tennis:2"]').click();
  await expect(root.locator('[data-wp-fix="tennis:2"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(root.locator('[data-wp-count="tennis"]')).toHaveText('4');
  await expect(root.locator('[data-day="2"] [data-unit="tennis@2"]')).toBeVisible();
  await expect(root.locator('[data-wp-msg]')).toContainText(T('{what} on {day} is now fixed.').replace('{what}', T('Tennis')).replace('{day}', 'Mittwoch'));
  await root.locator('[data-wp-undo]').click();
  await expect(root.locator('[data-wp-count="tennis"]')).toHaveText('3');
  await expect(root.locator('[data-wp-week] [data-unit="tennis@2"]')).toHaveCount(0);
  // the wish time of the Tuesday unit
  await root.locator('[data-wp-wish="tennis:1"]').selectOption('17:30');
  await expect(root.locator('[data-unit="tennis@1"] time')).toHaveText('17:30');
  // saved: after a reload the same
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-wochenplan] [data-unit="tennis@1"] time')).toHaveText('17:30');
  expect(errors).toEqual([]);
});

test('Wochenplan: move a unit, the week plans anew, Undo and «Back to the suggestion»', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const root = page.locator('[data-wochenplan]');
  await root.locator('[data-wp-move-btn="tennis@1"]').click();
  await expect(root.locator('[data-wp-move="tennis@1"]')).toBeVisible();
  await shot(page, info, 'verschieben');
  await root.locator('[data-wp-move-day="tennis@1"]').selectOption('4');
  await expect(root.locator('[data-day="4"] [data-unit="tennis@1"]')).toBeVisible();
  await expect(root.locator('[data-unit="tennis@1"] .tag')).toHaveText(T('moved'));
  await expect(root.locator('[data-wp-msg]')).toContainText('Verschoben');
  // kept after a reload
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-wochenplan] [data-day="4"] [data-unit="tennis@1"]')).toBeVisible();
  // Undo puts it back on Tuesday (the page was reloaded: the move again, then Undo)
  await page.locator('[data-wochenplan] [data-wp-move-btn="tennis@1"]').click();
  await page.locator('[data-wochenplan] [data-wp-move-time="tennis@1"]').selectOption('18:00');
  await expect(page.locator('[data-wochenplan] [data-unit="tennis@1"] time')).toHaveText('18:00');
  await page.locator('[data-wochenplan] [data-wp-undo]').click();
  await expect(page.locator('[data-wochenplan] [data-unit="tennis@1"] time')).not.toHaveText('18:00');
  await expect(page.locator('[data-wochenplan] [data-day="4"] [data-unit="tennis@1"]')).toBeVisible();
  // back on the suggestion: Tuesday again, no «moved»
  await page.locator('[data-wochenplan] [data-wp-why-btn="tennis@1"]').click();
  await page.locator('[data-wochenplan] [data-wp-unmove="tennis@1"]').click();
  await expect(page.locator('[data-wochenplan] [data-day="1"] [data-unit="tennis@1"]')).toBeVisible();
  await expect(page.locator('[data-wochenplan] [data-unit="tennis@1"] .tag')).toHaveText(T('fixed'));
  expect(errors).toEqual([]);
});

test('Wochenplan: «Why here?» says the reason, and next week can be moved, the example week not', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const root = page.locator('[data-wochenplan]');
  await root.locator('[data-wp-why-btn="tennis@1"]').click();
  await expect(root.locator('[data-wp-why="tennis@1"]')).toHaveText(T('A fixed day you chose.'));
  // a free unit: its reason starts «Here, because …» or says the best free place
  await root.locator('[data-wp-why-btn="bikeOut#1"]').click();
  await expect(root.locator('[data-wp-why="bikeOut#1"]')).toHaveText(/Hier, weil|Der beste freie Platz|Intervalle hier/);
  await expect(root.locator('[data-wp-why]')).toHaveCount(1); // one box open at a time
  await shot(page, info, 'warum-hier');
  // meditation and stretching have no buttons
  await expect(root.locator('[data-unit^="med@"] [data-wp-why-btn]')).toHaveCount(0);
  // next week
  await root.locator('button, [role="radio"]', { hasText: T('Next week') }).first().click();
  await expect(root.locator('[data-wp-move-btn="tennis@1"]')).toBeVisible();
  // the other season shows an example week: no moving
  await root.locator('button, [role="radio"]', { hasText: T('Summer') }).first().click();
  await expect(root.locator('[data-wp-week] [data-unit]').first()).toBeVisible();
  await expect(root.locator('[data-wp-move-btn]')).toHaveCount(0);
  await expect(root.locator('[data-wp-why-btn]').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('Wochenplan: a conflict offers two ways, the fix or leave it', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const root = page.locator('[data-wochenplan]');
  // tennis on Tuesday moved onto the yoga of Monday 9:30: they overlap
  await root.locator('[data-wp-move-btn="tennis@1"]').click();
  await root.locator('[data-wp-move-day="tennis@1"]').selectOption('0');
  await root.locator('[data-wp-move-time="tennis@1"]').selectOption('09:30');
  const warn = root.locator('[data-wp-warning="overlap"]').first();
  await expect(warn).toBeVisible();
  await expect(warn).toContainText(T('You have the choice:'));
  await shot(page, info, 'konflikt');
  // way 1: the moved unit goes back on the suggestion
  await warn.locator('[data-wp-way]').click();
  await expect(root.locator('[data-wp-warning="overlap"]')).toHaveCount(0);
  await expect(root.locator('[data-day="1"] [data-unit="tennis@1"]')).toBeVisible();
  // way 2: move it again (the move box stayed open) and leave the conflict as it is
  await expect(root.locator('[data-wp-move="tennis@1"]')).toBeVisible();
  await root.locator('[data-wp-move-day="tennis@1"]').selectOption('0');
  await root.locator('[data-wp-move-time="tennis@1"]').selectOption('09:30');
  const again = root.locator('[data-wp-warning="overlap"]').first();
  await again.locator('[data-wp-leave]').click();
  await expect(again).toContainText(T('left as is'));
  await expect(again.locator('[data-wp-way]')).toHaveCount(0);
  // nothing was changed by leaving it
  await expect(root.locator('[data-day="0"] [data-unit="tennis@1"]')).toBeVisible();
  expect(errors).toEqual([]);
});
