// Sitemap K1 (Noah 24.11.2026): two rows under the bike cards: «Ride ledger» opens the ledger on its own page, «Start inspection» the quick check. Fictional fixture.
import { test, expect } from './clock.js';
import { fileURLToPath } from 'node:url';
import { importAndSettle } from './settle.js';

const fixture = fileURLToPath(new URL('./fixture.json', import.meta.url));

test('Bikes: «Ride ledger» and «Start inspection» stand right under the cards and lead to the ledger and the quick check', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await page.goto('./');
  await importAndSettle(page, fixture);
  await page.goto('./#/bikes');
  const rows = page.locator('[data-bike-quick-rows]');
  await expect(rows).toBeVisible();
  // under the cards, over «Next up»
  const yCards = (await page.locator('[data-bike-cards]').boundingBox()).y;
  const yRows = (await rows.boundingBox()).y;
  const yNext = (await page.locator('[data-next-up]').boundingBox()).y;
  expect(yRows).toBeGreaterThan(yCards);
  expect(yRows).toBeLessThan(yNext);
  await expect(rows.locator('[data-inspect-row] small')).not.toBeEmpty();
  // the ledger on its own page, no fold to open
  await rows.locator('[data-km-row]').click();
  await expect(page).toHaveURL(/tab=care.*view=km|view=km.*tab=care/);
  await expect(page.locator('section.kmbook')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  // the quick check
  await page.goto('./#/bikes');
  await page.locator('[data-bike-quick-rows] [data-inspect-row]').click();
  await expect(page).toHaveURL(/view=inspect/);
  await expect(page).toHaveURL(/level=quick/);
});
