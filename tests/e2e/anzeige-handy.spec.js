// UX-Test 08.11.2026, «Sechs Anzeige-Fehler»: the empty Einkauf speaks of wishes, the wishlist line says how it is sorted,
// the signposts page shows no English key before a sign, «Nicht mehr fragen» in the weight tile wraps instead of hiding.
// Fictional data only (material0472-fixture.js).
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { materialFixture } from './material0472-fixture.js';

test('Einkauf empty: the card speaks of wishes and offers to add one', async ({ page, context }, info) => {
  await page.goto('./#/gear?view=wish'); // a fresh app: nothing stored yet, English
  await expect(page.getByRole('heading', { level: 1, name: 'Shopping' })).toBeVisible();
  await expect(page.getByText('No wishes yet')).toBeVisible();
  await expect(page.getByText('No gear yet')).toHaveCount(0);
  await expect(page.getByText('No wishlist items match.')).toHaveCount(0);
  await page.getByRole('button', { name: 'Add a wish' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('Einkauf with items: the line says how the wishlist is sorted, the inventory keeps its sort name', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: materialFixture() });
  await page.goto('./#/gear?view=wish');
  await expect(page.locator('.sorted')).toHaveText('Sortiert: Wichtigstes zuerst');
  await page.goto('./#/gear');
  await expect(page.locator('.sorted')).toContainText(/Sortiert: (Meist dabei|Name|Gewicht|Zuletzt dabei)/);
});

test('Signpost page: no sign shows its English key as text', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await page.goto('./#/mountain/scales');
  const rows = page.locator('li[data-flag]');
  await expect(rows).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    const before = await rows.nth(i).evaluate((e) => getComputedStyle(e, '::before').content);
    expect(['none', 'normal', '""']).toContain(before);
  }
});
