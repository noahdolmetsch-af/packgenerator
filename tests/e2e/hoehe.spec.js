// «Temperaturen nach Höhe» (Noah 05.11.2026 «1b 2a und c 3a …»): the card on the weather page, more places, a peak, an own place.
// Made-up place and air layers; Open-Meteo is mocked, everything else outside is blocked (openHome).
import { test, expect } from './clock.js';
import { openHome, homeFixture } from './home0460-fixture.js';
import { mock } from './hoehe-fixture.js';

test('The weather page shows the temperature by height, for more places and a peak, and an own place with Undo', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: homeFixture() });
  await mock(context);

  await page.goto('./#/wetter');
  const card = page.locator('[data-hoehe]');
  await expect(card.locator('[data-hoehe-row="1000"]')).toBeVisible({ timeout: 20_000 });
  // the three heights, highest first; today is 4 degrees warmer than the standard layers: 1000 m is 7.5 °C, 3000 m −5 °C
  await expect(card.locator('[data-hoehe-row]')).toHaveCount(3);
  await expect(card.locator('[data-hoehe-row="1000"] [data-hoehe-now]')).toHaveText('8°');
  await expect(card.locator('[data-hoehe-row="3000"] [data-hoehe-now]')).toHaveText('−5°');
  await expect(card.locator('[data-hoehe-zero]')).toContainText('2’200 m');
  await expect(card.locator('[data-hoehe-table] thead th')).toHaveCount(5); // height, now, 6, 12, 18
  await expect(card.locator('[data-hoehe-days] thead th')).toHaveCount(3); // height and two days

  // more places: Davos lies higher than 1000 m, so its 1000 m row has no value; a peak shows its own height
  await card.locator('[data-hoehe-set] summary').click();
  await card.locator('[data-hoehe-pick="davos"]').click();
  await card.locator('[data-hoehe-pick="peak:corvatsch"]').click();
  await expect(card.locator('[data-hoehe-item="davos"] [data-hoehe-row="1000"] [data-hoehe-now]')).toHaveText('–');
  await expect(card.locator('[data-hoehe-item="davos"] [data-hoehe-row="2000"] [data-hoehe-now]')).toHaveText('1°');
  await expect(card.locator('[data-hoehe-item="peak:corvatsch"] [data-hoehe-row="3303"] [data-hoehe-now]')).toHaveText('−8°');
  await expect(card.locator('[data-hoehe-item]')).toHaveCount(3);
  await page.locator('[data-wx-today]').screenshot({ path: info.outputPath(`hoehe-wetter-${info.project.name}.png`) });

  // taking one away again
  await card.locator('[data-hoehe-pick="davos"]').click();
  await expect(card.locator('[data-hoehe-item="davos"]')).toHaveCount(0);

  // an own place: search, add, rename, delete, Undo
  await card.locator('[data-hoehe-q]').fill('Splügen');
  await card.locator('.hh-find button[type="submit"]').click();
  await card.locator('[data-hoehe-add]').click();
  await expect(card.locator('[data-hoehe-own]')).toHaveCount(1);
  await expect(card.locator('[data-hoehe-item^="own:"]')).toContainText('Über Splügen');
  await card.locator('[data-hoehe-rename]').click();
  await page.locator('#rn-in').fill('Splügenpass');
  await page.locator('#rn-in').press('Enter');
  await expect(card.locator('[data-hoehe-own]')).toContainText('Splügenpass');
  await card.locator('[data-hoehe-delete]').click();
  await page.getByTestId('ask-delete').getByRole('button', { name: 'Löschen' }).click();
  await expect(card.locator('[data-hoehe-own]')).toHaveCount(0);
  await page.getByRole('button', { name: /Rückgängig/ }).click();
  await expect(card.locator('[data-hoehe-own]')).toHaveCount(1);
});

test('Without a choice only the place of the page shows, and the card says it is a guess', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: homeFixture() });
  await mock(context);
  await page.goto('./#/wetter');
  const card = page.locator('[data-hoehe]');
  await expect(card.locator('[data-hoehe-item]')).toHaveCount(1, { timeout: 20_000 });
  await expect(card).toContainText('Eine Schätzung zum Planen');
});
