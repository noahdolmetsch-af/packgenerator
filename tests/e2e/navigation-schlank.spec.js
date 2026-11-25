// «Navigation schlanker» (Noah 24.11.2026 «was ja», Entwurf freigegeben 25.11.2026): a page names its place, tab and page ONCE.
// The path line stays away where the bar/sidebar, the tabs and the chips say it; the sidebar names the page under the lit tab;
// the «i» of the tab stands at the end of the chips. Fictional data (an empty app), German.
import { test, expect } from './clock.js';
import { ready } from './settle.js';

async function open(page, context, hash) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.goto(`./${hash}`);
  await ready(page);
}

test('Mein Tag: no path line, the chip is lit and the «i» stands with the chips', async ({ page, context }) => {
  await open(page, context, '#/day');
  await expect(page.locator('nav.psubs a[data-sub="day"]')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('[data-pathline]')).toHaveCount(0);
  await expect(page.locator('nav.psubs [data-info-open="tab.week"]')).toBeVisible();
  await expect(page.locator('[data-pathrow]')).toHaveCount(0);
});

test('a page with a title of its own keeps the path line (Woche › Diese Woche)', async ({ page, context }) => {
  await open(page, context, '#/week');
  await expect(page.locator('[data-pathline]')).toBeVisible();
});

test('on a computer the sidebar names «Mein Tag» under «Woche»', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'desktop', 'the sidebar stands on a computer only');
  await open(page, context, '#/day');
  const side = page.locator('.side .tabs');
  await expect(side.locator('[data-side-sub]')).toHaveText('Mein Tag');
  await expect(side.locator('[data-side-sub]')).toHaveAttribute('aria-current', 'page');
  // «Woche» itself is not lit while you are on «Mein Tag»
  await expect(side.locator('a[href="#/week"]')).not.toHaveAttribute('aria-current', 'page');
  await page.goto('./#/week');
  await ready(page);
  await expect(side.locator('[data-side-sub]')).toHaveCount(0);
  await expect(side.locator('a[href="#/week"]')).toHaveAttribute('aria-current', 'page');
});
