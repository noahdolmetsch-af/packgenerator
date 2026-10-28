// «Pfad auf jeder Seite» (Noah 28.10.2026 «1a»): a quiet path line above every page, built from the place
// and tab; pages with their own path keep theirs (no second line); switched off in Ich › Darstellung it goes.
// German UI, no network, fictional data only (an empty app).
import { test, expect } from './clock.js';
import { ready } from './settle.js';

async function open(page, context, hash) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto(`./${hash}`);
  await ready(page);
}

test('a page with a tab shows Place › Tab › Title and the first steps are links', async ({ page, context }) => {
  await open(page, context, '#/notes');
  const line = page.locator('[data-pathline]');
  await expect(line).toBeVisible();
  await expect(line.locator('a').first()).toHaveAttribute('href', '#/week');
  await expect(line.locator('[aria-current="page"]')).toBeVisible();
});

test('Heute has no path line; a page with its own path keeps only that one', async ({ page, context }) => {
  await open(page, context, '#/');
  await expect(page.locator('[data-pathline]')).toHaveCount(0);
  await page.goto('./#/me/look');
  await ready(page);
  await expect(page.locator('main .crumbs, main .pcrumbs').first()).toBeVisible();
  await expect(page.locator('[data-pathline]')).toBeHidden();
});

test('the switch in Darstellung removes the line and it stays off after a reload', async ({ page, context }) => {
  await open(page, context, '#/notes');
  await expect(page.locator('[data-pathline]')).toBeVisible();
  await page.goto('./#/me/look');
  await ready(page);
  await page.locator('[data-ops] input[data-op="path"]').uncheck();
  await page.goto('./#/notes');
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-pathline]')).toHaveCount(0);
});
