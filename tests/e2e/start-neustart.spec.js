// Etappe 6 (E6-010): when the app file cannot be fetched at the start (now and then seen offline), the screen stayed empty.
// Now the start tries once more by itself.
import { test, expect } from './clock.js';

test('the start recovers when the app file fails to load once', async ({ page }) => {
  test.setTimeout(90_000);
  let failed = 0;
  await page.route(/\/assets\/start-[^/]+\.js$/, (route) => {
    if (failed++ === 0) return route.abort('failed');
    return route.continue();
  });
  await page.goto('./');
  await expect(page.locator('main')).toBeVisible({ timeout: 45_000 });
  expect(failed, 'the file was requested again after the first failure').toBeGreaterThan(1);
});
