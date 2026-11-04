// «Markierung gleitet» (Paket A Seitenwechsel 3, Noah 03.11.2026 «b»): on a phone the soft pill behind the chosen place
// in the bottom bar is one piece that glides from place to place instead of jumping; «Reduce motion» takes the glide away.
import { test, expect } from './clock.js';

test.skip(({ viewport }) => viewport.width > 720, 'the bottom bar is the phone’s; a computer has the sidebar');

const box = (loc) => loc.evaluate((el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });

test.beforeEach(async ({ context, page }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await page.goto('./#/');
  await expect(page.locator('nav.bottom [data-place-mark]')).toBeVisible();
});

test('the pill stands behind the chosen place and moves to the next one', async ({ page }) => {
  const mark = page.locator('nav.bottom [data-place-mark]');
  const now = () => box(page.locator("nav.bottom a[aria-current='page'] .pi"));
  const near = (a, b) => Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1 && Math.abs(a.w - b.w) < 1;
  expect(near(await box(mark), await now())).toBe(true);
  await page.locator('nav.bottom a[data-place="trips"]').click();
  await expect(page.locator("nav.bottom a[aria-current='page']")).toHaveAttribute('data-place', 'trips');
  await expect.poll(async () => near(await box(mark), await now())).toBe(true); // the glide ends on the new place
  // only one pill, and the old place has none of its own any more
  await expect(page.locator('nav.bottom [data-place-mark]')).toHaveCount(1);
  expect(await page.locator("nav.bottom a[data-place='today'] .pi").evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
});

test('the move is a glide of about 0.2 s, and with «Reduce motion» it is none', async ({ page }) => {
  const mark = page.locator('nav.bottom [data-place-mark]');
  const css = () => mark.evaluate((el) => { const s = getComputedStyle(el); return { p: s.transitionProperty, d: s.transitionDuration }; });
  await expect.poll(async () => (await css()).d).toBe('0.2s, 0.2s, 0.2s'); // glide is on after the first frame
  expect((await css()).p).toContain('transform');
  // a tap really starts a transition (it is seen while it runs)
  const ran = await page.evaluate(() => new Promise((resolve) => {
    const m = document.querySelector('[data-place-mark]');
    let seen = false;
    const look = (n) => { if (m.getAnimations().some((a) => a.transitionProperty === 'transform')) seen = true; if (n > 0) requestAnimationFrame(() => look(n - 1)); else resolve(seen); };
    document.querySelector("nav.bottom a[data-place='trips']").click();
    look(8);
  }));
  expect(ran).toBe(true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect((await css()).d).toBe('0s');
});
