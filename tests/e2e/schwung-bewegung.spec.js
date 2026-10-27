// «Neuer Schwung» Teil 2 (Noah 26.10.2026 «4a»: motion everywhere, kept subtle, off with «reduce motion»):
// on Heute the tiles fade in one after another, big numbers rise in, the packing bar fills and the ring draws
// itself. Nothing changes size or place while it moves, so taps work at once. Fictional data only.
import { test, expect } from '@playwright/test';
import { openHome } from './home0460-fixture.js';

const anim = (loc) => loc.evaluate((el) => getComputedStyle(el).animationName);

test('Heute moves softly: tiles one after another, numbers, bar; nothing moves its box', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info);
  const tiles = page.locator('.wall > .ti[data-tile]');
  await expect(tiles.first()).toBeVisible();
  expect(await anim(tiles.first())).toBe('sw-in');
  // one after another: a later tile waits a little longer, capped at ten steps
  const delays = await tiles.evaluateAll((els) => els.map((el) => parseFloat(getComputedStyle(el).animationDelay)));
  expect(delays[0]).toBe(0);
  if (delays.length > 1) expect(delays[1]).toBeGreaterThan(delays[0]);
  expect(Math.max(...delays)).toBeLessThanOrEqual(0.4);
  const bar = page.locator('.bar[role="progressbar"] > span').first();
  if (await bar.count()) expect(await anim(bar)).toBe('sw-fill');
  // only opacity, clip-path and stroke move, never transform: a tile keeps its place while it fades in
  await page.goto('./#/me');
  await page.goto('./#/');
  await expect(tiles.first()).toBeVisible();
  expect(await tiles.evaluateAll((els) => els.filter((el) => getComputedStyle(el).transform !== 'none').length)).toBe(0);
  expect(errors).toEqual([]);
});

test('Heute with reduce motion: nothing moves', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const tile = page.locator('.wall > .ti[data-tile]').first();
  await expect(tile).toBeVisible();
  expect(await anim(tile)).toBe('none');
  const num = page.locator('.wall .big.num, .wall b.num, .wall dd.num').first();
  if (await num.count()) expect(await anim(num)).toBe('none');
  const bar = page.locator('.bar[role="progressbar"] > span').first();
  if (await bar.count()) expect(await anim(bar)).toBe('none');
});
