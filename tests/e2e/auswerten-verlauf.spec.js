// «Auswerten neu» Teil 3 (Noah 24.11.2026 «1b 2a 3b 4a 5a», «über die jahre verteilt», Entwurf C «Cockpit»): the tab «Verlauf» at #/auswerten/verlauf.
// German, phone + desktop, fictional Fitbit days over three years, the clock on Friday 9 October 2026.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');

function rows() {
  const healthDays = [];
  for (let i = 0; i < 800; i++) {
    const date = addDays(TODAY, -i);
    const late = i % 2 === 0;
    healthDays.push({ date, azm: 20, restingHr: 50 + (i % 4), hrvMs: (late ? 62 : 76) + (i % 5), steps: 9000, sleep: { asleepMin: 400 + (i % 6) * 12, deepMin: 70, remMin: 90, lightMin: 230, awakeMin: 25, start: late ? '00:20' : '22:10', end: '06:55', efficiency: 90 }, spo2: 95, breath: 14, kcal: 2300, kcalActive: 600, hrMax: 150, src: 'google', at: `${date}T08:00:00Z` });
  }
  return { healthDays };
}

async function open(page, context, hash) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  await put(page, rows());
  await page.goto(`./${hash}`);
  await page.reload();
  await ready(page);
  return errors;
}

test('Verlauf: three lines with the usual band, the years, the patterns', async ({ page, context }) => {
  const errors = await open(page, context, '#/auswerten/verlauf');
  await expect(page.locator('[data-page="auswerten-verlauf"]')).toBeVisible();
  for (const k of ['hrv', 'rhr', 'sleep']) await expect(page.locator(`[data-verlauf-chart="${k}"]`)).toBeVisible();
  await expect(page.locator('[data-verlauf-chart="hrv"] svg').first()).toBeVisible();
  // your normal over the years: one row per year with data, and one for all years
  await expect(page.locator('[data-verlauf-years] [data-year="2026"]').first()).toBeVisible();
  await expect(page.locator('[data-verlauf-years] [data-year="all"]').first()).toBeVisible();
  // the two patterns: bedtime has two groups with enough nights, no ride data means no ride pattern
  await expect(page.locator('[data-pattern="bed"] li').first()).toBeVisible();
  await expect(page.locator('[data-pattern="ride"]')).toHaveCount(0);
  await expect(page.locator('[data-verlauf-good]')).toContainText(T('Two patterns in all your nights. An observation, not a cause: many things change together.'));
  const w = page.viewportSize().width;
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);
  await page.screenshot({ path: `/tmp/claude-0/work/shots/verlauf-${w}.png`, fullPage: true });
  expect(errors).toEqual([]);
});

test('Verlauf: the span is remembered and the old pages stay chips beside it', async ({ page, context }) => {
  await open(page, context, '#/auswerten/verlauf');
  await page.getByRole('button', { name: T('2 yr|verlauf') }).click();
  await page.reload();
  await ready(page);
  await expect(page.getByRole('button', { name: T('2 yr|verlauf') })).toHaveAttribute('aria-pressed', 'true');
  const chips = page.locator('nav.psubs');
  await expect(chips.locator('a[data-sub="verlauf"]')).toHaveAttribute('aria-current', 'page');
  await expect(chips.locator('a[data-sub="analyse"]')).toHaveCount(1);
});

test('Heute: the line «Your normal over the years» leads to Verlauf', async ({ page, context }) => {
  await open(page, context, '#/auswerten');
  await page.locator('[data-heute-years]').click();
  await expect(page.locator('[data-page="auswerten-verlauf"]')).toBeVisible();
});
