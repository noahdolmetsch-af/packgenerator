// «Alpenpanorama» (Geheimmenü H7, Noah 03.11.2026): five quick taps on PG can pull the Alps through the picture.
// Fictional data (home0460-fixture), nothing leaves the preview.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { fixChance } from './logo-helpers.js';

const mark = (page, info) => (info.project.name === 'phone' ? page.locator('header.top .brand .mark') : page.locator('.logo .mark'));
const five = async (m) => {
  for (let i = 0; i < 5; i++) await m.click();
};

test('the Alps pull through the picture, then go away; the page gets no sideways scroll', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await fixChance(page, 'panorama');
  await five(mark(page, info));
  const pan = page.locator('[data-logo-panorama]');
  await expect(pan).toBeVisible();
  await expect(pan).toContainText('Aussicht');
  await page.waitForTimeout(1500); // the rows are wider than the screen but never widen the page
  const scroll = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(scroll).toBeLessThanOrEqual(0);
  await expect(pan).toHaveCount(0, { timeout: 9000 }); // gone by itself
});

test('with reduce motion the mountains stand still inside the screen', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await fixChance(page, 'panorama');
  await five(mark(page, info));
  const pan = page.locator('[data-logo-panorama]');
  await expect(pan).toBeVisible();
  const box = await pan.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width);
  const far = await pan.locator('svg.far').boundingBox();
  expect(far.x).toBeGreaterThanOrEqual(0);
  expect(far.x + far.width).toBeLessThanOrEqual(page.viewportSize().width + 1);
});
