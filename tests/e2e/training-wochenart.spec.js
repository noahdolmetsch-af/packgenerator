// V4b2 (Noah 22.11.2026 «1a»): one row on top of Training › Woche: «Woche vorschlagen», «Leichter», «Härter», «Regenwoche»,
// «Skitour-Woche». The switches are the ones of the weekly plan; a week is lighter or harder, never both.
// German, phone + desktop, fictional data only, clock fixed (Tuesday 10 Nov 2026).
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');

async function open(page, context, hash) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.setFixedTime(new Date('2026-11-10T09:00:00+01:00'));
  await page.goto(hash);
  await ready(page);
  return errors;
}

test('Training: without a weekly plan the row offers the suggestion and the way to the plan', async ({ page, context }) => {
  const errors = await open(page, context, './#/flow/training');
  const row = page.locator('[data-week-modes]');
  await expect(row.locator('[data-wm-suggest]')).toHaveText(T('Suggest the week'));
  await expect(row.locator('[data-wm-mode]')).toHaveCount(0);
  await row.locator('[data-wm-suggest]').click();
  await expect(page.locator('[data-suggest]')).toBeVisible();
  await expect(row.locator('[data-wm-plan]')).toHaveAttribute('href', '#/flow/wochenplan');
  expect(errors).toEqual([]);
});

test('Training: «Härter» and «Leichter» switch the week, never both, and the weekly plan shows the same', async ({ page, context }) => {
  const errors = await open(page, context, './#/flow/wochenplan');
  await page.locator('[data-wochenplan] [data-empty] button').first().click();
  await expect(page.locator('[data-wp-hvalue]')).toHaveText('15 Std');
  await page.goto('./#/flow/training');
  await ready(page);
  const row = page.locator('[data-week-modes]');
  await expect(row.locator('[data-wm-mode]')).toHaveCount(4);
  await expect(row.locator('[data-wm-mode="hard"]')).toHaveAttribute('aria-pressed', 'false');
  await row.locator('[data-wm-mode="hard"]').click();
  await expect(row.locator('[data-wm-mode="hard"]')).toHaveAttribute('aria-pressed', 'true');
  await row.locator('[data-wm-mode="light"]').click();
  await expect(row.locator('[data-wm-mode="light"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(row.locator('[data-wm-mode="hard"]')).toHaveAttribute('aria-pressed', 'false');
  await row.locator('[data-wm-mode="hard"]').click();
  await expect(row.locator('[data-wm-mode="hard"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(row.locator('[data-wm-mode="light"]')).toHaveAttribute('aria-pressed', 'false');
  // the weekly plan shows a harder week: 120 percent of 15 h
  await page.goto('./#/flow/wochenplan');
  await ready(page);
  await expect(page.locator('[data-wp-mode="hard"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-wp-hint]')).toContainText('18');
  // a tap again takes it back
  await page.goto('./#/flow/training');
  await ready(page);
  await row.locator('[data-wm-mode="hard"]').click();
  await expect(row.locator('[data-wm-mode="hard"]')).toHaveAttribute('aria-pressed', 'false');
  expect(errors).toEqual([]);
});
