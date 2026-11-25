// «Dein Stand in Zahlen» on Alltag (Noah 25.11.2026). Fictional data only (the Gesamttest data set).
// - three numbers on top, each one a way; the list of helpers stays right below (Inhalt zuerst);
// - «Hide» switches it off with Undo (the same switch as on Velos und Material).
import { test, expect } from './clock.js';
import { start, view } from './gesamttest/lib.js';
import de from '../../src/lib/i18n/de/index.js';

const T = (k) => de[k] ?? k;

test.beforeEach(async ({ page, context }, info) => {
  await start(page, context, info);
});

test('Stand in Zahlen Alltag: three numbers with ways, the helpers right below', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await view(page, '#/me/alltag');
  const card = page.locator('[data-stand="alltag"]');
  await expect(card).toBeVisible();
  const tiles = card.locator('[data-stand-tile]');
  await expect(tiles).toHaveCount(3);
  const hrefs = await tiles.evaluateAll((a) => a.map((x) => x.getAttribute('href')));
  expect(hrefs).toEqual(['#/flow/challenges', '#/me/alltag/einkauf', '#/me/alltag/abos']);
  const [a, b] = await Promise.all([card.boundingBox(), page.locator('[data-alltag-page="einkauf"]').boundingBox()]);
  expect(b.y).toBeGreaterThan(a.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});

test('Stand in Zahlen Alltag: Hide with Undo', async ({ page }) => {
  await view(page, '#/me/alltag');
  const card = page.locator('[data-stand="alltag"]');
  await expect(card).toBeVisible();
  await card.locator('[data-stand-hide]').click();
  await expect(card).toHaveCount(0);
  await page.getByRole('button', { name: T('Undo') }).first().click();
  await expect(page.locator('[data-stand="alltag"]')).toBeVisible();
});
