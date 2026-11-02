// «Wegweiser statt Katalog» PR 24: a robot opens every page that shows «What you can do here» and checks that the card has
// rows, that each row brings «Good to know» and that nothing scrolls sideways. Fictional data (test_data_gtp_).
import { test, expect } from './clock.js';
import { openHome, tr } from './home0460-fixture.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// seiteninhalt.js needs Svelte (through features.js), so ON_PAGES is read as text
const SRC = readFileSync(fileURLToPath(new URL('../../src/lib/seiteninhalt.js', import.meta.url)), 'utf8');
const PAGES = SRC.match(/export const ON_PAGES = \[([\s\S]*?)\];/)[1].replace(/\/\/.*$/gm, '').match(/'#\/[^']*'/g).map((s) => s.slice(1, -1));

const T = tr('de');

test(`every page with the card shows its functions with good to know (${PAGES.length} pages)`, async ({ page, context }, info) => {
  expect(PAGES.length).toBeGreaterThan(0);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info);
  for (const p of PAGES) {
    await page.goto(`./${p}`);
    const card = page.locator(`[data-seiteninhalt="${p}"]`);
    await expect(card, p).toContainText(T('What you can do here'));
    const rows = card.locator('[data-seiteninhalt-item]');
    await expect(rows.first(), p).toBeVisible();
    for (const id of await rows.evaluateAll((els) => els.map((e) => e.getAttribute('data-seiteninhalt-item')))) {
      await expect(card.locator(`[data-seiteninhalt-know="${id}"]`), `${p} ${id}`).toContainText(T('Good to know'));
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), p).toBe(0);
  }
  expect(errors).toEqual([]);
});
