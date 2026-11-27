// Impeccable «Wunschliste» (Noah 24.11.2026 «1-5a», Paket 11, velos-material.md Fund 2 und 5): the list is called
// «Wunschliste» (chip and title), every wish has one row of buttons («Gekauft» and «…»), «30 Tage warten» is the first
// entry in the «…», and the thumb button says «Wunsch» there and «Teil» on the inventory. German UI, fictional data only.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { materialFixture } from './material0472-fixture.js';

const phone = (info) => info.project.name === 'phone';

test('Wishlist - one row of buttons per wish, the wait is in the menu, the chip and the thumb button say wish', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: materialFixture() });
  await page.goto('./#/gear?view=wish');
  await expect(page.getByRole('heading', { level: 1, name: 'Wunschliste' })).toBeVisible();
  const wish = page.getByRole('region', { name: 'Wunschliste' });
  const rows = wish.locator('li.fr');
  await expect(rows.first()).toBeVisible();
  // every row: «Gekauft» and «…», no «30 Tage warten» button, nothing else
  for (let i = 0; i < (await rows.count()); i++) {
    const buttons = rows.nth(i).locator('.buyw button');
    await expect(buttons).toHaveCount(2);
    await expect(buttons.first()).toContainText('Gekauft');
    await expect(buttons.last()).toHaveAccessibleName(/^Mehr zu/);
  }
  await expect(wish.getByRole('button', { name: /30 Tage warten/ })).toHaveCount(0);
  // the first entry in the menu is the wait; it works and the card says until when
  const row = rows.first();
  const before = (await row.boundingBox()).height;
  if (phone(info)) expect(before).toBeLessThan(150); // two lines of text and one row of buttons, not 187 px
  await row.getByRole('button', { name: /^Mehr zu/ }).click();
  const items = page.getByRole('menuitem');
  await expect(items.first()).toContainText('30 Tage warten');
  await items.first().click();
  await expect(row.locator('[data-wish-waiting]')).toBeVisible();
  await row.getByRole('button', { name: /^Mehr zu/ }).click();
  await expect(page.getByRole('menuitem', { name: /30 Tage warten/ })).toHaveCount(0); // it waits already
  await page.keyboard.press('Escape');
  if (phone(info)) {
    // the thumb button: «Wunsch» here, «Teil» on the inventory
    await expect(page.locator('.daumen .addb')).toContainText('Wunsch');
    await expect(page.locator('.daumen .addb')).toHaveAccessibleName('Wunsch hinzufügen');
    await page.goto('./#/gear');
    await expect(page.locator('.daumen .addb')).toContainText('Teil');
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});
