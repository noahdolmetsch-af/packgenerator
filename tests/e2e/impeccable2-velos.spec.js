// Impeccable Runde 2 (18.10.2026), Gruppe 3 Velos. Fictional data only (the Gesamttest data set, test_data_gtp_).
// - Velopflege 3 / Werkstatt 1: «Auftrag für den Velomech» shows the same orders on both pages;
// - Werkstatt 2: amounts as «CHF 80», no «80.00»;
// - Velos 2: no empty «Hersteller und Garantie» box under the bike's name, the head line names the next trip;
// - Ausstattung 2: on a phone the bike choice is one row that does not wrap;
// - Setup 1: its own head with the title «Setup».
import { test, expect } from '@playwright/test';
import { start, view } from './gesamttest/lib.js';
import de from '../../src/lib/i18n/de/index.js';

const T = (k) => de[k] ?? k.replace(/\|[a-z]+$/, '');

test.beforeEach(async ({ page, context }, info) => {
  await start(page, context, info);
});

test('Auftrag für den Velomech: the same orders in Care and in Workshop & receipts', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await view(page, '#/bikes?tab=care');
  await expect(page.locator('#shop-h')).toHaveText(T('Order for the bike shop'));
  const inCare = await page.locator('.ovside .olist > li').count();
  await view(page, '#/bikes?tab=shop');
  await expect(page.locator('#forshop-h')).toHaveText(T('Order for the bike shop'));
  const shop = page.locator('section.ssec').filter({ has: page.locator('#forshop-h') });
  await expect(shop.locator('ul.srows:not(.sheets) > li')).toHaveCount(inCare);
  if (inCare) {
    await expect(shop.getByRole('button', { name: new RegExp(T('Share the order')) })).toBeVisible();
    await shop.locator('ul.srows:not(.sheets) > li button').first().click();
    await expect(page.locator('dialog[open]')).toBeVisible();
    await page.keyboard.press('Escape');
  } else {
    await expect(shop).toContainText(T('No order for the bike shop right now. Due work and problems marked «bike shop» come here by themselves.'));
  }
  // Werkstatt 2: one way to write amounts
  const amounts = await page.locator('.srows button[data-visit-id] .v').allTextContents();
  expect(amounts.filter((a) => /\.00$/.test(a.trim()) || (/\d/.test(a) && !/^CHF /.test(a.trim())))).toEqual([]);
  expect(errors).toEqual([]);
});

test('Velos: no empty warranty box under the name; the head line names the next trip', async ({ page }) => {
  await view(page, '#/bikes');
  await expect(page.locator('[data-sk-woanders]')).toHaveCount(0);
  await expect(page.locator('section.setup-band .bmenu')).toHaveCount(1);
  await expect(page.locator('section.setup-band .vb-sub')).not.toContainText(T('{bike} as the next one').replace('{bike}', '').trim());
});

test('Velo pages: on a phone the bike choice is one row; Setup has its own head', async ({ page }, info) => {
  for (const hash of ['#/bikes?tab=shop', '#/bikes?tab=compare', '#/bikes?tab=rig']) {
    await view(page, hash);
    const row = page.locator('.bike-row');
    await expect(row, hash).toHaveCount(1);
    if (info.project.name === 'phone') {
      const tops = await row.locator('button').evaluateAll((els) => [...new Set(els.map((e) => Math.round(e.getBoundingClientRect().top)))]);
      expect(tops.length, hash).toBe(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), hash).toBe(true);
    }
  }
  await expect(page.getByRole('heading', { level: 1, name: T('Setup|tab'), exact: true })).toBeVisible();
  await expect(page.locator('main h1:visible')).toHaveCount(1);
});
