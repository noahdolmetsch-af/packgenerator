// Etappe 6 (Querschnitt, E6-009): at browser zoom 200 % on a 1440x900 screen (720x450) the head of a running tour
// squeezed its name into a column of a few letters, letter by letter, next to the buttons.
import { test, expect } from './clock.js';
import { start, brokenWords } from './gesamttest/lib.js';
import { ready } from './settle.js';

test('zoom 200 %: the tour name keeps a readable width', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'desktop', 'a window size, not a phone');
  test.setTimeout(120_000);
  await start(page, context, info);
  await page.setViewportSize({ width: 720, height: 450 });
  await page.goto('./#/ride');
  await page.reload();
  await ready(page);
  await page.waitForTimeout(700);
  const h1 = page.locator('h1[data-trip-title]').first();
  await expect(h1).toBeVisible();
  const box = await h1.boundingBox();
  expect.soft(box?.width ?? 0, 'the name has room for words, not letters').toBeGreaterThan(150);
  expect.soft(await brokenWords(page), 'no word broken letter by letter').toEqual([]);
});
