// «Cardio-Belastung» Idee D (Noah 07.11.2026 «alle A–F»): «Wie wird gerechnet?» folds open and shows the weights and a
// real day as the example. German, phone + desktop; fictional Fitbit days; the clock stands on Friday 9 October 2026.
import { test, expect } from './clock.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

test('Cardio load: «Wie wird gerechnet?» shows the weights and the newest day as an example', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  const healthDays = [0, 1, 2].map((i) => ({ date: addDays(TODAY, -i), restingHr: 50, hrZones: { light: 60, mod: 12, vig: 4, peak: 0 }, src: 'google', at: `${addDays(TODAY, -i)}T08:00:00Z` }));
  await put(page, { healthDays });
  await page.goto('./#/auswerten/analyse/cardioLoad');
  await page.reload();
  await ready(page);
  const calc = page.locator('[data-calc]');
  await expect(calc.locator('summary')).toHaveText('Wie wird gerechnet?');
  await expect(calc.locator('[data-calc-example]')).toBeHidden(); // folded
  await calc.locator('summary').click();
  await expect(calc.locator('.zw li')).toHaveCount(4);
  await expect(calc.locator('.zw')).toContainText('×4');
  await expect(calc.locator('[data-calc-example]')).toContainText('60 Min. leicht ×1 + 12 Min. mittel ×2 + 4 Min. hart ×3 = 96 Punkte');
  if (process.env.ANALYSE_SHOTS) await page.screenshot({ path: `qa/analyse/analyse-rechnung-${info.project.name}.png`, fullPage: true });
  // other values have no such fold
  await page.goto('./#/auswerten/analyse/rhr');
  await expect(page.locator('[data-calc]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
