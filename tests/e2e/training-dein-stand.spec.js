// V4b2 (Noah 22.11.2026 «2a»): the card «Dein Stand» on Training › Woche: quiet lines with a tap to Auswerten; no data, no card.
// German, phone + desktop, fictional data only, clock fixed (Tuesday 10 Nov 2026).
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');

test('Training: «Dein Stand» stands once there is something to say, and leads to Auswerten', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.setFixedTime(new Date('2026-11-10T09:00:00+01:00'));
  await page.goto('./#/flow/training');
  await ready(page);
  await expect(page.locator('[data-section="stand"]')).toHaveCount(0); // nothing to say yet
  await page.getByRole('button', { name: T('Set a goal') }).click();
  await page.locator('[data-goal-hours]').fill('8');
  await page.getByRole('button', { name: T('Save'), exact: true }).first().click();
  const card = page.locator('[data-section="stand"]');
  await expect(card.getByRole('heading', { level: 2, name: T('Your status') })).toBeVisible();
  await expect(card.locator('[data-stand="hours"]')).toHaveAttribute('href', '#/flow/review');
  await expect(card.locator('[data-stand="hours"]')).toContainText('8');
  await card.locator('[data-stand="hours"]').click();
  await expect(page).toHaveURL(/#\/flow\/review/);
  expect(errors).toEqual([]);
});
