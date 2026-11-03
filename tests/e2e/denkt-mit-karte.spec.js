// «Die App reagiert auch in Packen» (C2 and C3 in the catalogue, Noah 03.11.2026 «unbedingt»): the card on «How the app decides»
// names both hints all the time and leads to Packen.
import { test, expect } from './clock.js';
import { ready } from './settle.js';

test('the card names both Packen hints and leads to Packen', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await page.goto('/#/me/regeln');
  await ready(page);
  const card = page.locator('[data-denkt-mit]');
  await expect(card).toBeVisible();
  await expect(card.locator('[data-denkt-row="f.wxturn"]')).toBeVisible();
  await expect(card.locator('[data-denkt-row="f.bikefit"]')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  await card.getByRole('link').first().click();
  await expect(page).toHaveURL(/#\/pack/);
});
