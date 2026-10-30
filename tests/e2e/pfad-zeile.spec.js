// «Pfad auf jeder Seite» (Noah 28.10.2026 «1a»): a quiet path line above every page, built from the place
// and tab; pages with their own path keep theirs (no second line); switched off in Ich › Darstellung it goes.
// German UI, no network, fictional data only (an empty app).
import { test, expect } from './clock.js';
import { ready } from './settle.js';
import { openHome } from './home0460-fixture.js';

async function open(page, context, hash) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto(`./${hash}`);
  await ready(page);
}

test('Planen Woche shows Place, Tab and Title and the first steps are links', async ({ page, context }) => {
  await open(page, context, '#/week');
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
  await open(page, context, '#/week');
  await expect(page.locator('[data-pathline]')).toBeVisible();
  await page.goto('./#/me/look');
  await ready(page);
  await page.locator('[data-ops] input[data-op="path"]').uncheck();
  await page.goto('./#/week');
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-pathline]')).toHaveCount(0);
});

// Schritt 2 (Noah 29.10.2026 «Freigeben»): the «i» on Heute tiles and on the tabs of Planen
test('Planen Woche has an info sign: the sheet shows the path, the text and what belongs to it, and goes there', async ({ page, context }) => {
  await open(page, context, '#/week');
  await page.locator('[data-info-open="tab.week"]').click();
  const sheet = page.locator('[data-info-sheet]');
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('[data-info-path] a').first()).toHaveAttribute('href', '#/week');
  await expect(sheet.locator('[data-info-related] button')).toHaveCount(2);
  await sheet.getByRole('button', { name: 'Schliessen' }).last().click();
  await expect(sheet).toBeHidden();
});

test('the info sign on a Heute tile says where its data comes from; off with the path switch', async ({ page, context }, info) => {
  await openHome(page, context, info);
  const dot = page.locator('.wall [data-tile="week"] [data-info-open="tile.week"]');
  await expect(dot).toBeVisible();
  await dot.click();
  await expect(page.locator('[data-info-sheet][open] [data-info-from] li').first()).toBeVisible();
  await page.locator('[data-info-sheet][open] .vd-x').click();
  await page.evaluate(() => localStorage.setItem('ops.path', '0'));
  await page.reload();
  await ready(page);
  await expect(page.locator('.wall [data-tile="week"] h2')).toBeVisible();
  await expect(page.locator('[data-info-open]')).toHaveCount(0);
});
