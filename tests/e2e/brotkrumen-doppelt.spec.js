// Durchklick Etappe 2, Frage 2a (Noah 05.11.2026): the path line above a page never says a name twice
// («Touren › Übersicht › Touren», «Material › Alles › Material»). Fictional data (home0460-fixture), German.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

for (const hash of ['#/trips', '#/gear', '#/week', '#/flow', '#/auswerten']) {
  test(`${hash}: no name twice in the path line`, async ({ page, context }, info) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await openHome(page, context, info, { hour: 9 });
    await page.goto('./' + hash);
    await page.locator('main h1').first().waitFor();
    const line = page.locator('[data-pathline]');
    await expect(line).toBeVisible();
    // the title is read after the page is drawn: give the line a moment, then read it
    await page.waitForTimeout(800);
    const names = (await line.locator('a, [aria-current="page"]').allInnerTexts()).map((x) => x.trim());
    expect(names.length).toBeGreaterThan(0);
    expect(new Set(names).size, names.join(' › ')).toBe(names.length);
    // the last step is the page itself
    await expect(line.locator('[aria-current="page"]')).toHaveCount(1);
  });
}
