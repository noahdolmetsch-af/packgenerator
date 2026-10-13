// Wächter «Noch alles da?»: the 16 functions (src/lib/home/fnlist.js) are each reachable from Today in
// at most two taps and open their page or window without a console error. Since v0.94.0 «Kachel-Wand»
// each is a small tile on the ready wall (1 tap); a tile taken away comes back through «+» (the catalog
// lists all 16). The list below is written out on purpose: when a function disappears, this test fails. Fictional data of
// home0460-fixture.js (test_data_gtp_ records), clock on Friday 9 October 2026, Open-Meteo mocked.
import { test, expect } from '@playwright/test';
import { openHome } from './home0460-fixture.js';

/** id → where it must lead: an address, or a window ([selector of the open dialog], and the address). */
const EXPECTED = {
  dayride: { url: /#\/$/, card: '[data-quick-made]' }, // v0.119.0 «Schnellstart»: the trip is made, Today stays
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

  // the catalog lists exactly these 16 as tiles
  await page.getByRole('button', { name: /^(Add a tile|Kachel hinzufügen)$/ }).click();
  const sheet = page.getByRole('dialog');
  const listed = await sheet.locator('[data-add^="fn:"]').evaluateAll((els) => els.map((e) => e.dataset.add.slice(3)));
  expect(listed.sort()).toEqual(Object.keys(EXPECTED).sort());
  await page.keyboard.press('Escape');

  const wall = page.locator('.wall');
  const taps = {};
  for (const [id, want] of Object.entries(EXPECTED)) {
    await page.goto('./#/');
    await page.reload();
    await expect(wall.locator('.plusw')).toBeVisible();
    const before = errors.length;
    const direct = wall.locator(`[data-fn="${id}"]`);
    await expect(direct, `${id} is a tile on the ready wall`).toBeVisible();
    await direct.click(); // 1 tap
    taps[id] = 1;
    if (want.url) await expect(page, `${id} leads to its page`).toHaveURL(want.url);
    if (want.dialog) await expect(page.locator(want.dialog), `${id} opens its window`).toBeVisible();
    if (want.card) await expect(page.locator(want.card), `${id} shows what it made`).toBeVisible();
    if (want.url && !want.dialog) await expect(page.locator('main h1').first(), `${id}: the page has its title`).toBeVisible();
    await page.waitForTimeout(300); // errors of the page's first load
    expect(errors.slice(before), `${id}: no console error`).toEqual([]);
  }
  console.log(`16 functions (${info.project.name}): ${Object.entries(taps).map(([k, n]) => `${k} ${n}`).join(', ')}`);
  expect(Object.values(taps).every((n) => n <= 2)).toBe(true);
});

// v0.51.0 (Noah 11): «Im Flow» is reachable from Today's card (1 tap) and from «Mehr» (2 taps).
test('Im Flow: one tap from its card on Today, two taps through More', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info);
  const card = page.locator('[data-section="flow"]');
  await card.getByRole('link', { name: /Im Flow|In the flow/ }).click(); // 1 tap
  await expect(page).toHaveURL(/#\/flow$/);
  // Design-Refresh P8 (A1): the page is titled «Aktiv», like its place
  await expect(page.locator('main h1')).toHaveText(/^(Aktiv|Active)$/);
  await page.goto('./#/');
  // v0.76.0 «Fünf Orte»: Aktiv is a place of its own, one tap from every page
  await page.locator('nav.bottom a[data-place="active"], .side li[data-place="active"] > a.pa').click(); // 1
  await expect(page).toHaveURL(/#\/flow$/);
  await expect(page.locator('main h1')).toHaveText(/^(Aktiv|Active)$/);
  expect(errors).toEqual([]);
});
