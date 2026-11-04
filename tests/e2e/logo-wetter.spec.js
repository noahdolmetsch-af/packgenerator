// «Logo-Wetter» (Geheimmenü H9, Noah 03.11.2026): five quick taps on PG can show the weather of now at the logo.
// Fictional data and weather (home0460-fixture: 14° and dry until 19 h), nothing leaves the preview.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { fixChance } from './logo-helpers.js';

const mark = (page, info) => (info.project.name === 'phone' ? page.locator('header.top .brand .mark') : page.locator('.logo .mark'));
const five = async (m) => {
  for (let i = 0; i < 5; i++) await m.click();
};

test('the weather shows at the logo with the sentence of Today, then goes away', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await fixChance(page, 'weather');
  await five(mark(page, info));
  const wx = page.locator('[data-logo-weather]');
  await expect(wx).toBeVisible();
  await expect(wx).toContainText('14°');
  await page.waitForTimeout(1000); // the bubble itself never turns (once the sun class turned the whole bubble)
  const m = await wx.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform));
  expect(Math.abs(m.b)).toBeLessThan(0.01);
  await expect(wx).toHaveCount(0, { timeout: 8000 }); // gone by itself
});

test('with reduce motion the weather stands still and stays inside the screen', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await fixChance(page, 'weather');
  await five(mark(page, info));
  const wx = page.locator('[data-logo-weather]');
  await expect(wx).toBeVisible();
  const box = await wx.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width);
});
