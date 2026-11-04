// «Wetter neu» PR 2 (Noah 04.11.2026 «5 alle»): the weather page in four parts. Made-up place and weather.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

test('Weather: four parts, the address names one, the last one is remembered', async ({ page, context }) => {
  await openHome(page, context, test.info());
  await page.goto('./#/wetter');
  const tabs = page.locator('[data-wx-tabs]');
  await expect(tabs.locator('[data-wx-tab]')).toHaveCount(4);
  await expect(tabs.locator('[data-wx-tab="jetzt"]')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-wx-today], [data-wx-error]').first()).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('[data-wx-cams]')).toHaveCount(0);

  await tabs.locator('[data-wx-tab="radar"]').click();
  await expect(page.locator('[data-wx-cams]')).toBeVisible();
  await expect(page.locator('[data-wx-window="landi"]')).toBeVisible();
  await expect(page.locator('[data-wx-today]')).toHaveCount(0);

  await tabs.locator('[data-wx-tab="planen"]').click();
  await expect(page.locator('[data-wx-climate]')).toBeVisible();
  await tabs.locator('[data-wx-tab="rueckblick"]').click();
  await expect(page.locator('[data-wx-climate]')).toHaveCount(0);

  // the address wins over what was chosen last
  await page.goto('./#/wetter?tab=radar');
  await page.reload();
  await expect(page.locator('[data-wx-tab="radar"]')).toHaveAttribute('aria-selected', 'true');
  // without an address the last choice is back
  await page.goto('./#/wetter');
  await page.reload();
  await expect(page.locator('[data-wx-tab="rueckblick"]')).toHaveAttribute('aria-selected', 'true');
  const side = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(side).toBeLessThanOrEqual(1);
});
