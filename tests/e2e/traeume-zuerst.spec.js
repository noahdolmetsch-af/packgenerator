// «Träume: deine Träume zuerst» (impeccable F3, Noah «1-5a» 24.11.2026): the field to add a dream and the views List · Map · Year
// come right behind the title; the intro and «So geht's» stand at the page end, the one help sentence under the views, the outing tips under the list.
// Fictional data (home0460 fixture), German.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

test.use({ cardsOpen: false });

test('Dreams: the list comes first, the help sentence stays under the views, intro and So geht\'s stand at the end', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { hour: 9 });
  await page.goto('./#/trips/dreams');
  await expect(page.locator('[data-dreams-views]')).toBeVisible();
  const y = async (sel) => (await page.locator(sel).first().boundingBox()).y + (await page.evaluate(() => window.scrollY));
  const add = await y('[data-dream-add]');
  const views = await y('[data-dreams-views]');
  const more = await y('[data-dreams-more]');
  expect(add).toBeLessThan(views);
  expect(views).toBeLessThan(more);
  expect(await y('[data-intro]')).toBeGreaterThan(views);
  // the outing tips stand under the list (and the views), not before them
  if (await page.locator('[data-trip-tips]').count()) expect(await y('[data-trip-tips]')).toBeGreaterThan(views);
  // on a phone the views are on the first screen
  if (info.project.name === 'phone') expect(views).toBeLessThan(900);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});
