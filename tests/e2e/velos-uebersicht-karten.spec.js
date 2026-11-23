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

test('Bikes: «Next up» names the open work over all bikes or says nothing is due', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await page.goto('./');
  await importAndSettle(page, fixture);
  await page.goto('./#/bikes');
  const up = page.locator('[data-next-up]');
  const none = page.locator('[data-next-none]');
  await expect(up.or(none).first()).toBeVisible();
});

test('Bikes: «Workshop and history» shows the latest visits or says there is none', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await page.goto('./');
  await importAndSettle(page, fixture);
  await page.goto('./#/bikes');
  await expect(page.locator('[data-visit-history]')).toBeVisible();
  await expect(page.locator('[data-visit-history] li, [data-visit-none]').first()).toBeVisible();
});

test('Bikes: a visit saved from a card names what it changed', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await page.goto('./');
  await importAndSettle(page, fixture);
  await page.goto('./#/bikes');
  await page.locator('[data-velo-card]').first().locator('[data-card-visit]').click();
  const dlg = page.getByRole('dialog');
  await dlg.locator('.vd-chip', { hasText: 'Chain replaced' }).click();
  await dlg.getByPlaceholder('Name of the shop').fill('test_data_gtp_ Werkstatt');
  await dlg.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('[data-saved-resets]')).toContainText('Chain');
});

test('Bikes: one line over the cards says how many bikes and changes the order; the bike below is named «Chosen bike»', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await page.goto('./');
  await importAndSettle(page, fixture);
  await page.goto('./#/bikes');
  const head = page.locator('[data-bikes-head]');
  await expect(head).toBeVisible();
  const n = await page.locator('[data-velo-card]').count();
  await expect(head.locator('.num')).toHaveText(String(n));
  if (n > 1) {
    await expect(page.locator('[data-bike-chosen]')).toBeVisible();
    await head.locator('[data-order-open]').click();
    await expect(page.locator('dialog.bo-dlg')).toBeVisible();
  }
  // the order of the cards comes before the card of the bike chosen below, and no second «n bikes» line stands there
  await expect(page.locator('section.setup-band .vb-sub')).toHaveCount(0);
});
