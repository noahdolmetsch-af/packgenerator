// «Velos-Übersicht» Schritt 1: Bikes shows one card per bike with km and status. Fictional fixture.
import { test, expect } from './clock.js';
import { fileURLToPath } from 'node:url';
import { importAndSettle } from './settle.js';

const fixture = fileURLToPath(new URL('./fixture.json', import.meta.url));

test('Bikes: one card per bike with a status and a link to its care', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await page.goto('./');
  await importAndSettle(page, fixture);
  await page.goto('./#/bikes');
  const cards = page.locator('[data-velo-card]');
  await expect(cards.first()).toBeVisible();
  await expect(cards.first().locator('.vpill')).not.toBeEmpty();
  await cards.first().locator('a.btn').click();
  await expect(page).toHaveURL(/tab=care/);
});

test('Bikes: «Log a problem» on a card opens the window for that bike', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await page.goto('./');
  await importAndSettle(page, fixture);
  await page.goto('./#/bikes');
  const card = page.locator('[data-velo-card]').first();
  await card.locator('[data-card-problem]').click();
  await expect(page.getByRole('dialog')).toBeVisible();
});
