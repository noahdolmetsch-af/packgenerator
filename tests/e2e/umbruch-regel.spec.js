// Durchklick Etappe 3 (Noah «2a»): a very long word is broken at the edge everywhere: the rule sits on body (app.css).
import { test, expect } from './clock.js';
import { start, sideways } from './gesamttest/lib.js';

test('Ein sehr langes Wort in Überschrift, Absatz, Liste und Kasten macht die Seite nicht breiter', async ({ page, context }, info) => {
  await start(page, context, info);
  await page.goto('./#/trips');
  await page.locator('main').waitFor();
  await page.evaluate(() => {
    const word = 'W'.repeat(150);
    const box = document.createElement('div');
    box.id = 'wrap-probe';
    box.innerHTML = `<h2>${word}</h2><h3>${word}</h3><p>${word}</p><ul><li>${word}</li></ul><div><span>${word}</span></div>`;
    document.querySelector('main').append(box);
  });
  const s = await sideways(page);
  expect(s.sw, `page ${s.sw} px wide on a ${s.w} px screen`).toBeLessThanOrEqual(s.w + 1);
});
