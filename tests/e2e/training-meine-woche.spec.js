// «Meine Woche» (UI-Test Training 17.11.2026, Fund 3): die Karte der Woche von Hand heisst «Meine Woche» (nicht
// «Woche planen», das ist der Ort Planen › Woche) und führt mit «Wochenplan» zur Seite mit den Stunden pro Woche.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en;

test('Training: «Meine Woche» mit Link zum Wochenplan', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/flow/training');
  await ready(page);
  const sec = page.locator('section[aria-labelledby="plan-h"]');
  await expect(sec.getByRole('heading', { level: 2, name: T('My week|plan') })).toBeVisible();
  await expect(page.getByRole('heading', { name: T('Plan the week'), exact: true })).toHaveCount(0);
  await expect(sec.getByRole('link', { name: T('Training plans') })).toBeVisible();
  await sec.getByRole('link', { name: T('Weekly plan') }).click();
  await expect(page).toHaveURL(/#\/flow\/wochenplan/);
  expect(errors).toEqual([]);
});
