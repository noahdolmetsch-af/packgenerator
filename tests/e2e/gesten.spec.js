// «Heute als Begleiter» PR 12 (Noah 28.10.2026 «1a 2a 3a», answer «a»): «Gestures and tricks», a folded list at the end of
// «Help and functions»; the search narrows it and opens it. German, phone and computer, no sideways scroll.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { TRICKS } from '../../src/lib/know/gesten.js';

test('Gestures and tricks: folded, 4 groups when opened, the search narrows and opens it', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info);
  await page.goto('./#/features');
  const block = page.locator('[data-block="tricks"]');
  await block.scrollIntoViewIfNeeded();
  await expect(block.getByRole('button', { name: new RegExp(T('Gestures and tricks')) })).toBeVisible();
  await expect(block.locator('[data-trick]')).toHaveCount(0);
  await block.getByRole('button').first().click();
  await expect(block.locator('[data-tricks-group]')).toHaveCount(4);
  await expect(block.locator('[data-trick]')).toHaveCount(TRICKS.reduce((n, g) => n + g.items.length, 0));
  await expect(block.locator('[data-trick="g.packswipe"]')).toContainText(T('Packing list: swipe to tick'));
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await block.getByRole('button').first().click();
  await expect(block.locator('[data-trick]')).toHaveCount(0);
  // the search of the page narrows the list and opens it
  await page.getByLabel(T('Find a function')).fill('wischen');
  await expect(block.locator('[data-trick="g.tabswipe"]')).toBeVisible();
  expect(await block.locator('[data-trick]').count()).toBeLessThan(TRICKS.reduce((n, g) => n + g.items.length, 0));
  expect(errors).toEqual([]);
});
