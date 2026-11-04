// «Richtung zeigen» (Paket A Seitenwechsel 1, Noah 03.11.2026 «b»): a page that goes deeper glides in from the right,
// the way back from the left; tabs and Heute stand still; «Reduce motion» switches it off. Nothing leaves the preview server.
import { test, expect } from './clock.js';

// goes to an address and reads, once the page is drawn, the mark on <main> and what moves under it
const go = (page, to) =>
  page.evaluate(
    (hash) =>
      new Promise((resolve) => {
        addEventListener('hashchange', () => setTimeout(() => {
          const main = document.querySelector('main');
          const moving = [...main.children].map((el) => getComputedStyle(el).animationName).filter((n) => n.startsWith('sw-slide'));
          // the shift must never make the page wider than the screen (no sideways bar during the glide)
          resolve({ mark: main.getAttribute('data-slide'), moving, wide: document.documentElement.scrollWidth > document.documentElement.clientWidth });
        }, 0), { once: true });
        location.hash = hash;
      }),
    to,
  );

test.beforeEach(async ({ context, page }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await page.goto('./#/trips');
  await expect(page.locator('main')).toBeVisible();
});

test('deeper glides in from the right, the way back from the left', async ({ page }) => {
  const fwd = await go(page, '#/pack');
  expect(fwd.mark).toMatch(/^fwd[01]$/);
  expect(fwd.moving.length).toBeGreaterThan(0);
  expect(fwd.moving.every((n) => n.startsWith('sw-slide-fwd'))).toBe(true);
  expect(fwd.wide).toBe(false);
  const back = await go(page, '#/trips');
  expect(back.mark).toMatch(/^back[01]$/);
  expect(back.moving.length).toBeGreaterThan(0);
  expect(back.moving.every((n) => n.startsWith('sw-slide-back'))).toBe(true);
  expect(back.wide).toBe(false);
  // the mark goes after the glide, so a card that comes later does not glide on its own
  await expect(page.locator('main')).not.toHaveAttribute('data-slide', /.+/);
});

test('the same direction twice in a row plays again', async ({ page }) => {
  const a = await go(page, '#/tour/example');
  const b = await go(page, '#/pack');
  expect(a.mark).toMatch(/^fwd/);
  expect(b.mark).toMatch(/^fwd/);
  expect(b.mark).not.toBe(a.mark); // another mark, so the glide starts again
});

test('Heute, the tabs and a page of the same depth stand still', async ({ page }) => {
  expect((await go(page, '#/')).mark).toBe(null);
  expect((await go(page, '#/gear')).mark).toBe(null);
  expect((await go(page, '#/trips/dreams')).mark).toBe(null);
});

test('with «Reduce motion» nothing glides', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const r = await go(page, '#/pack');
  expect(r.mark).toMatch(/^fwd/);
  expect(r.moving).toEqual([]);
});
