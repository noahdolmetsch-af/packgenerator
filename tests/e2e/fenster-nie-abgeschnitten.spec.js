// «Nie abgeschnitten» (Noah 24.11.2026 «a und b», docs/regeln.md Block 7): every window fits the screen. Head and foot with the
// main button stay put, the middle scrolls. This guard opens real windows at phone 390, laptop 1440×800 (Noah's Mac) and
// desktop 1440×900 and checks, without scrolling: the window lies inside the screen, the main button is whole, and no button
// is cut at the edge of the window (whole or hidden, never half). Fictional data, German UI, no internet.
// The static half (every window of the app can scroll, fits in dvh and has the soft edge) is tests/fenster-nie-abgeschnitten.test.js.
import { test, expect } from './clock.js';
import { ready } from './settle.js';
import { newButton } from './newbutton.js';
import { openHome } from './home0460-fixture.js';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const SIZES = [
  { name: 'phone 390', width: 390, height: 844 },
  { name: 'laptop 1440x700', width: 1440, height: 700 }, // a MacBook with the browser's own bars: Noah's real window is about 1470×710
  { name: 'laptop 1440x800', width: 1440, height: 800 },
  { name: 'desktop 1440x900', width: 1440, height: 900 },
];

/** What a person sees of the open window: returns the findings (empty = fine). */
async function findings(page) {
  return page.evaluate(() => {
    const out = [];
    const dlg = [...document.querySelectorAll('dialog[open]')].pop();
    if (!dlg) return ['no window open'];
    const vw = innerWidth;
    const vh = innerHeight;
    const r = dlg.getBoundingClientRect();
    if (r.top < -0.5 || r.left < -0.5 || r.right > vw + 0.5 || r.bottom > vh + 0.5) out.push(`window leaves the screen (${Math.round(r.left)},${Math.round(r.top)} to ${Math.round(r.right)},${Math.round(r.bottom)} of ${vw}x${vh})`);
    // the part of the window a person can see: its padding box, inside the screen
    const cs = getComputedStyle(dlg);
    const box = {
      top: Math.max(0, r.top + parseFloat(cs.borderTopWidth)),
      bottom: Math.min(vh, r.bottom - parseFloat(cs.borderBottomWidth)),
      left: Math.max(0, r.left + parseFloat(cs.borderLeftWidth)),
      right: Math.min(vw, r.right - parseFloat(cs.borderRightWidth)),
    };
    const seen = (b) => {
      const w = Math.min(b.right, box.right) - Math.max(b.left, box.left);
      const h = Math.min(b.bottom, box.bottom) - Math.max(b.top, box.top);
      return (Math.max(0, w) * Math.max(0, h)) / Math.max(1, (b.right - b.left) * (b.bottom - b.top));
    };
    const label = (el) => (el.getAttribute('aria-label') || el.textContent || el.className || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 40);
    const controls = [...dlg.querySelectorAll('button, a.btn, [role="button"], input, select, textarea')].filter((el) => {
      const b = el.getBoundingClientRect();
      const st = getComputedStyle(el);
      return b.width >= 2 && b.height >= 2 && st.visibility !== 'hidden' && st.display !== 'none' && !el.matches('input[type="checkbox"], input[type="radio"], input[type="file"], input[type="hidden"]');
    });
    // a window that scrolls may show a row half at its edge (the soft edge says «more follows»); a window that does not scroll must not
    const scrolls = dlg.scrollHeight > dlg.clientHeight + 1;
    for (const el of controls) {
      const s = seen(el.getBoundingClientRect());
      if (!scrolls && s > 0.02 && s < 0.98) out.push(`cut at the edge: «${label(el)}» (${Math.round(s * 100)} % visible)`);
    }
    // the main button: the last «.btn.hi» or submit button, if the window has one
    const mains = [...dlg.querySelectorAll('.btn.hi, button[type="submit"]')].filter((el) => el.getBoundingClientRect().width > 0);
    const main = mains.at(-1);
    if (main && seen(main.getBoundingClientRect()) < 0.98) out.push(`the main button «${label(main)}» is not whole on screen`);
    return out;
  });
}

async function check(page, what, open) {
  for (const s of SIZES) {
    await page.setViewportSize({ width: s.width, height: s.height });
    await open();
    await page.waitForTimeout(450); // the window is done opening
    expect(await findings(page), `${what} at ${s.name}`).toEqual([]);
    await page.keyboard.press('Escape');
  }
}

async function blank(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.goto('./');
  await ready(page);
}

test.describe('Nie abgeschnitten', () => {
  test.beforeEach(({}, info) => {
    test.skip(info.project.name === 'phone', 'the three sizes are set inside the test, one project is enough');
  });

  test('the + menu and the window «Add bike» fit the screen', async ({ page, context }) => {
    await blank(page, context);
    await check(page, 'window «New»', async () => {
      await (await newButton(page, T('New'))).click();
      await expect(page.getByRole('dialog', { name: T('New') })).toBeVisible();
    });
    await check(page, 'window «Add bike»', async () => {
      await (await newButton(page, T('New'))).click();
      await page.getByRole('dialog', { name: T('New') }).locator('[data-new-bike]').click();
      await expect(page.getByRole('dialog')).toBeVisible();
    });
  });
  test('the window of a place in the standard week fits the screen', async ({ page, context }) => {
    await blank(page, context);
    await page.goto('./#/flow/wochenplan?view=std');
    await ready(page);
    await page.locator('[data-wochenplan] [data-empty] button').first().click();
    await check(page, 'window «Place of the standard week»', async () => {
      await page.locator('[data-sw-entry="tennis@1"]').click();
      await expect(page.locator('[data-sw-sheet]')).toBeVisible();
    });
    await check(page, 'window «New place»', async () => {
      await page.locator('[data-sw-add]').first().click();
      await expect(page.locator('[data-sw-sheet]')).toBeVisible();
    });
  });
  test('the window «Favourites» (all favourites by group) fits the screen', async ({ page, context }, info) => {
    await openHome(page, context, info);
    await check(page, 'window «Favourites»', async () => {
      await page.locator('[data-pins-all]').click();
      await expect(page.locator('[data-fav-all]')).toBeVisible();
    });
  });
  // The morning and evening check («Wi gaht's?») is built and tested by its own thread (tests/e2e/runde-*.spec.js); it uses the same .vd-head / .vd-foot.
});
