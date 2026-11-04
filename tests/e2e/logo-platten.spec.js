// «Platten im Logo» (Geheimmenü H8, Noah 03.11.2026): five quick taps on PG can give the logo a flat tyre.
// Fictional data (home0460-fixture), nothing leaves the preview.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { fixChance } from './logo-helpers.js';

const mark = (page, info) => (info.project.name === 'phone' ? page.locator('header.top .brand .mark') : page.locator('.logo .mark'));
const five = async (m) => {
  for (let i = 0; i < 5; i++) await m.click();
};

test('a flat tyre: the mark gets squashed, the bubble speaks, then everything is back', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  await fixChance(page, 'flat');
  const m = mark(page, info);
  const normal = await m.boundingBox();
  await five(m);
  const bubble = page.locator('[data-logo-flat]');
  await expect(bubble).toBeVisible();
  await expect(bubble).toContainText(T('Lucky it is only in the logo.'));
  const squashed = await m.evaluate((el) => el.getAnimations().length);
  expect(squashed).toBeGreaterThan(0);
  await expect(bubble).toHaveCount(0, { timeout: 8000 });
  await expect.poll(() => m.evaluate((el) => el.getAnimations().length), { timeout: 8000 }).toBe(0);
  const back = await m.boundingBox();
  expect(Math.round(back.height)).toBe(Math.round(normal.height));
});

test('with reduce motion only the bubble comes, the mark stays', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await fixChance(page, 'flat');
  const m = mark(page, info);
  await five(m);
  await expect(page.locator('[data-logo-flat]')).toBeVisible();
  expect(await m.evaluate((el) => el.getAnimations().length)).toBe(0);
  const box = await page.locator('[data-logo-flat]').boundingBox();
  expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width);
});
