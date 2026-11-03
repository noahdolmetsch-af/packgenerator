// «Heute als Begleiter» PR 5 (Noah 28.10.2026 «1a 2a 3a»): the card «Discover» on Today: one function that fits the moment,
// «Later» (back tomorrow), «Not for me» with Undo. German, phone and computer, fictional data (home0460-fixture), no sideways scroll.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { mkdirSync } from 'node:fs';

test('Discover: one function for the moment, Not for me with Undo, Later hides it', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { hour: 9 });
  const card = page.locator('[data-section="discover"]');
  await card.scrollIntoViewIfNeeded();
  await expect(card).toContainText(T('Discover|tile'));
  const first = await card.locator('[data-discover]').getAttribute('data-discover');
  expect(first).toMatch(/^f\./);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  if (process.env.SHOTS) {
    mkdirSync(process.env.SHOTS, { recursive: true });
    await card.evaluate((e) => { e.style.outline = '3px solid #d9480f'; e.style.outlineOffset = '3px'; });
    await page.screenshot({ path: `${process.env.SHOTS}/discover-${info.project.name === 'phone' ? 390 : 1440}.png` });
  }
  await card.locator('[data-discover-not]').click();
  await expect(card.locator('[data-discover-undo]')).toContainText(T('Undo|discover'));
  await card.locator('[data-discover-undo] button').click();
  await expect(card.locator('[data-discover]')).toHaveAttribute('data-discover', first);
  await card.locator('[data-discover-later]').click();
  await expect(card.locator('[data-discover]')).not.toHaveAttribute('data-discover', first);
  expect(errors).toEqual([]);
});
