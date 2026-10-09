// Wächter «Noch alles da?»: the 16 functions of "All 16 functions" (src/lib/home/functions.js) are each
// reachable from Today in at most two taps (a button in "What do you want to do?", or "All 16" and the
// row in its sheet) and open their page or window without a console error. The list below is written
// out on purpose: when a function disappears from Today, this test fails. Fictional data of
// home0460-fixture.js (test_data_gtp_ records), clock on Friday 9 October 2026, Open-Meteo mocked.
import { test, expect } from '@playwright/test';
import { openHome } from './home0460-fixture.js';

/** id → where it must lead: an address, or a window ([selector of the open dialog], and the address). */
const EXPECTED = {
  dayride: { url: /#\/pack$/ },
  trip: { url: /#\/pack$/, dialog: 'dialog.trip-dlg[open]' },
  wear: { dialog: 'dialog.wear[open]' },
  weigh: { url: /#\/gear\?tab=weigh$/ },
  care: { url: /#\/bikes\?tab=care$/ },
  ride: { url: /#\/debrief\/ride$/ },
  gear: { url: /#\/gear$/ },
  wardrobe: { url: /#\/wardrobe$/ },
  templates: { url: /#\/pack\/templates$/ },
  wish: { url: /#\/gear\?tab=wishlist$/ },
  review: { url: /#\/debrief$/ }, // v0.49.0 R1: the one Rückblick page
  note: { url: /#\/inbox$/ }, // the fixture has open notes: the Inbox (without notes: the quick note)
  km: { dialog: 'dialog.new[open]' },
  blocks: { url: /#\/blocks$/ },
  favorites: { url: /#\/favorites$/ },
  debriefs: { url: /#\/pack\/past$/ }, // v0.49.0 R1: past trips, an open debrief marked in its row
};

test('all 16 functions: two taps from Today at most, each page opens without an error', async ({ page, context }, info) => {
  test.setTimeout(120_000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    // the blocked outside world (fonts, maps) is the test's own doing, not the app's
    if (m.type() === 'error' && !/net::ERR_FAILED|ERR_BLOCKED|Failed to load resource/.test(m.text())) errors.push(`console: ${m.text()}`);
  });
  page.on('dialog', (d) => d.dismiss());
  await openHome(page, context, info);

  const grid = page.locator('[data-section="actions"] .grid');
  // the sheet lists exactly these 16
  await grid.locator('[data-fn="all"]').click();
  const sheet = page.locator('dialog.fnsheet[open]');
  await expect(sheet.locator('.fnrow')).toHaveCount(16);
  expect((await sheet.locator('.fnrow').evaluateAll((els) => els.map((e) => e.dataset.fn))).sort()).toEqual(Object.keys(EXPECTED).sort());

  const taps = {};
  for (const [id, want] of Object.entries(EXPECTED)) {
    await page.goto('./#/');
    await page.reload();
    await expect(grid.locator('[data-fn="all"]')).toBeVisible();
    const before = errors.length;
    const direct = grid.locator(`[data-fn="${id}"]`);
    if (await direct.isVisible()) {
      await direct.click(); // 1 tap
      taps[id] = 1;
    } else {
      await grid.locator('[data-fn="all"]').click(); // 2 taps: All 16, then the row
      const row = page.locator(`dialog.fnsheet[open] [data-fn="${id}"]`);
      await expect(row, `${id} is in "All 16 functions"`).toBeVisible();
      await row.click();
      taps[id] = 2;
    }
    if (want.url) await expect(page, `${id} leads to its page`).toHaveURL(want.url);
    if (want.dialog) await expect(page.locator(want.dialog), `${id} opens its window`).toBeVisible();
    if (want.url && !want.dialog) await expect(page.locator('main h1').first(), `${id}: the page has its title`).toBeVisible();
    await page.waitForTimeout(300); // errors of the page's first load
    expect(errors.slice(before), `${id}: no console error`).toEqual([]);
  }
  console.log(`16 functions (${info.project.name}): ${Object.entries(taps).map(([k, n]) => `${k} ${n}`).join(', ')}`);
  expect(Object.values(taps).every((n) => n <= 2)).toBe(true);
});
