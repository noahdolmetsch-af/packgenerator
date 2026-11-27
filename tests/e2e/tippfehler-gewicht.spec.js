// «Tippfehler-Frage» (Warteliste 6; Noah 22.11.2026 «1a», «4a», «5a»): a weight that looks like a slip is asked about under the field, never
// blocked; «Yes» puts the suggestion in, «It is right» is remembered. Fictional data (home0460 fixture), German.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { mkdirSync } from 'node:fs';

test('Weight: 700 asks, Yes puts 70 in, It is right is remembered and nothing blocks saving', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { hour: 9 });
  await page.goto('./#/me/weight');
  await page.locator('[data-weight-add]').click();
  const kg = page.locator('[data-weight-kg]');
  await kg.fill('700');
  await kg.blur();
  const line = page.locator('[data-typo-line]');
  await expect(line).toBeVisible();
  await expect(line).toContainText('Meintest du 70');
  if (process.env.SHOTS) {
    mkdirSync(process.env.SHOTS, { recursive: true });
    await page.screenshot({ path: `${process.env.SHOTS}/tippfehler-${info.project.name === 'phone' ? 390 : 1440}.png` });
  }
  await page.locator('[data-typo-use]').click();
  await expect(kg).toHaveValue('70');
  await expect(line).toHaveCount(0);
  // a value marked as right is kept and not asked about again
  await kg.fill('300');
  await kg.blur();
  await expect(line).toBeVisible();
  await page.locator('[data-typo-right]').click();
  await expect(line).toHaveCount(0);
  await kg.fill('301');
  await kg.blur();
  await expect(line).toBeVisible();
  await kg.fill('300');
  await kg.blur();
  await expect(line).toHaveCount(0);
  // saving works: the old hard limit is gone
  await page.locator('[data-weight-sheet] button[type="submit"]').click();
  await expect(page.locator('[data-weight-sheet]')).not.toBeVisible();
  await expect(page.locator('[data-weight-day]').first()).toContainText('300');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});
