// Velos aufräumen (Noah 23.11.2026): the bikes stand once, as the big cards on top. The small cards under them (a second
// row of the same bikes) are gone; «Show details» chooses a bike, «Add bike» is the dashed card at the end. Fictional data.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

test('Velos: the bikes stand once, Show details chooses one', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await page.goto('./#/bikes');
  const cards = page.locator('[data-velo-card]');
  await expect(cards.nth(1)).toBeVisible(); // the page loads later: wait for the cards before counting
  expect(await cards.count()).toBeGreaterThan(1);
  // no second row of the same bikes
  await expect(page.locator('section.setup-band [data-bike-card]')).toHaveCount(0);
  await expect(page.locator('section.setup-band').getByRole('tab')).toHaveCount(0);
  const second = cards.nth(1);
  const name = await second.locator('.nm').textContent();
  await second.locator('[data-card-details]').click();
  await expect(page.locator('[data-velo-card][aria-current="true"] .nm')).toHaveText(name);
  await expect(page.locator('section.setup-band h2.name')).toContainText(name);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});

test('Velos: Add bike is the last card and opens the window', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await page.goto('./#/bikes');
  const add = page.locator('[data-card-add]');
  await expect(add).toBeVisible();
  await add.click();
  await expect(page.locator('dialog[open]')).toBeVisible();
});
