// Etappe 6 (Querschnitt, E6-005): in the dark theme the Kochen tips and the count in the chosen «Springen zu» chip
// (Material, Neuland, Neuigkeiten) were nearly invisible, and so was the kicker of the trip band in the wardrobe. Reads the real colours of the text and of what is behind it.
import { test, expect } from './clock.js';
import { start } from './gesamttest/lib.js';
import { ready } from './settle.js';

/** Contrast ratio of an element's text on the first opaque background behind it (any CSS colour syntax). */
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
    const [a, b] = [lum(fg), lum(bg)];
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  });

test('dark theme: Kochen tips and the chip count can be read', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'phone', 'the chips «Springen zu» are the phone layout');
  test.setTimeout(150_000);
  await page.emulateMedia({ colorScheme: 'dark' });
  await start(page, context, info);
  await page.goto('./#/me/alltag/kochen');
  await ready(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('.kt-meal').first()).toBeVisible();
  expect.soft(await ratio(page, '.kt-meal'), 'Kochen: «Frühstück» on the card').toBeGreaterThan(4.5);
  expect.soft(await ratio(page, '.kt-link'), 'Kochen: «Ändern»').toBeGreaterThan(4.5);
  await page.goto('./#/gear');
  await ready(page);
  const chip = page.locator('.ls-c[aria-pressed="true"] em').first();
  await expect(chip).toBeVisible();
  expect.soft(await ratio(page, '.ls-c[aria-pressed="true"] em'), 'Material: count in the chosen chip').toBeGreaterThan(3);
  // E6-006: the trip band of the wardrobe is the light card in the dark theme; its orange kicker was 1.9 : 1
  await page.goto('./#/wardrobe/trip/test_data_gtp_trip25');
  await ready(page);
  await expect(page.locator('.tband .tk')).toBeVisible();
  expect.soft(await ratio(page, '.tband .tk'), 'Kleider zur Tour: kicker in the band').toBeGreaterThan(4.5);
});
