// v0.94.0 «Velo kurz» (App einfach D, Noah 5a, mockup D): Bikes › Overview shows three rows (bike
// care, bags, equipment), «Import rides» as the one button and «More» for everything else; nothing
// is gone. Fictional fixture (test_data_gtp_), German UI.
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};

test('Velo kurz: three rows, Import rides, More', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  await importAndSettle(page, fileURLToPath(new URL('./fixture.json', import.meta.url)));
  await page.goto('./#/bikes');

  const rows = page.locator('.vk-rows > li');
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toContainText(T('Bike care'));
  await expect(rows.nth(1)).toContainText(T('Bags'));
  await expect(rows.nth(2)).toContainText(T('Equipment|tab'));
  // The rest waits under «Mehr»: no folder, no drawing yet.
  await expect(page.getByRole('button', { name: T('Edit mounts') })).toHaveCount(0);
  const imp = page.getByRole('link', { name: new RegExp(T('Import rides')) });
  await expect(imp).toBeVisible();
  const box = await imp.boundingBox();
  expect(box.y + box.height).toBeLessThan(page.viewportSize().height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);

  // «Taschen» opens the drawing and the standard bags, «Mehr» everything else.
  await rows.nth(1).getByRole('button').click();
  await expect(page.getByRole('heading', { name: T('Standard bags') })).toBeVisible();
  await page.locator('.vk-more').click();
  await expect(page.locator('#vk-more')).toBeVisible();
  await expect(page.locator('a.cmplink')).toContainText(T('Compare bikes'));

  // «Fahrten importieren» lands on the import.
  await imp.click();
  await expect(page).toHaveURL(/tab=care.*view=import|view=import.*tab=care/);
  expect(errors).toEqual([]);
});
