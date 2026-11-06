// «Velos zuerst» (Durchklick Etappe 4, Noah 06.11.2026 «2a»): on Velos und Material the bikes stand above
// «Alles hier» (the function tiles), on the phone and on the computer. Fictional data only.
import { test, expect } from './clock.js';
import { start } from './gesamttest/lib.js';
import { settle } from './settle.js';

test('on Bikes the bike cards stand above the function tiles', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/bikes');
  await page.reload();
  await page.locator('main').waitFor();
  await settle(page);
  const card = page.locator('[data-bike-card]').first();
  const all = page.locator('[data-all-here="bikes"]');
  await expect(card).toBeVisible();
  await expect(all).toHaveCount(1);
  const [c, a] = [await card.boundingBox(), await all.boundingBox()];
  expect(c.y).toBeLessThan(a.y);
  expect(errors).toEqual([]);
});
