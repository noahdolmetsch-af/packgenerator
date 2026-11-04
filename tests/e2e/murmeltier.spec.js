// «Ein Murmeltier als Begleiter» (Noah 03.11.2026, Idee 28): a little marmot on empty pages and beside tips, switchable.
// Fictional data (home0460-fixture), nothing leaves the preview.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

test('the marmot sits beside a tip and the switch takes it away', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await page.goto('./#/gear');
  const tip = page.locator('[data-tip]').first();
  await expect(tip.locator('[data-murmeltier]')).toBeVisible();
  await page.evaluate(() => localStorage.setItem('ops.murmeltier', '0'));
  await page.reload();
  await expect(page.locator('[data-tip]').first()).toBeVisible();
  await expect(page.locator('[data-murmeltier]')).toHaveCount(0);
});
