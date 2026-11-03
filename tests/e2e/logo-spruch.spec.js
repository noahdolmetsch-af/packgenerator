// «Velo-Weisheit» (Geheimmenü H6, Noah 03.11.2026): five quick taps on PG can show a saying in a speech bubble.
// Fictional data (home0460-fixture), nothing leaves the preview.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

const mark = (page, info) => (info.project.name === 'phone' ? page.locator('header.top .brand .mark') : page.locator('.logo .mark'));
const five = async (m) => {
  for (let i = 0; i < 5; i++) await m.click();
};

test('a saying appears, goes away; the next five taps give the bike (never the same twice)', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await page.evaluate(() => (Math.random = () => 0.99)); // the last of the two: the saying
  const m = mark(page, info);
  await five(m);
  const bubble = page.locator('[data-logo-saying]');
  await expect(bubble).toBeVisible();
  await expect(bubble).toContainText('«');
  await expect(bubble).toHaveCount(0, { timeout: 8000 }); // gone by itself
  await five(m);
  await expect(page.locator('[data-logo-ride]')).toBeVisible();
  await expect(bubble).toHaveCount(0);
});

test('with reduce motion the saying stays readable and inside the screen', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => (Math.random = () => 0.99));
  await five(mark(page, info));
  const bubble = page.locator('[data-logo-saying]');
  await expect(bubble).toBeVisible();
  const box = await bubble.boundingBox();
  const vw = page.viewportSize().width;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(vw);
});

test('the sayings are a list in Lists and types', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  await page.goto('./#/me/lists?sayings');
  await expect(page.getByText(T('Gägewind isch Gratis-Training.'), { exact: false }).or(page.getByText('A headwind is free training.')).first()).toBeVisible();
});
