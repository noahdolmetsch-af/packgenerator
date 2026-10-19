// SL «Scrollen und Listen» (mockups SL1–SL4, Noah 14.10.2026 «SL1–SL4 freigegeben», answers «alle a»): the
// head of a long list stays on top with the group you are in, the jump bar opens a group and goes there,
// «Back to top» shows after two screens. Fictional data only (home0460-fixture); SHOTS=<folder> saves pictures.
import { test, expect } from '@playwright/test';
import { openHome } from './home0460-fixture.js';
import { WHATS_NEW } from '../../src/lib/whatsnew.js';
import { materialFixture } from './material0472-fixture.js';
import { SHOW_ROWS } from '../../src/lib/list/listen.js';

async function shot(page, info, name, full = false) {
  if (!process.env.SHOTS) return;
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: full });
}
// wait until a smooth scroll has come to rest
const still = (page) => page.waitForFunction(() => new Promise((ok) => { const y = scrollY; setTimeout(() => ok(scrollY === y), 150); }));
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

test('SL1 + SL4: Was ist neu by day, the jump bar, the head stays on top, back to top', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info);
  await page.goto('./#/me/news');
  const vers = page.locator('.wn-vers');
  await expect(vers.locator('[data-group]').first()).toHaveClass(/open/);
  await noSideways(page);
  await vers.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, document.querySelector('.wn-vers').getBoundingClientRect().top - 8));
  await shot(page, info, 'SL1-was-ist-neu');
  // the jump bar: chips on a phone, a list beside the page on a computer
  const nav = info.project.name === 'phone' ? page.locator('.wn-jump-ph') : page.locator('.wn-jump-dt');
  await expect(nav.locator('[data-jump]').first()).toBeVisible();
  const last = vers.locator('[data-group]').last();
  const id = await last.getAttribute('data-group');
  await nav.locator(`[data-jump="${id}"]`).click();
  await expect(last).toHaveClass(/open/);
  await expect(last.locator('.ls-gh')).toBeInViewport();
  // the head stays on top and names the group you are in
  const bar = vers.locator('.ls-bar');
  await expect(bar).toBeInViewport();
  await expect(bar.locator('.ls-cur')).toBeVisible();
  await still(page);
  await expect(nav.locator(info.project.name === 'phone' ? '[aria-pressed="true"]' : '[aria-current="true"]')).toHaveCount(1);
  await shot(page, info, 'SL4-beim-scrollen');
  // after two screens, «Back to top» (the older group shown whole makes the page long enough)
  await last.locator('.ls-more').click();
  expect(await page.evaluate(() => document.documentElement.scrollHeight > 3 * innerHeight)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const top = page.getByRole('button', { name: T('Back to top'), exact: true });
  await expect(top).toBeVisible();
  await top.click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(5);
  await expect(top).toHaveCount(0);
  expect(WHATS_NEW.length).toBeGreaterThan(1);
  expect(errors).toEqual([]);
});

test('SL2: Material: categories closed on every screen, the jump bar opens one, five rows and Show n more', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: materialFixture() });
  await page.goto('./#/gear');
  const cats = page.locator('section.cat');
  await expect(cats.first()).toBeVisible();
  await expect(page.locator('section.cat .rows')).toHaveCount(0);
  const nav = info.project.name === 'phone' ? page.locator('.jump-ph') : page.locator('.jump-dt');
  // the biggest category: it shows five rows and «Show n more»
  const sizes = await cats.evaluateAll((els) => els.map((x) => [x.dataset.group, Number(x.querySelector('.m')?.textContent.match(/\d+/)?.[0] ?? 0)]));
  const [key, n] = sizes.sort((a, b) => b[1] - a[1])[0];
  await nav.locator(`[data-jump="${key}"]`).click();
  const cat = page.locator(`section.cat[data-group="${key}"]`);
  await expect(cat.locator('.rows > li')).toHaveCount(n > SHOW_ROWS + 1 ? SHOW_ROWS : n);
  await still(page);
  await noSideways(page);
  await shot(page, info, 'SL2-material');
  if (n > SHOW_ROWS + 1) {
    await cat.locator('.allrows').click();
    await expect(cat.locator('.rows > li')).toHaveCount(n);
  }
  // the category you opened last stays open next time
  await page.reload();
  await expect(page.locator(`section.cat[data-group="${key}"] .rows`)).toBeVisible();
  expect(errors).toEqual([]);
});
