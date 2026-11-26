// «Fokus Intervalle / Kraft» as a kind of week (Noah 23.11.2026 «3a»): two more switches in the weekly plan, exclusive with each other,
// kept per week, with Undo; the units change, the hours stay. German, phone + desktop, fictional data only, clock fixed (Tuesday 10 Nov 2026).
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');

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

test('Wochenplan: the focus intervals marks two bike units, the focus strength gives three gym sessions, never both, with Undo', async ({ page, context }) => {
  const errors = await open(page, context);
  const root = page.locator('[data-wochenplan]');
  const week = root.locator('[data-wp-week]');
  const gyms = () => week.locator('[data-unit^="gym"]:not(.quiet)');
  const tagged = () => week.locator('[data-unit] .tag', { hasText: T('intervals') });
  await expect(root.locator('[data-wp-mode="hit"]')).toHaveText(T('Focus intervals'));
  await expect(root.locator('[data-wp-mode="kraft"]')).toHaveText(T('Focus strength'));
  await expect(tagged()).toHaveCount(1);
  expect(await gyms().count()).toBe(2);

  await root.locator('[data-wp-mode="hit"]').click();
  await expect(root.locator('[data-wp-mode="hit"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(root.locator('[data-wp-mode-hint="hit"]')).toContainText(T('Two bike units are intervals, the others easy. Small units make room, your hours stay.'));
  await expect(tagged()).toHaveCount(2);
  await expect(root.locator('[data-wp-hvalue]')).toHaveText('15 Std'); // the goals stay

  // strength takes intervals away: never both
  await root.locator('[data-wp-mode="kraft"]').click();
  await expect(root.locator('[data-wp-mode="kraft"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(root.locator('[data-wp-mode="hit"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(tagged()).toHaveCount(0);
  expect(await gyms().count()).toBe(3);

  // Undo takes the last switch back (the intervals come back)
  await root.locator('[data-wp-undo]').click();
  await expect(root.locator('[data-wp-mode="kraft"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(root.locator('[data-wp-mode="hit"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(tagged()).toHaveCount(2);
  expect(await gyms().count()).toBe(2);

  // kept after a reload; next week has its own switches
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-wochenplan] [data-wp-mode="hit"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-wochenplan] button, [data-wochenplan] [role="radio"]', { hasText: T('Next week') }).first().click();
  await expect(page.locator('[data-wochenplan] [data-wp-mode="hit"]')).toHaveAttribute('aria-pressed', 'false');
  expect(errors).toEqual([]);
});

test('Wochenplan: in a ski tour week the focus does not apply and the page says so', async ({ page, context }) => {
  const errors = await open(page, context);
  const root = page.locator('[data-wochenplan]');
  await root.locator('[data-wp-mode="kraft"]').click();
  await root.locator('[data-wp-mode="ski"]').click();
  await expect(root.locator('[data-wp-focus-ski]')).toHaveText(T('In a ski tour week the focus does not apply.'));
  await expect(root.locator('[data-wp-week] [data-unit^="gym"]:not(.quiet)')).toHaveCount(2);
  expect(errors).toEqual([]);
});
