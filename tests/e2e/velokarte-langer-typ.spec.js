// Velokarte mit langem importiertem Typ (Durchklick Etappe 4, Frage 4a): on the phone «A/B (Quelle)» in the
// small bike card breaks after the slash, never in the middle of a word. Fictional data only.
import { test, expect } from './clock.js';
import { start, fixture, brokenWords, sideways } from './gesamttest/lib.js';

test('a long imported type in the bike card does not break in the middle of a word', async ({ page, context }, info) => {
  const data = structuredClone(fixture().data);
  data.tables.bikes[1].type = 'Rennvelo/Strassenfahren (Beispielquelle)';
  const errors = await start(page, context, info, { data });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./#/bikes');
  await page.reload();
  await page.locator('main').waitFor();
  await page.locator('[data-bike-card]').first().waitFor();

  expect(await brokenWords(page)).toEqual([]);
  const sw = await sideways(page);
  expect(sw.sw).toBeLessThanOrEqual(sw.w + 1);
  expect(errors).toEqual([]);
});
