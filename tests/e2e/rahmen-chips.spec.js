// Impeccable «Ganze App» Paket 1 (Noah 24.11.2026 «1-5a»): on a phone the chips under the tabs stand in ONE row you can swipe, the chosen chip is in view, and the row of dots under the tabs is gone. On a computer nothing changes.
import { test, expect } from './clock.js';

test('Training: the chips stand in one row, «Tick off today» first, no dots under the tabs', async ({ page }, info) => {
  await page.goto('./#/flow/training');
  const chips = page.locator('[data-subtabs] a');
  await expect(chips.first()).toBeVisible();
  await expect(page.locator('.ptwrap .dots')).toHaveCount(0);
  await expect(chips.first()).toHaveAttribute('data-sub', 'flowhome');
  const tops = await chips.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
  if (info.project.name === 'phone') {
    // one line: every chip at the same height, the row swipes sideways, the page does not
    expect(new Set(tops).size).toBe(1);
    const row = await page.locator('[data-subtabs]').evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth, ox: getComputedStyle(el).overflowX }));
    expect(row.ox).toBe('auto');
    expect(row.sw).toBeGreaterThan(row.cw);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  } else {
    const wrap = await page.locator('[data-subtabs]').evaluate((el) => getComputedStyle(el).flexWrap);
    expect(wrap).toBe('wrap');
  }
});

test('Training: the chosen chip is always in view, also the last one', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone', 'the swipe row is for the phone');
  await page.goto('./#/flow/training');
  const last = page.locator('[data-subtabs] a').last();
  await last.scrollIntoViewIfNeeded();
  await last.click();
  const on = page.locator('[data-subtabs] a[aria-current="page"]');
  await expect(on).toBeVisible();
  const box = await on.boundingBox();
  const vw = await page.evaluate(() => window.innerWidth);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(vw + 1);
});

test('Training: the tab «Training» still opens the training page', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone', 'the tabs on top are for the phone');
  await page.goto('./#/week');
  await page.locator('.ptabs a', { hasText: 'Training' }).first().click();
  await expect(page).toHaveURL(/#\/flow\/training/);
});
