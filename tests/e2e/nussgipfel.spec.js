// «Nussgipfel-Rechner» (Noah 03.11.2026, Idee 26): on Food and water the kcal of the ride are also said in nut
// croissants; a switch in Ich › Darstellung takes it away. Fictional trip «Event Jura 300», nothing leaves the test.
import { test, expect } from './clock.js';
import { fileURLToPath } from 'node:url';
import { importAndSettle } from './settle.js';

const FIX = fileURLToPath(new URL('../fixtures/gesamttest/test_data_gtp_daten.json', import.meta.url));
const ID = 'test_data_gtp_trip26';

test('the energy of the ride is also said in nut croissants, and the switch takes it away', async ({ page, context }) => {
  test.setTimeout(120_000);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  await importAndSettle(page, FIX);
  await page.goto(`./#/trips/fuel?trip=${ID}`);
  await page.reload();
  const nuss = page.locator('main [data-nussgipfel]');
  await expect(nuss).toBeVisible();
  await expect(nuss).toContainText('Nussgipfel');
  expect(Number(await nuss.getAttribute('data-nussgipfel'))).toBeGreaterThan(2); // 135 km, 1100 m up: thousands of kcal
  await page.evaluate(() => localStorage.setItem('ops.nussgipfel', '0'));
  await page.reload();
  await expect(page.locator('main [data-fuel-kcal]')).toBeVisible();
  await expect(page.locator('main [data-nussgipfel]')).toHaveCount(0);
});
