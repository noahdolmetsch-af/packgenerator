// «Persönliche Experimente» mit Fahrt-Werten (Persönliches Lernen, Idee 2): the cadence example fills the form,
// and the card reads two ride values side by side, ride against ride with a dot for every ride. Fictional rides written straight into IndexedDB; the clock
// stands on Friday 9 October 2026.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');

// a ride every second day: before the try (i >= 14) cadence 78 and felt 7, during it (i < 14) cadence 88 and felt 5
function rows() {
  const activities = [];
  for (let i = 0; i < 28; i += 2) {
    const day = addDays(TODAY, -i);
    const during = i < 14;
    activities.push({
      id: `e2e-vf-${i}`, day, kind: 'bike', name: 'Fictional ride', time: '17:00', start: `${day}T17:00:00`, movingS: 3600, km: 25, cad: (during ? 88 : 78) + (i % 4 === 0 ? 1 : 0), feel: (during ? 5 : 7) + (i % 4 === 0 ? 1 : 0),
    });
  }
  return { activities };
}

test('Versuch mit Fahrt-Werten: Beispiel, zwei Werte, Vergleich', async ({ page, context }) => {
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

  // the example fills the form: question, both values and 14 days
  await page.getByRole('button', { name: T('Do I ride more comfortably with a higher cadence?') }).click();
  await expect(page.locator('[data-exp-metric]')).toHaveValue('rideFeel');
  await expect(page.locator('[data-exp-cad]')).toBeChecked();
  await expect(page.locator('[data-exp-ride-hint]')).toBeVisible();
  await page.locator('input[type="date"]').first().fill(addDays(TODAY, -13)); // 14 days so far (to and with today)
  await page.locator('[data-exp-add]').click();

  const exp = page.locator('[data-exp]');
  await expect(exp).toHaveCount(1);
  const feel = exp.locator('[data-exp-value="rideFeel"]');
  const cad = exp.locator('[data-exp-value="cad"]');
  await expect(feel).toHaveAttribute('data-verdict', 'down');
  await expect(cad).toHaveAttribute('data-verdict', 'up');
  await expect(feel).toContainText(T('Felt effort of rides (1–10)'));
  await expect(cad).toContainText(T('Cadence'));
  // ride against ride: how many rides fit, and every ride as a dot (7 before, 7 during)
  await expect(feel.locator('[data-exp-similar]')).toContainText('14 von 14');
  await expect(feel.locator('[data-dots="before"] .dot')).toHaveCount(7);
  await expect(feel.locator('[data-dots="during"] .dot')).toHaveCount(7);

  // the examples stay under the form after the first try
  await expect(page.getByRole('button', { name: T('Do I ride more comfortably with a higher cadence?') })).toBeVisible();
  expect(errors).toEqual([]);
});
