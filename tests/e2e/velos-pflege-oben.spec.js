// Velos nach impeccable (Noah 23.11.2026 «1-5 a», 2): on a phone «Care and equipment» stands before the bags, the Garmin pages are one
// row in «More»; on a computer the page stays as it was (care on the right, the Garmin card). Fictional fixture.
import { test, expect } from './clock.js';
import { fileURLToPath } from 'node:url';
import { importAndSettle } from './settle.js';

const fixture = fileURLToPath(new URL('./fixture.json', import.meta.url));

test('Bikes: on a phone care comes before the bags and Garmin is a row in More', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await page.goto('./');
  await importAndSettle(page, fixture);
  await page.goto('./#/bikes');
  await expect(page.locator('[data-bike-detail]')).toBeVisible();
  const care = page.locator('section[aria-labelledby="pa-h"]');
  const bags = page.locator('section.std');
  await expect(care).toBeVisible();
  await expect(bags).toBeVisible();
  const yCare = (await care.boundingBox()).y;
  const yBags = (await bags.boundingBox()).y;
  if (info.project.name === 'phone') {
    expect(yCare).toBeLessThan(yBags);
    await expect(page.locator('section.gcard')).toHaveCount(0);
    await expect(page.locator('[data-garmin-row]')).toHaveCount(1);
  } else {
    // a computer: care stands in the right column, beside the bags
    expect(await page.locator('[data-garmin-row]').count()).toBe(0);
    await expect(page.locator('section.gcard')).toHaveCount(1);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});
