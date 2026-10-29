// «Neuer Schwung» Aufklappen (Noah 26.10.2026 «2a», 27.10.2026 «alle offen, gemerkt»): on a phone every area of Today
// starts open; a tap on its heading folds it to one line with its tiles' names, and the phone remembers it after a
// reload. A computer shows every area open with a plain heading. Fictional data.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

test('Aufklappen: an area folds and opens on a phone and is remembered', async ({ page, context }, info) => {
  await openHome(page, context, info);
  const secs = page.locator('[data-home-sec]');
  await expect(secs.first()).toBeVisible();
  if (info.project.name !== 'phone') {
    await expect(page.locator('[data-sec-toggle]')).toHaveCount(0);
    return;
  }
  const toggles = page.locator('[data-sec-toggle]');
  const n = await toggles.count();
  expect(n).toBeGreaterThan(1);
  for (let i = 0; i < n; i++) await expect(toggles.nth(i)).toHaveAttribute('aria-expanded', 'true');
  const key = await toggles.nth(1).getAttribute('data-sec-toggle');
  const tilesIn = () => page.locator(`[data-home-sec="${key}"] ~ *`).first();
  const first = await tilesIn().getAttribute('data-tile');
  await toggles.nth(1).click();
  await expect(toggles.nth(1)).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator(`[data-home-sec="${key}"] [data-sec-sum]`)).toBeVisible();
  if (first) await expect(page.locator(`.wall [data-tile="${first}"]`)).toHaveCount(0);
  await page.reload();
  await expect(page.locator(`[data-sec-toggle="${key}"]`)).toHaveAttribute('aria-expanded', 'false');
  await page.locator(`[data-sec-toggle="${key}"]`).click();
  await expect(page.locator(`[data-sec-toggle="${key}"]`)).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('[data-unfold-all]')).toHaveCount(0);
  // «Alle aufklappen» (Noah 27.10.2026 «ja»): shows while an area is folded and opens them all
  for (let i = 0; i < n; i++) await toggles.nth(i).click();
  await page.locator('[data-unfold-all]').click();
  for (let i = 0; i < n; i++) await expect(toggles.nth(i)).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('[data-unfold-all]')).toHaveCount(0);
  await expect(page.locator(`[data-home-sec="${key}"] [data-sec-sum]`)).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});
