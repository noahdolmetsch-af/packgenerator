// «Lange Wörter: Glas der guten Momente» (Nacht-Roboter «Langes Wort», Noah 06.11.2026 «4a»): ein sehr langes Wort
// ohne Umbruchstelle in einer Dank- oder Stolz-Notiz machte Ich › Wohlbefinden breiter als den Bildschirm
// (2060 px statt 1440 px). Erfundene Texte.
import { test, expect, noonToday } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';
import { put, addDays } from './aktiv-fixture.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const LONG = 'Wunderlangeswort'.repeat(18); // a note is cut at 300 characters
const TODAY = noonToday().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' }); // the day of the fixed clock

test('Wohlbefinden: eine Dank-Notiz mit langem Wort bleibt im Glas auf dem Bildschirm', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/me/wohl');
  await ready(page);
  await put(page, {
    abAnswers: [
      { id: 'test_dank_lang', qid: 'achtsamkeit.dank', day: addDays(TODAY, -1), at: new Date().toISOString(), note: LONG },
      { id: 'test_stolz_lang', qid: 'erreicht.stolz', day: addDays(TODAY, -2), at: new Date().toISOString(), value: LONG },
    ],
  });
  await page.reload();
  await ready(page);
  const jar = page.locator('[data-wohl-jar]');
  await expect(jar.locator('.wl-jar').first()).toBeVisible();
  await expect(jar).toContainText('Wunderlangeswort');
  const vw = page.viewportSize().width;
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw, 'the page is not wider than the screen').toBeLessThanOrEqual(vw);
  for (const el of await jar.locator('.wl-jar').all()) {
    const right = await el.evaluate((e) => e.getBoundingClientRect().right);
    expect(right, T('Jar of good moments')).toBeLessThanOrEqual(vw);
  }
  expect(errors).toEqual([]);
});
