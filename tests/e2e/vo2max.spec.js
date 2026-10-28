// «VO2max in Körperwerte» (Noah 28.10.2026): fictional Fitbit/Apple days with a VO₂max now and then, German,
// phone + desktop. The tab sits in the group «Körper», shows the mean and its range, the year by month,
// and without any value a line that says where it comes from.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');

async function open(page, context, healthDays) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  await put(page, { healthDays });
  await page.goto('./#/flow/stats/vo2max');
  await page.reload();
  await ready(page);
  return errors;
}

test('VO2max: own tab in Körper, mean, range and the year', async ({ page, context }) => {
  // every third day a value between 48 and 50 (today 50), the other days none
  const days = [];
  for (let i = 0; i < 60; i++) days.push({ date: addDays(TODAY, -i), restingHr: 52, ...(i % 3 === 0 ? { vo2max: 48 + (i % 9 === 0 ? 2 : 1) } : {}), src: i < 30 ? 'google' : 'apple' });
  const errors = await open(page, context, days);
  const st = page.locator('.gs');
  await expect(st.locator('[data-btab="vo2max"]')).toHaveAttribute('aria-selected', 'true');
  await expect(st.locator('[data-btab="vo2max"]')).toHaveText(T('VO2max'));
  const card = st.locator('[data-body="vo2max"]');
  await expect(card.locator('[data-body-mean]')).toContainText('ml/kg/min');
  await expect(card).toContainText('49–50');
  await expect(st.locator(`[data-body-day="${TODAY}"]`)).toContainText('50');
  await expect(st).toContainText(T('From Fitbit or Apple Health (Me › Connections), observation only. It changes slowly, often only once a week.'));
  await st.locator('[data-ranges] [data-key="y1"]').click();
  await expect(card.locator('[data-body-mean]')).toContainText(/49/);
  const w = page.viewportSize().width;
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/vo2max-${w <= 500 ? 390 : 1440}.png`, fullPage: true });
  expect(errors).toEqual([]);
});

test('VO2max: without a value the page says where it comes from', async ({ page, context }) => {
  const errors = await open(page, context, [{ date: TODAY, restingHr: 52, src: 'google' }]);
  const st = page.locator('.gs');
  await expect(st).toContainText(T('No value in this range. It comes with Fitbit or the Apple Health export (Me › Connections).'));
  expect(errors).toEqual([]);
});
