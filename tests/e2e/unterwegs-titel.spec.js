// Durchklick Etappe 3 (Noah «3a»): «Unterwegs» has its title also when there is no trip.
import { test, expect } from './clock.js';
import { prepare } from './gesamttest/lib.js';
import { ready } from './settle.js';

test('Unterwegs ohne Tour hat eine Ueberschrift', async ({ page, context }) => {
  await prepare(page, context, 'de');
  await page.goto('./#/ride');
  await ready(page);
  await expect(page.locator('main')).toBeVisible();
  const h1 = page.locator('main h1[data-page-title]');
  await expect(h1).toHaveCount(1);
  await expect(h1).toHaveText('Unterwegs');
  await expect(page.getByText('Noch keine Touren')).toBeVisible();
});
