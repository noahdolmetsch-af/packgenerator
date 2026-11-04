// «Velos-Pflege einbauen» (Noah 03.11.2026 «3a»): the sale listing from «Retire bike», and the way back. Fictional fixture.
import { test, expect } from './clock.js';
import { fileURLToPath } from 'node:url';
import { importAndSettle } from './settle.js';

const fixture = fileURLToPath(new URL('./fixture.json', import.meta.url));

test('Retire sheet with «Sold» offers the listing; after copying the listing page offers to retire', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await page.goto('./');
  await importAndSettle(page, fixture);
  await page.goto('./#/bikes');
  await page.locator('.bmenu button').first().click();
  await page.getByRole('menuitem', { name: /Retire bike/ }).or(page.getByRole('button', { name: /Retire bike/ })).first().click();
  const sheet = page.locator('[data-retire-sheet]');
  await expect(sheet.locator('[data-retire-listing]')).toBeVisible();
  await sheet.locator('[data-retire-reason="broken"]').click();
  await expect(sheet.locator('[data-retire-listing]')).toHaveCount(0);
  await sheet.locator('[data-retire-reason="sold"]').click();
  await sheet.locator('[data-retire-listing-go]').click();
  await expect(page).toHaveURL(/view=sell/);
  await expect(page.locator('[data-sell-next]')).toHaveCount(0);
  await page.locator('[data-sell-copy]').click();
  await expect(page.locator('[data-sell-next]')).toBeVisible();
  await page.locator('[data-sell-retire]').click();
  await expect(page.locator('[data-retire-sheet]')).toBeVisible();
});
