// B15 «Gleitende Umschalter» (Noah 27.10.2026 «ich möchte b13 bis b24 alle umsetzen»): the white pill of every
// segmented toggle is one shape that moves to the new choice (here: Touren › Rückblick «12 Monate · <Jahr> · Alle»).
import { test, expect } from '@playwright/test';

test('the pill moves to the chosen button', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/review');
  const seg = page.locator('.seg.glide:has(button[data-key="all"]):has(button[data-key="12m"])').first();
  await expect(seg).toBeVisible();
  const pill = seg.locator('.pill');
  const box = async (l) => {
    const b = await l.boundingBox();
    return Math.round(b.x);
  };
  const chosen = seg.locator('button[aria-pressed="true"]');
  await expect.poll(async () => (await box(pill)) - (await box(chosen))).toBe(0);
  const all = seg.locator('button[data-key="all"]');
  await all.click();
  await expect(all).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => (await box(pill)) - (await box(all))).toBe(0);
});
