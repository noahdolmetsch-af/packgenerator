// Etappe 6 (Querschnitt, 5a): the count in the chosen chip of a chips row (Neuland «Collections», Material and others)
// kept the grey of the unchosen chips and was nearly unreadable on the filled chip, in the light and in the dark theme.
import { test, expect } from './clock.js';
import { start } from './gesamttest/lib.js';
import { ready } from './settle.js';

/** Contrast of an element's text on what is behind it, with the element's own opacity applied. */
const ratio = (page, selector) =>
  page.locator(selector).first().evaluate((el) => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 1;
    const cx = cv.getContext('2d', { willReadFrequently: true });
    const rgba = (c) => (cx.clearRect(0, 0, 1, 1), (cx.fillStyle = '#000'), (cx.fillStyle = c), cx.fillRect(0, 0, 1, 1), [...cx.getImageData(0, 0, 1, 1).data]);
    const lum = ([r, g, b]) => [r, g, b].map((v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
    let bg = [0, 0, 0, 0];
    for (let p = el; p && bg[3] < 255; p = p.parentElement) {
      const c = rgba(getComputedStyle(p).backgroundColor);
      if (c[3] > 0) bg = c[3] === 255 || !bg[3] ? c : bg;
    }
    const fg = rgba(getComputedStyle(el).color);
    const op = +getComputedStyle(el).opacity;
    const mixed = [0, 1, 2].map((i) => fg[i] * op + bg[i] * (1 - op));
    const [a, b] = [lum(mixed), lum(bg)];
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  });

for (const scheme of ['light', 'dark']) {
  test(`chosen chip: the count can be read (${scheme})`, async ({ page, context }, info) => {
    test.setTimeout(150_000);
    await page.emulateMedia({ colorScheme: scheme });
    await start(page, context, info);
    await page.goto('./#/neuland');
    await ready(page);
    await page.waitForTimeout(1200); // the page fades in
    const count = '.seg.chips button[aria-pressed="true"] .n';
    await expect(page.locator(count).first()).toBeVisible();
    expect.soft(await ratio(page, count), `Neuland: count in the chosen chip (${scheme})`).toBeGreaterThan(4.5);
  });
}
