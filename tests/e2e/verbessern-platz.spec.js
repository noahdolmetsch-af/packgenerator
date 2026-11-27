// «Nie abgeschnitten» (Noah 24.11.2026, Gemini page 27.11.2026): the floating button «Verbessern» never covers the end of a page.
// At the bottom of each page the lowest content lies above the button. Fictional data only; phone + desktop.
import { test, expect } from './clock.js';
import { ready } from './settle.js';

const PAGES = ['./#/', './#/assistent/gemini', './#/me', './#/touren', './#/packen', './#/aktiv'];

for (const hash of PAGES) {
  test(`the end of ${hash.slice(3) || 'heute'} lies above the button Verbessern`, async ({ page, context }) => {
    await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
    await context.addInitScript(() => {
      localStorage.setItem('lang', 'de');
      localStorage.setItem('whatsnew.seen', '9.9.9');
      localStorage.setItem('ops.improve', '1');
    });
    await page.goto(hash);
    await ready(page);
    const fab = page.locator('[data-improve]');
    await expect(fab).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(300);
    const r = await page.evaluate(() => {
      const f = document.querySelector('[data-improve]').getBoundingClientRect();
      let low = 0;
      let who = '';
      for (const el of document.querySelectorAll('main *')) {
        const b = el.getBoundingClientRect();
        if (!b.width || !b.height || getComputedStyle(el).position === 'fixed') continue;
        if (b.right < f.left || b.left > f.right) continue; // beside the button
        const top = document.elementFromPoint(Math.min(Math.max(b.left + b.width / 2, 0), innerWidth - 1), Math.min(b.bottom - 1, innerHeight - 1));
        if (!top || !(el === top || el.contains(top))) continue; // hidden, clipped or under the bar
        if (b.bottom > low && b.bottom <= innerHeight + 1) { low = b.bottom; who = el.tagName + '.' + el.className; }
      }
      return { fabTop: f.top, low, who };
    });
    expect(r.low, `lowest content ${r.who}`).toBeLessThanOrEqual(r.fabTop);
  });
}
