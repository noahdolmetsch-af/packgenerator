// «Aktiv und Auswerten» 3a (Noah 03.11.2026 «1a-5a»): under «Diese Woche» on Aktiv stand the links to the
// Wochenrückblick and the training plans; from Friday 17:00 to Monday the Sunday thread says the week is almost over.
// German, phone + desktop, no data of Noah's, clocks fixed (Europe/Zurich, calendar days).
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en;

async function open(page, context, iso) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(iso) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  return errors;
}

test('WW-1 Aktiv: the Wochenrückblick and the training plans are one tap under «Diese Woche»', async ({ page, context }) => {
  const errors = await open(page, context, '2026-11-04T12:00:00+01:00'); // Wednesday
  const week = page.locator('section[aria-labelledby="week-h"]');
  await expect(week.locator('[data-to-review]')).toHaveText(T('Week in review'));
  await expect(week.locator('[data-to-plans]')).toHaveText(T('Training plans'));
  await expect(page.locator('[data-week-faden]')).toHaveCount(0);
  await week.locator('[data-to-plans]').click();
  await expect(page).toHaveURL(/#\/flow\/plans/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});

test('WW-2 Aktiv: from Friday evening the Sunday thread leads to the Wochenrückblick', async ({ page, context }, info) => {
  await open(page, context, '2026-11-06T18:30:00+01:00'); // Friday evening
  const line = page.locator('[data-week-faden]');
  await expect(line).toContainText(T('The week is almost over. Look back at it'));
  await page.screenshot({ path: info.outputPath('ww-freitag.png') });
  await line.click();
  await expect(page).toHaveURL(/#\/flow\/review/);
});

test('WW-3 Aktiv: on Monday the thread looks back at the last week, on Friday noon there is none', async ({ page, context }) => {
  await open(page, context, '2026-11-09T09:00:00+01:00'); // Monday
  await expect(page.locator('[data-week-faden]')).toContainText(T('A new week begins. Look back at the last one'));
  await page.clock.setFixedTime(new Date('2026-11-06T12:00:00+01:00')); // Friday noon
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-week-faden]')).toHaveCount(0);
});
