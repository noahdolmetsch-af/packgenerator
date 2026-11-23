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
  const order = await page.evaluate(() => [...document.querySelectorAll('.wall [data-tile]')].map((x) => x.dataset.tile));
  expect(order[0]).toBe('haken');
  await expect(block.getByRole('heading', { name: T('Tick off today') })).toBeVisible();
  const tiles = block.locator('[data-act]');
  expect(await tiles.count()).toBeGreaterThan(0);
  expect(await tiles.count()).toBeLessThanOrEqual(info.project.name === 'phone' ? 4 : 8);
  const firstId = await tiles.first().getAttribute('data-act');
  const tile = block.locator(`[data-act="${firstId}"]`);
  await expect(tile).toHaveAttribute('aria-pressed', 'false');
  await press(tile, info);
  await expect(tile).toHaveAttribute('aria-pressed', 'true');
  // nothing jumps after the tick: the tile stays where it was
  expect(await block.locator('[data-act]').first().getAttribute('data-act')).toBe(firstId);
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
