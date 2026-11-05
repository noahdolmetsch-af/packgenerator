// «Deine Abkürzungen» on Heute (frontend walk E1-006, Noah 05.11.2026): a long German word like «Werkzeugkasten»
// on a shortcut button must not break in the middle of the word, on the phone and on the computer.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

test('Heute: a long word on a shortcut stays whole', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await page.goto('./#/');
  await page.locator('[data-tile="pins"] .pt-pin').first().waitFor({ timeout: 15_000 });
  const res = await page.evaluate(() => {
    const b = document.querySelector('[data-tile="pins"] .pt-pin');
    b.textContent = 'Werkzeugkasten';
    const cs = getComputedStyle(b);
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const inner = b.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    return { word: ctx.measureText('Werkzeugkasten').width, inner };
  });
  expect(res.word, `the word needs ${res.word}px, the button has ${res.inner}px inside`).toBeLessThanOrEqual(res.inner);
});
