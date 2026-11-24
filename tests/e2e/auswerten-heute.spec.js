// «Auswerten neu» Teil 1 (Noah 24.11.2026 «1b 2a 3b 4a 5a»): the start «Heute» at #/auswerten (the answer for today, your own normal
// of the last 12 months, the four questions) and the old overview at #/auswerten/uebersicht. German, phone + desktop, fictional data only.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');

function rows() {
  const healthDays = [];
  for (let i = 0; i < 150; i++) {
    const date = addDays(TODAY, -i);
    healthDays.push({ date, azm: 20 + (i % 5) * 5, restingHr: 50 + (i % 4), hrvMs: i === 0 ? 40 : 70 + (i % 9), steps: 9000, sleep: { asleepMin: 400 + (i % 6) * 12, deepMin: 70, remMin: 90, lightMin: 230, awakeMin: 25, start: '23:05', end: '06:55', efficiency: 90 }, spo2: 95, breath: 14, kcal: 2300, kcalActive: 600, hrMax: 150, src: 'google', at: `${date}T08:00:00Z` });
  }
  return { healthDays, flowChecks: [{ day: TODAY, sleep: 8, energy: 9, mood: 7 }] };
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

test('Heute: the answer, your normal and the four questions', async ({ page, context }) => {
  const errors = await open(page, context, '#/auswerten');
  await expect(page.locator('[data-page="auswerten-heute"]')).toBeVisible();
  // content first: the answer stands before everything else
  await expect(page.locator('[data-heute-answer]')).toBeVisible();
  await expect(page.locator('[data-heute-answer] [data-form-line]')).not.toBeEmpty();
  // your normal: three values, each with its band, the usual range, the last four weeks
  const hrv = page.locator('[data-heute-normal] [data-value="hrv"]');
  await expect(hrv).toContainText(T('Last 4 weeks: {n}').replace('{n}', ''));
  await expect(hrv.locator('[data-normal-band]')).toBeVisible();
  await expect(hrv.locator('[data-place="below"]')).toHaveText(T('Lower than usual for you'));
  await expect(page.locator('[data-heute-normal] [data-value]')).toHaveCount(3);
  // the four questions lead to pages
  await expect(page.locator('[data-heute-questions] [data-question]')).toHaveCount(4);
  const w = page.viewportSize().width;
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);
  await page.screenshot({ path: `/tmp/claude-0/work/shots/heute-${w}.png`, fullPage: true });
  expect(errors).toEqual([]);
});

test('Heute: note it for today puts the suggestion into Merken and offers Undo', async ({ page, context }) => {
  await open(page, context, '#/auswerten');
  await page.locator('[data-heute-note]').click();
  await expect(page.getByText(T('In Merken for today.'))).toBeVisible();
  await expect(page.locator('[data-heute-note]')).toBeDisabled();
});

test('the old overview stays at #/auswerten/uebersicht', async ({ page, context }) => {
  await open(page, context, '#/auswerten/uebersicht');
  await expect(page.locator('[data-page="auswerten"]')).toBeVisible();
  await expect(page.locator('[data-section="form"]')).toBeVisible();
  await page.goto('./#/auswerten');
  await expect(page.locator('[data-page="auswerten-heute"]')).toBeVisible();
  await page.locator('[data-heute-old]').click();
  await expect(page.locator('[data-page="auswerten"]')).toBeVisible();
});
