// E2-003 (Durchklick Etappe 2): the counts on Touren («3 geplant · 5 gefahren in 12 Monaten») first read
// «0 gefahren» until the second query came in (about 2 s with a big data set), then jumped to the real number.
// The line now shows only when both are in. Fictional data (home0460-fixture); every text the line ever shows is recorded.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

test('Touren: der Zaehler zeigt nie kurz 0 gefahren', async ({ page, context }, info) => {
  test.setTimeout(120_000);
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  const T = await openHome(page, context, info);
  await page.addInitScript(() => {
    window.__seen = [];
    const note = () => {
      for (const el of document.querySelectorAll('[data-counts], [data-packmode-open] small')) window.__seen.push(el.textContent.trim());
    };
    new MutationObserver(note).observe(document, { subtree: true, childList: true, characterData: true });
  });
  await page.goto('./#/trips');
  await page.reload();
  await expect(page.locator('main [data-counts], main [data-packmode-open] small').first()).toBeVisible();
  await page.waitForTimeout(500);
  const seen = await page.evaluate(() => window.__seen);
  expect(seen.length).toBeGreaterThan(0);
  const zero = new RegExp(`(^|\\s)0 ${T('{n} ridden').replace('{n} ', '')}`);
  expect(seen.filter((s) => zero.test(s)), `the line read «0 gefahren» while loading: ${JSON.stringify(seen)}`).toEqual([]);
  expect(errors).toEqual([]);
});
