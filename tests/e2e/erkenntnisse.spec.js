// «Erkenntnisse» (Noah 19.10.2026 «4b» + «zusätzlich eine eigene Seite»): what goes together in your data,
// in the Auswertung (the three strongest) and on its own page Ich › Erkenntnisse. Phone 390 and desktop 1440,
// German, a fixed clock in Europe/Zurich, fictional data only: 30 days of Fitbit sleep and resting pulse and
// the battery of «Wi gaht's?» (more sleep, fuller battery), the last three days a high resting pulse.
// SHOTS=<folder> saves full-page screenshots (light).
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { lastDays } from '../../src/lib/erkenntnisse.js';
import { ready } from './settle.js';
import { put } from './aktiv-fixture.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const DAY = '2026-10-19';

function data() {
  const days = lastDays(DAY, 30);
  const healthDays = days.map((date, i) => ({ date, sleep: { asleepMin: 360 + (i % 3) * 60 }, restingHr: i >= 27 ? 62 : 50 + (i % 2), src: 'test' }));
  const abAnswers = days.map((day, i) => ({ id: `test_data_gtp_ab_${i}`, qid: 'erholung.akku', area: 'erholung', day, at: `${day}T07:10`, slot: `${day}T07:00`, kind: 'scale', value: 4 + (i % 3) * 2, note: null, unit: null, src: 'hand' }));
  return { healthDays, abAnswers };
}

async function open(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(`${DAY}T12:00:00+02:00`) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/me');
  await ready(page);
  await put(page, data());
  return errors;
}
async function shot(page, info, name) {
  if (!process.env.SHOTS) return;
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
}
const noScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

test('own page: the sentence about sleep and battery, the resting pulse note, what still waits', async ({ page, context }, info) => {
  const errors = await open(page, context);
  await page.goto('./#/me/insights');
  await expect(page.getByRole('heading', { level: 1, name: T('Insights') })).toBeVisible();
  const sec = page.locator('[data-section="insights"]');
  const ins = sec.locator('[data-insight="sleep-battery"]');
  await expect(ins).toContainText(T('On days with {x}, {y} was {hi} on average, otherwise {lo}.', { x: T('more than {v} h of sleep', { v: '7' }), y: T('your battery|insight'), hi: '8', lo: '5' }));
  await expect(ins).toContainText(T('goes together clearly'));
  await expect(sec.locator('[data-rhr-high]')).toContainText('62, 62, 62');
  await expect(sec.locator('[data-waiting="km-mood"]')).toContainText(T('{n} of {m} days', { n: 0, m: 14 }));
  await expect(sec).toContainText(T('Going together is not a cause. Only to look at, never a diagnosis. Everything stays on the device.'));
  expect(await noScroll(page)).toBe(true);
  await shot(page, info, 'erkenntnisse-seite');
  expect(errors).toEqual([]);
});

test('Auswertung shows the strongest three and leads to the page; Ich has a row', async ({ page, context }, info) => {
  const errors = await open(page, context);
  await page.goto('./#/me/analysis');
  const sec = page.locator('[data-section="insights"]');
  await expect(sec.locator('[data-insight="sleep-battery"]')).toBeVisible();
  expect(await sec.locator('[data-insight]').count()).toBeLessThanOrEqual(3);
  await expect(sec.locator('[data-waiting]')).toHaveCount(0);
  await shot(page, info, 'erkenntnisse-auswertung');
  await sec.locator('[data-insights-all]').click();
  await expect(page).toHaveURL(/#\/me\/insights$/);
  await page.goto('./#/me');
  await page.locator('[data-me-insights]').click();
  await expect(page.getByRole('heading', { level: 1, name: T('Insights') })).toBeVisible();
  expect(errors).toEqual([]);
});

test('without data: one calm line, no sentence', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(`${DAY}T12:00:00+02:00`) });
  await page.goto('./#/me/insights');
  await ready(page);
  const sec = page.locator('[data-section="insights"]');
  await expect(sec.locator('[data-insights-none]')).toBeVisible();
  await expect(sec.locator('[data-insight]')).toHaveCount(0);
});
