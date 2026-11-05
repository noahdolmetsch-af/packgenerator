// «Eigene Experimente» with a measured value (Cockpit-Idee 6): start a try that measures the resting pulse and
// read the comparison. Fictional Fitbit days written straight into IndexedDB; the clock stands on Friday 9 October 2026.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const H = (fill) => Array.from({ length: 24 }, (_, i) => fill(i));

// resting pulse 58 on the 8 days before the try (i >= 4), 52 during it (i < 4): a clear fall
function rows() {
  const healthDays = [];
  for (let i = 0; i < 40; i++) {
    const date = addDays(TODAY, -i);
    healthDays.push({
      date, restingHr: (i < 4 ? 52 : 58) + (i % 2), steps: 6000, sleep: { asleepMin: 400, deepMin: 70, remMin: 85, lightMin: 220, awakeMin: 20, start: '23:20', end: '06:50', efficiency: 92 },
      vo2max: 55, hrH: H(() => 60), stepH: H(() => 250), src: 'google', at: `${date}T08:00:00Z`,
    });
  }
  return { healthDays };
}

test('Versuch mit Messwert: Vergleich vor und während des Versuchs', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    localStorage.setItem('lang', 'de');
    localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/me/ruhig/versuche');
  await ready(page);
  await put(page, rows());
  await page.reload();
  await ready(page);
  await page.locator('[data-exp-q]').fill('Sinkt mein Ruhepuls mit mehr Ruhe?');
  await page.locator('[data-exp-more] summary').click();
  await page.locator('[data-exp-metric]').selectOption('rhr');
  await page.locator('input[type="date"]').first().fill(addDays(TODAY, -3)); // 4 days so far (to and with today)
  await page.locator('[data-exp-add]').click();
  const exp = page.locator('[data-exp]');
  await expect(exp).toHaveCount(1);
  const res = exp.locator('[data-exp-result]');
  await expect(res).toBeVisible();
  await expect(res).toContainText(T('Resting pulse'));
  await expect(res).toHaveAttribute('data-verdict', 'down');
  await expect(res).toContainText(T('On average lower during the try than before.|exp'));
  await expect(res).toContainText(T('During the try|exp'));
  expect(errors).toEqual([]);
});
