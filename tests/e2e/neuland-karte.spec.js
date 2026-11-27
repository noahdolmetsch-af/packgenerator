// «Neuland-Seite verbessern» (Noah 27.11.2026 «1 2 3 4 5 6 7», Punkte 1 und 2): the map zooms (buttons, whole map, full screen)
// and the list shows 10 entries first. Fictional data only, no real network.
import { test, expect } from './clock.js';
import { ready } from './settle.js';

test('Neuland map: zoom in and out, jump from the list, full screen, ten entries first', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/neuland');
  await ready(page);
  await expect(page.getByTestId('nl-count')).toBeVisible({ timeout: 30000 });
  const map = page.locator('svg.nmap').first();
  await expect(map).toBeVisible();
  await expect(page.locator('[data-zoom-reset]').first()).toBeDisabled();
  await page.locator('[data-zoom-in]').first().click();
  await expect.poll(async () => Number(await map.getAttribute('data-zoom'))).toBeGreaterThan(1.5);
  await page.locator('[data-zoom-in]').first().click();
  await page.locator('[data-zoom-out]').first().click();
  await page.locator('[data-zoom-reset]').first().click();
  await expect(map).toHaveAttribute('data-zoom', '1.00');

  // a pin in the list zooms the map to that entry
  await page.locator('[data-nl-locate]').first().click();
  await expect.poll(async () => Number(await map.getAttribute('data-zoom'))).toBeGreaterThan(1.5);

  // full screen: Escape closes
  await page.locator('[data-zoom-full]').first().click();
  await expect(page.locator('[data-zoom-close]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-zoom-close]')).toHaveCount(0);

  // the list starts with ten entries
  expect(await page.locator('.nl-list .row').count()).toBeLessThanOrEqual(10);
});
