// v0.95.0 «Velo kurz» (App einfach D, Noah 5a, mockup D): Bikes › Overview shows three rows (bike
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

test('Velo kurz: three rows, Import rides, More as rows', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  await importAndSettle(page, fileURLToPath(new URL('./fixture.json', import.meta.url)));
  await page.goto('./#/bikes');

  // Design-Refresh P7 (V1, Noah 12.10.2026 «v1-v4 freigabe»): the drawing and the bags are open on the page;
  // «Pflege und Ausstattung» has three rows (bike care, always mounted, equipment); «Fahrten importieren» is
  // the one button; «Mehr» is a list of rows (folder, photos, compare, profile and settings, ideas).
  const rows = page.locator('.vk-rows > li');
  // «Verschleiss» (Noah 20.10.2026, 5a) adds the row «Wear» before «Equipment».
  await expect(rows).toHaveCount(4);
  await expect(rows.nth(0)).toContainText(T('Bike care'));
  await expect(rows.nth(1)).toContainText(T('Always mounted'));
  await expect(rows.nth(2)).toContainText(T('Wear|page'));
  await expect(rows.nth(3)).toContainText(T('Equipment|tab'));
  await expect(page.getByRole('button', { name: T('Edit mounts') })).toBeVisible();
  await expect(page.getByRole('heading', { name: T('Bags'), exact: true })).toBeVisible();
  const imp = page.getByRole('link', { name: new RegExp(T('Import rides')) });
  await expect(imp).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);

  await expect(page.locator('#vk-more')).toBeVisible();
  await expect(page.locator('#vk-more details.vm-folder')).toHaveCount(1);
  await expect(page.locator('#vk-more details.vm-profile')).toHaveCount(1);
  await expect(page.locator('a.cmplink')).toContainText(T('Compare bikes'));

  // «Fahrten importieren» lands on the import.
  await imp.click();
  await expect(page).toHaveURL(/tab=care.*view=import|view=import.*tab=care/);
  expect(errors).toEqual([]);
});
