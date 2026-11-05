// Etappe 6 (E6-001): the back key closes the window first and the page under it stays (rule U8).
// Heute's «Was ziehe ich an?» and the ••• menu of a Material row had no history entry: Back left the page.
import { test, expect } from './clock.js';
import { start, tr } from './gesamttest/lib.js';
import { ready } from './settle.js';

test('Back closes the window on Heute and in Material, and the page stays', async ({ page, context }, info) => {
  await start(page, context, info); // the big fictional data (700 items)
  await page.goto('./#/trips');
  await page.goto('./#/');
  await page.locator('[data-wear-open]').click();
  await expect(page.locator('dialog.wear[open]')).toBeVisible();
  await page.goBack();
  await expect(page.locator('dialog.wear[open]')).toHaveCount(0);
  expect(page.url()).toMatch(/#\/$/); // still on Heute, not on the page before
  await page.goto('./#/gear');
  await ready(page);
  await page.getByLabel(tr('de')('Search gear')).fill('Jacke');
  const dots = page.locator('li.gr').first().getByRole('button', { name: tr('de')('Actions'), exact: true });
  await expect(dots).toBeVisible();
  await dots.click();
  await expect(page.locator('dialog.rowmenu[open]')).toBeVisible();
  await page.goBack();
  await expect(page.locator('dialog.rowmenu[open]')).toHaveCount(0);
  expect(page.url()).toMatch(/#\/gear$/);
});
