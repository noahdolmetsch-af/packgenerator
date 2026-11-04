// «Ruhiges Einblenden» (Paket A Seitenwechsel 4, Noah 03.11.2026 «b»): a page that loads slowly shows the grey placeholders,
// then its content fades in over them; a page that loads at once fades nothing; with «Reduce motion» nothing fades.
import { test, expect } from './clock.js';

// goes to a page (first visit: its code is not loaded yet) and tells what happened when the placeholders left
const visit = (page, hash) =>
  page.evaluate(
    (h) =>
      new Promise((resolve) => {
        let grey = false;
        const t0 = performance.now();
        const look = () => {
          const there = !!document.querySelector('[data-page-loading]');
          if (there) grey = true;
          if (grey && !there) {
            // the frame after the content replaced the placeholders: what fades by itself (not a CSS rule)?
            return resolve({ grey, fading: document.getAnimations().filter((a) => !(a instanceof CSSAnimation) && !(a instanceof CSSTransition) && a.effect?.getKeyframes?.().some((k) => k.opacity === '0')).length });
          }
          if (performance.now() - t0 > 6000) return resolve({ grey, fading: -1 });
          requestAnimationFrame(look);
        };
        location.hash = h;
        requestAnimationFrame(look);
      }),
    hash,
  );

test.beforeEach(async ({ context, page }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  // the page's code arrives late (1.2 s), so the placeholders show (they come after 0.3 s)
  await context.route(/\/assets\/Wardrobe-[^/]+\.js$/, async (route) => {
    await new Promise((r) => setTimeout(r, 1200));
    await route.continue();
  });
  await page.goto('./#/');
  await expect(page.locator('main')).toBeVisible();
});

test('after a slow load the content fades in over the placeholders', async ({ page }) => {
  const r = await visit(page, '#/wardrobe');
  expect(r.grey).toBe(true);
  expect(r.fading).toBeGreaterThan(0);
});

test('with «Reduce motion» the content just appears', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const r = await visit(page, '#/wardrobe');
  expect(r.grey).toBe(true);
  expect(r.fading).toBe(0);
});

test('a page that is already loaded fades nothing', async ({ page }) => {
  await visit(page, '#/wardrobe'); // loads it
  await page.evaluate(() => (location.hash = '#/'));
  await expect(page.locator('main[data-s2-page="home"]')).toBeVisible();
  const again = await page.evaluate(() => new Promise((resolve) => {
    location.hash = '#/wardrobe';
    setTimeout(() => resolve({ grey: !!document.querySelector('[data-page-loading]'), fading: document.getAnimations().filter((a) => !(a instanceof CSSAnimation) && !(a instanceof CSSTransition)).length }), 150);
  }));
  expect(again).toEqual({ grey: false, fading: 0 });
});
