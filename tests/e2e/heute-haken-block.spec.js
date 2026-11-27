// «Heute abhaken» als erster Block auf Heute (Noah 23.11.2026 «1a 2a»): one tap ticks, «Rückgängig» takes back,
// «Alle ›» opens the page, «Aktiv heute» does not show the same tile again, «n Dinge dran» jumps to «Jetzt dran».
// The app seeds its own fictional activities; no personal data.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { flowSeeded } from './wall-fixture.js';
import { openHome, homeFixture } from './home0460-fixture.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};

async function open(page, context, info) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: homeFixture() });
  await flowSeeded(page);
  await page.reload();
  const ab = page.locator('[data-section="abfragen"]');
  if (await ab.isVisible().catch(() => false)) await ab.locator('[data-ab-later]').click();
  return errors;
}
const press = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());

test('Heute: the haken block is the first tile and ticks with one tap', async ({ page, context }, info) => {
  const errors = await open(page, context, info);
  const block = page.locator('[data-section="haken"]');
  await expect(block).toBeVisible();
  // «Heute abhaken» stands right under the chips, above the wall and above the cards under the greeting (Noah 23.11.2026 «1a 2a»)
  await expect(page.locator('[data-haken-top] [data-section="haken"]')).toBeVisible();
  const before = await page.evaluate(() => {
    const hk = document.querySelector('[data-haken-top]');
    const wall = document.querySelector('.wall');
    const chips = document.querySelector('.ghead');
    const after = (a, b) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    return { chips: after(chips, hk), wall: after(hk, wall), noTile: !document.querySelector('.wall [data-tile="haken"]') };
  });
  expect(before).toEqual({ chips: true, wall: true, noTile: true });
  await expect(block.getByRole('heading', { name: T('Tick off today') })).toBeVisible();
  // «Abhaken auf einen Blick» (Noah 27.11.2026 «2a»): the chip «Abhaken» would only repeat the block, so it is not there; the other chips stay
  await expect(page.locator('[data-goals] [data-goal="tick"]')).toHaveCount(0);
  await expect(page.locator('[data-goals] [data-goal="ride"]')).toBeVisible();
  const tiles = block.locator('[data-act]');
  expect(await tiles.count()).toBeGreaterThan(0);
  // «Abhaken auf einen Blick» (Noah 27.11.2026 «1a», changed on purpose): ALL activities of today are in the block, not only 4 or 8
  await expect(tiles.first()).toBeVisible();
  const total = Number(((await block.locator('.sd').first().textContent()) ?? '').match(/von (\d+)/)?.[1]);
  await expect(tiles).toHaveCount(total); // the header counts the same fields it shows
  await expect(block.locator('[data-more]')).toHaveCount(0); // a dense field has no «•••», the long press opens the sheet
  await expect(block.locator('.hd .sd, .th .sd')).toContainText(`0 von ${total}`);
  // the tap on the meditation opens its start sheet instead of ticking (MedStartSheet), so the check takes the first other field
  const firstId = await block.locator('[data-act]:not([data-act="meditation"])').first().getAttribute('data-act');
  const tile = block.locator(`[data-act="${firstId}"]`);
  await expect(tile).toHaveAttribute('aria-pressed', 'false');
  await press(tile, info);
  await expect(tile).toHaveAttribute('aria-pressed', 'true');
  // nothing jumps after the tick: the tile stays where it was
  expect(await block.locator('[data-act]:not([data-act="meditation"])').first().getAttribute('data-act')).toBe(firstId);
  await press(page.locator('.ftoast').getByRole('button', { name: T('Undo') }), info);
  await expect(tile).toHaveAttribute('aria-pressed', 'false');
  expect(errors).toEqual([]);
});

test('Heute: All opens the page, and Aktiv heute shows no tile twice', async ({ page, context }, info) => {
  await open(page, context, info);
  const block = page.locator('[data-section="haken"]');
  await expect(block).toBeVisible();
  const ids = await block.locator('[data-act]').evaluateAll((els) => els.map((e) => e.dataset.act));
  const acts = page.locator('[data-section="acts"]');
  if (await acts.count()) for (const id of ids) await expect(acts.locator(`[data-act="${id}"]`)).toHaveCount(0);
  await press(block.locator('[data-haken-all]'), info);
  await expect(page).toHaveURL(/#\/flow/);
});

test('Heute: n things to do under the greeting jumps to Up now', async ({ page, context }, info) => {
  await open(page, context, info);
  const jump = page.locator('[data-say-jump]');
  await expect(jump).toBeVisible();
  await press(jump, info);
  await expect(page.locator('#imp-h')).toBeInViewport();
});
