// «Pfad auf jeder Seite» Schritt 3 (Noah 28.10.2026 «1a und c und d alle»): Explorer mode. A tap on a tile with an
// «i» opens the sheet «Woher kommt das?» instead of the tile; the bar at the top switches the mode off.
// German UI, no network, fictional data only.
import { test, expect } from './clock.js';
import { ready } from './settle.js';
import { openHome } from './home0460-fixture.js';

test('Explorer mode: a tap on a tile shows where it comes from; the bar switches it off', async ({ page, context }, info) => {
  await context.addInitScript(() => localStorage.setItem('ops.explore', '1'));
  await openHome(page, context, info);
  const bar = page.locator('[data-explorer]');
  await expect(bar).toBeVisible();
  const url = page.url();
  await page.locator('.wall [data-tile="week"]').click({ position: { x: 20, y: 60 } });
  await expect(page.locator('[data-info-sheet][open] [data-info-from] li').first()).toBeVisible();
  expect(page.url()).toBe(url);
  await page.locator('[data-info-sheet][open] .vd-x').click();
  await bar.locator('[data-explorer-off]').click();
  await expect(bar).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('ops.explore'))).toBe('0');
});

test('Explorer mode is off by default and the switch stands in Handling', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await expect(page.locator('[data-explorer]')).toHaveCount(0);
  await page.goto('./#/me/look');
  await ready(page);
  await expect(page.locator('[data-ops] input[data-op="explore"]')).not.toBeChecked();
});
