// «Wochenplan» Teil 5 (Noah 09.11.2026): the week star, «Let go», and a lighter / ski tour / rainy week.
// German, phone + desktop, fictional data only, clock fixed (Tuesday 10 Nov 2026). WOCHENPLAN_SHOTS=<dir> saves screenshots.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const fill = (en, vars) => Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, v), T(en));
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
const mainUnits = (page) => page.locator('[data-wp-week] [data-unit]:not(.quiet)');

test('Wochenplan: the week star comes when every unit is ticked, and counts in Meilensteine', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const root = page.locator('[data-wochenplan]');
  const total = await mainUnits(page).count();
  expect(total).toBeGreaterThan(5);
  await expect(root.locator('[data-wp-left]')).toContainText(fill('Still {n} units until the week star.', { n: total }));
  for (let i = 0; i < total; i++) {
    await mainUnits(page).nth(i).locator('input.tick').check();
    await expect(root.locator('[data-wp-done]')).toHaveText(fill('{a} of {b} units', { a: i + 1, b: total }));
  }
  await expect(root.locator('[data-wp-star]')).toContainText(T('Week star reached.'));
  await shot(page, info, 'wochenstern');
  // the star counts in Meilensteine (a data milestone of the area «Everyday»)
  await root.locator('[data-wp-to-milestones]').click();
  await expect(page).toHaveURL(/#\/flow\/milestones/);
  await ready(page);
  await expect(page.getByText(T('Weeks with a star')).first()).toBeVisible();
  await shot(page, info, 'meilensteine');
  expect(errors).toEqual([]);
});

test('Wochenplan: let a unit go on purpose, and the star counts without it', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const root = page.locator('[data-wochenplan]');
  const total = await mainUnits(page).count();
  const first = mainUnits(page).first();
  const id = await first.getAttribute('data-unit');
  await root.locator(`[data-wp-letgo="${id}"]`).click();
  await expect(root.locator(`[data-unit="${id}"] .tag`).first()).toContainText(T('let go'));
  await expect(root.locator('[data-wp-done]')).toHaveText(fill('{a} of {b} units', { a: 0, b: total - 1 }));
  await expect(root.locator(`[data-wp-tick="${id}"]`)).toBeDisabled();
  await shot(page, info, 'loslassen');
  for (let i = 1; i < total; i++) await mainUnits(page).nth(i).locator('input.tick').check();
  await expect(root.locator('[data-wp-star]')).toBeVisible();
  // counted again: the star is gone
  await root.locator(`[data-wp-letgo="${id}"]`).click();
  await expect(root.locator('[data-wp-star]')).toHaveCount(0);
  await expect(root.locator('[data-wp-done]')).toHaveText(fill('{a} of {b} units', { a: total - 1, b: total }));
  // kept after a reload
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-wochenplan] [data-wp-done]')).toHaveText(fill('{a} of {b} units', { a: total - 1, b: total }));
  expect(errors).toEqual([]);
});

test('Wochenplan: a lighter week, a ski tour week and a rainy week, each with Undo', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const root = page.locator('[data-wochenplan]');
  const total = await mainUnits(page).count();
  // lighter: 60 percent of 15 hours = 9 hours, fewer units, the plan says so
  await root.locator('[data-wp-mode="light"]').click();
  await expect(root.locator('[data-wp-mode="light"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(root.locator('[data-wp-hint]')).toContainText(fill('A lighter week: {n} h instead of {m} h. Plus and minus change your normal plan.', { n: 9, m: 15 }));
  expect(await mainUnits(page).count()).toBeLessThan(total);
  await expect(root.locator('[data-wp-hvalue]')).toHaveText('15 Std'); // the goals stay
  await shot(page, info, 'leichter');
  await root.locator('[data-wp-undo]').click();
  await expect(root.locator('[data-wp-mode="light"]')).toHaveAttribute('aria-pressed', 'false');
  expect(await mainUnits(page).count()).toBe(total);
  // ski tour: the tour is there, cycling and running are replaced
  await root.locator('[data-wp-mode="ski"]').click();
  await expect(root.locator('[data-wp-week] [data-unit="ski"], [data-wp-week] [data-unit^="ski"]').first()).toBeVisible();
  await expect(root.locator('[data-wp-week] [data-unit^="bikeOut"]')).toHaveCount(0);
  await expect(root.locator('[data-wp-week] [data-unit^="runOut"]')).toHaveCount(0);
  await expect(root.locator('[data-wp-notes] summary')).toBeVisible();
  await shot(page, info, 'skitour');
  await root.locator('[data-wp-mode="ski"]').click();
  await expect(root.locator('[data-wp-week] [data-unit^="bikeOut"]')).toHaveCount(1);
  // rainy: the outdoor ride moves indoors
  await root.locator('[data-wp-mode="rain"]').click();
  await expect(root.locator('[data-wp-week] [data-unit="bikeOut#1"] .t')).toHaveText(T('Bike indoors'));
  // kept after a reload, and next week has its own switches
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-wochenplan] [data-wp-mode="rain"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-wochenplan] button, [data-wochenplan] [role="radio"]', { hasText: T('Next week') }).first().click();
  await expect(page.locator('[data-wochenplan] [data-wp-mode="rain"]')).toHaveAttribute('aria-pressed', 'false');
  expect(errors).toEqual([]);
});
