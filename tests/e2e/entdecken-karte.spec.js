// «Heute entdecken» (Noah 23.11.2026 «1a 2b 3a 4a 5a»): one idea with its «Warum» in a row under the chips on Today (it was the card «Discover»
// under «More»), «Later» (the ×) with Undo, «More ideas» with three, the switch that takes the row away. German, phone and computer, fictional data.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { mkdirSync } from 'node:fs';

test('Heute entdecken: one idea with its reason on the first screen, Later with Undo, More ideas, the switch', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { hour: 9 });
  const row = page.locator('[data-ideas-row]');
  await expect(row).toBeVisible({ timeout: 15000 });
  await expect(row).toContainText(T('Discover today'));
  await expect(row.locator('[data-idea-why]')).not.toBeEmpty();
  // the card «Discover» is not under «More» any more
  await expect(page.locator('[data-section="discover"]')).toHaveCount(0);
  // first screen: the row starts above the lower edge of the window
  const box = await row.boundingBox();
  expect(box.y).toBeLessThan(page.viewportSize().height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  if (process.env.SHOTS) {
    mkdirSync(process.env.SHOTS, { recursive: true });
    await page.screenshot({ path: `${process.env.SHOTS}/heute-entdecken-${info.project.name === 'phone' ? 390 : 1440}.png` });
  }
  const first = await row.getAttribute('data-idea');
  await row.locator('[data-idea-later]').click();
  await expect(row).not.toHaveAttribute('data-idea', first);
  // Undo brings the idea back
  await page.locator('.rtoast').getByRole('button', { name: T('Undo') }).click();
  await expect(row).toHaveAttribute('data-idea', first);

  await page.locator('[data-ideas-more]').click();
  const sheet = page.locator('[data-ideas-sheet]');
  await expect(sheet).toBeVisible();
  expect(await sheet.locator('[data-idea-item]').count()).toBeLessThanOrEqual(3);
  await expect(sheet.locator('[data-ideas-map]')).toContainText(T('See the map of the app'));
  await sheet.locator('[data-ideas-switch]').uncheck();
  await sheet.getByRole('button', { name: T('Done|customise') }).click();
  await expect(page.locator('[data-ideas-row]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
