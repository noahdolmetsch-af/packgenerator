// Durchklick Etappe 3 (E3-001): the race list on Touren › Rennen called its first group «Coming» in the German
// view (the key had no German text). Fictional data (tests/fixtures/gesamttest): one coming race.
import { test, expect } from './clock.js';
import { start, tr } from './gesamttest/lib.js';

test('Races: the groups of the race list are German', async ({ page, context }, info) => {
  await start(page, context, info);
  await page.goto('./#/race');
  await expect(page.locator('h1')).toHaveText(tr('de')('Races'));
  const heads = await page.locator('main h2.rc-h2').allInnerTexts();
  expect(heads.map((h) => h.trim())).toContain('Kommende');
  expect(heads.map((h) => h.trim())).not.toContain('Coming');
});
