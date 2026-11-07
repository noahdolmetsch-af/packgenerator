// Etappe 6 (3a): the first Tab stop is «Zum Inhalt springen»; Enter moves the focus into the page.
import { test, expect } from './clock.js';

test('the first Tab stop skips to the content', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('./');
  await expect(page.locator('main')).toBeVisible({ timeout: 45_000 });
  await page.keyboard.press('Tab');
  const skip = page.locator('[data-skip]');
  await expect(skip).toBeFocused();
  await expect(skip).toHaveText(/Skip to content|Zum Inhalt springen/);
  await expect.poll(async () => (await skip.boundingBox())?.y ?? -999, { message: 'the focused skip button slides into the screen' }).toBeGreaterThanOrEqual(0);
  await page.keyboard.press('Enter');
  const inMain = await page.evaluate(() => document.querySelector('main')?.contains(document.activeElement) ?? false);
  expect(inMain, 'the focus is in the page').toBe(true);
});

test('the skip button stays out of sight until it is focused', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('main')).toBeVisible({ timeout: 45_000 });
  const box = await page.locator('[data-skip]').boundingBox();
  expect(box && box.y + box.height <= 0, 'above the screen').toBe(true);
});
