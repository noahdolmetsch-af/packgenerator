// «Geheimnis im Logo» (Noah 03.11.2026, Idee 29): five quick taps on «PG» send a small bike across the screen.
// Fictional data (home0460-fixture), nothing leaves the preview.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { fixChance } from './logo-helpers.js';

const mark = (page, info) => (info.project.name === 'phone' ? page.locator('header.top .brand .mark') : page.locator('.logo .mark'));

test('five quick taps on PG: the bike rides, fewer do not', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  await fixChance(page, 'bike'); // the surprise is picked by chance: this test wants the bike
  const m = mark(page, info);
  for (let i = 0; i < 4; i++) await m.click();
  await expect(page.locator('[data-logo-ride]')).toHaveCount(0);
  await m.click();
  await expect(page.locator('[data-logo-ride]')).toBeVisible();
  await expect(page.locator('[data-logo-ride]')).toContainText(T('Have a good ride!'));
  await expect(page.locator('[data-logo-ride]')).toHaveCount(0, { timeout: 6000 }); // gone by itself
});

test('with reduce motion the bike stands still in the middle', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await page.emulateMedia({ reducedMotion: 'reduce' }); // after the import: the CSS answers at once
  await fixChance(page, 'bike');
  const m = mark(page, info);
  for (let i = 0; i < 5; i++) await m.click();
  const ride = page.locator('[data-logo-ride]');
  await expect(ride).toBeVisible();
  const box = await ride.boundingBox();
  const vw = page.viewportSize().width;
  expect(Math.abs(box.x + box.width / 2 - vw / 2)).toBeLessThan(4);
});
