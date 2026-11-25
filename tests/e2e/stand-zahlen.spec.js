// «Dein Stand in Zahlen» on Velos und Material (Noah 24.11.2026 «b»). Fictional data only (the Gesamttest data set).
// - three numbers on top, each one a way; the bikes stay right below (Inhalt zuerst);
// - «Hide» switches it off with Undo, the switch under Ich › Darstellung › Bedienung brings it back;
// - the chart of the 12 months opens from its line and shows the numbers of a month.
import { test, expect } from './clock.js';
import { start, view } from './gesamttest/lib.js';
import de from '../../src/lib/i18n/de/index.js';

const T = (k) => de[k] ?? k;

test.beforeEach(async ({ page, context }, info) => {
  await start(page, context, info);
});

test('Stand in Zahlen: three numbers with ways, the bikes right below', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await view(page, '#/bikes');
  const card = page.locator('[data-stand="velos"]');
  await expect(card).toBeVisible();
  const tiles = card.locator('[data-stand-tile]');
  await expect(tiles).toHaveCount(3);
  for (let i = 0; i < 3; i++) await expect(tiles.nth(i)).toHaveAttribute('href', /^#\//);
  // Inhalt zuerst: the bike cards follow the card and start high on the page
  const [a, b] = await Promise.all([card.boundingBox(), page.locator('[data-bike-cards]').boundingBox()]);
  expect(b.y).toBeGreaterThan(a.y);
  expect(b.y).toBeLessThan(page.viewportSize().height + 400);
  // the chart: one line that opens (closed on a phone, open on a computer)
  const chart = card.locator('[data-stand-chart]');
  await expect(chart).toHaveCount(1);
  if (!(await chart.evaluate((d) => d.open))) await chart.locator('summary').click();
  await expect(chart.locator('[data-chart="stand-velos"]')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});

test('Stand in Zahlen: Hide with Undo, and the switch in Bedienung', async ({ page }) => {
  await view(page, '#/bikes');
  const card = page.locator('[data-stand="velos"]');
  await expect(card).toBeVisible();
  await card.locator('[data-stand-hide]').click();
  await expect(card).toHaveCount(0);
  await page.getByRole('button', { name: T('Undo') }).first().click();
  await expect(page.locator('[data-stand="velos"]')).toBeVisible();
  // the switch under Ich › Darstellung › Bedienung
  await card.locator('[data-stand-hide]').click();
  await view(page, '#/me/look');
  const sw = page.locator('[data-op="standzahlen"]');
  await expect(sw).not.toBeChecked();
  await sw.check();
  await view(page, '#/bikes');
  await expect(page.locator('[data-stand="velos"]')).toBeVisible();
});
