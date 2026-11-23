// «Wertliste» (Warteliste 7; Noah 22.11.2026 «1-5 a»): Gear › List of values: everything chosen, filters, a missing price typed in the row
// (one Undo), the PDF made on the device and a copy kept in Me › Documents › Insurance. Fictional data (home0460 fixture), German.
import { test, expect } from './clock.js';
import { openHome, homeFixture } from './home0460-fixture.js';
import { mkdirSync } from 'node:fs';

test('List of values: sum, filters, typed price with Undo, PDF and the copy in the documents', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const data = homeFixture();
  const items = data.tables.items.filter((i) => i.ownership === 'owned').slice(0, 4);
  items.forEach((i, n) => { i.priceChf = n === 0 ? undefined : 100 * n; delete i.boughtAt; });
  const T = await openHome(page, context, info, { hour: 9, data });
  await page.goto('./#/gear/wertliste');
  const sum = page.locator('[data-wl-total]');
  await expect(sum).toBeVisible();
  await expect(page.locator('[data-wl-row]').first()).toBeVisible();
  const before = await sum.textContent();
  // a missing price is typed in the row; the sum grows; one Undo takes it back
  const input = page.locator('[data-wl-price-input]').first();
  await expect(input).toBeVisible();
  await input.fill('250');
  await input.blur();
  await expect(sum).not.toHaveText(before ?? '');
  const after = await sum.textContent();
  await page.getByRole('button', { name: 'Rückgängig' }).click();
  await expect(sum).toHaveText(before ?? '');
  expect(after).not.toBe(before);
  // un-choosing a row changes the sum, the filter «Only above CHF 50» keeps rows without a price
  await page.locator('[data-wl-row] input[type=checkbox]').first().uncheck();
  await page.locator('[data-wl-f="big"]').click();
  await expect(page.locator('[data-wl-f="big"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-wl-f="big"]').click();
  if (process.env.SHOTS) {
    mkdirSync(process.env.SHOTS, { recursive: true });
    await page.screenshot({ path: `${process.env.SHOTS}/wertliste-${info.project.name === 'phone' ? 390 : 1440}.png` });
  }
  // the PDF is made on the device and a copy lies in the documents
  await page.locator('[data-wl-pdf]').click();
  await expect(page.locator('[data-wl-made]')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('[data-wl-share]')).toBeVisible();
  await page.goto('./#/me/docs');
  await expect(page.getByText(T('Insurance'), { exact: false }).first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});
