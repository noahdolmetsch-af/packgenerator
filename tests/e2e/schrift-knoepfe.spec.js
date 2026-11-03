// Drei schnelle Schrift-Knöpfe (Noah 03.11.2026 «Drei Knöpfe dazu»). Fictional data only. SHOTS=<folder> saves pictures.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const zoomOf = (page) => page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).zoom));

test.beforeEach(async ({ context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
});

test('Ich › Darstellung: Klein, Normal, Gross stellen die Schrift sofort ein', async ({ page }, info) => {
  await page.goto('./#/me/look');
  const box = page.locator('[data-size-presets]');
  await expect(box.getByRole('button')).toHaveCount(3);
  await expect(box.locator('[data-size="normal"]')).toHaveAttribute('aria-pressed', 'true');
  await box.scrollIntoViewIfNeeded();
  await box.locator('[data-size="large"]').click();
  await expect(box.locator('[data-size="large"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await zoomOf(page)).toBeCloseTo(1.15, 2);
  if (process.env.SHOTS) {
    await page.locator('[data-size-presets]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${process.env.SHOTS}/gross-${info.project.name === 'phone' ? 390 : 1440}.png` });
  }
  await box.locator('[data-size="small"]').click();
  expect(await zoomOf(page)).toBeCloseTo(0.9, 2);
  await box.locator('[data-size="normal"]').click();
  expect(await zoomOf(page)).toBe(1);
  await expect(box.getByRole('button', { name: T('Large|size') })).toBeVisible();
});
