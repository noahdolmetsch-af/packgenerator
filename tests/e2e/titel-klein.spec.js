// «Grosser Titel wird beim Scrollen klein» (Paket A Seitenwechsel 5, Noah 03.11.2026 «b»): scroll down a long page and its title stays on as one
// small line at the top (under the top bar on a phone); scroll up and it goes; it takes no room; a page without a big title has none.
import { test, expect } from './clock.js';

test.beforeEach(async ({ context, page }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
});

const mini = (page) => page.locator('[data-mini-title]');

test('the small line shows when the big title is gone, and goes when it is back', async ({ page }) => {
  await page.goto('./#/features');
  const h1 = page.locator('main h1').first();
  await expect(h1).toBeVisible();
  const title = (await h1.textContent()).trim();
  await expect(mini(page)).not.toHaveClass(/\bon\b/);
  await page.evaluate(() => window.scrollTo(0, 1500));
  await expect(mini(page)).toHaveClass(/\bon\b/);
  await expect(mini(page).locator('span')).toHaveAttribute('data-t', title);
  // it sits right under the top bar of a phone (at the top of the page on a computer) and does not catch taps
  const where = await page.evaluate(() => {
    const bar = document.querySelector('header.top');
    const m = document.querySelector('[data-mini-title]').getBoundingClientRect();
    return { bar: bar && getComputedStyle(bar).position === 'sticky' ? Math.round(bar.getBoundingClientRect().bottom) : 0, top: Math.round(m.top), events: getComputedStyle(document.querySelector('[data-mini-title-wrap]')).pointerEvents };
  });
  expect(Math.abs(where.top - where.bar)).toBeLessThanOrEqual(1);
  expect(where.events).toBe('none');
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(mini(page)).not.toHaveClass(/\bon\b/);
});

test('it takes no room and is not read out twice', async ({ page }) => {
  await page.goto('./#/features');
  await expect(page.locator('main h1').first()).toBeVisible();
  const wrap = page.locator('[data-mini-title-wrap]');
  expect(await wrap.evaluate((el) => el.getBoundingClientRect().height)).toBe(0);
  await expect(wrap).toHaveAttribute('aria-hidden', 'true');
  // the title stands in the page once: the small line has no text of its own for search, tests and readers
  expect(await wrap.evaluate((el) => el.textContent.trim())).toBe('');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test('another page brings its own title; with «Reduce motion» it appears at once', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./#/features');
  await expect(page.locator('main h1').first()).toBeVisible();
  await page.evaluate(() => (location.hash = '#/me/handbook'));
  const next = (await page.locator('main h1').first().textContent()).trim();
  await page.evaluate(() => window.scrollTo(0, 1500));
  await expect(mini(page)).toHaveClass(/\bon\b/);
  await expect(mini(page).locator('span')).toHaveAttribute('data-t', next);
  expect(await mini(page).evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0s');
});

test('a bar of the page itself at the top keeps its place: the small line stays away', async ({ page }) => {
  await page.goto('./#/features');
  await expect(page.locator('main h1').first()).toBeVisible();
  const top = await page.evaluate(() => { const b = document.querySelector('header.top'); return b && getComputedStyle(b).position === 'sticky' ? Math.round(b.getBoundingClientRect().height) : 0; });
  // a made-up bar that stays at the top like the search and filter row of the material list
  await page.evaluate((t) => {
    const bar = document.createElement('div');
    bar.id = 'fake-bar';
    bar.style.cssText = `position:fixed;top:${t}px;left:0;right:0;height:44px;z-index:6;background:#ddd`;
    document.querySelector('main').append(bar);
  }, top);
  await page.evaluate(() => window.scrollTo(0, 1500));
  await page.waitForTimeout(400);
  await expect(mini(page)).not.toHaveClass(/\bon\b/);
  await page.evaluate(() => document.getElementById('fake-bar').remove());
  await page.evaluate(() => window.scrollTo(0, 1100));
  await expect(mini(page)).toHaveClass(/\bon\b/);
});
