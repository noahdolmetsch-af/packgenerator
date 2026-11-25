// «Karte der App» als Mindmap (Noah 24.11.2026 «beide», 25.11.2026 «kreislauf fallen lassen»): the list stays the default; «Mind map» shows the
// same places as branches, a tap opens the tabs and pages, a page leads there. German UI, no network, fictional data only (an empty app).
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');

test('the map opens as a list; the mind map opens the same pages', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/me/karte');
  await ready(page);
  await expect(page.locator('[data-appmap]')).toBeVisible();
  // the list is the default
  await expect(page.locator('[data-am-view="list"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-am-place="trips"]')).toBeVisible();
  await expect(page.locator('[data-am-mind]')).toHaveCount(0);

  // the mind map: one branch per place; only one stays open; a twig opens its pages; a page leads there
  await page.locator('[data-am-view="mind"]').click();
  await expect(page.locator('[data-am-mind]')).toBeVisible();
  const branches = page.locator('[data-am-branch]');
  expect(await branches.count()).toBeGreaterThan(5);
  await page.locator('[data-am-branch="trips"]').click();
  await expect(page.locator('[data-am-twigs="trips"]')).toBeVisible();
  await page.locator('[data-am-branch="week"]').click();
  await expect(page.locator('[data-am-twigs="trips"]')).toHaveCount(0);
  await expect(page.locator('[data-am-twigs="week"]')).toBeVisible();
  await page.locator('[data-am-twigs="week"] [data-am-twig="training"] > summary').click();
  expect(await page.locator('[data-am-twig="training"] [data-am-point]').count()).toBeGreaterThan(0);
  if (process.env.SHOTS) await page.waitForTimeout(700);
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/mindmap-${page.viewportSize().width}.png`, fullPage: false });
  const first = page.locator('[data-am-twig="training"] a[data-am-point]').first();
  await first.click();
  await expect(page).not.toHaveURL(/#\/me\/karte/);
  // back on the map the list is the first view again
  await page.goto('./#/me/karte');
  await ready(page);
  await expect(page.locator('[data-am-view="list"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-am-view="mind"]').click();
  await expect(page.locator('[data-am-mind]')).toBeVisible();
  await page.locator('[data-am-view="list"]').click();
  await expect(page.locator('[data-am-place="trips"]')).toBeVisible();
});
