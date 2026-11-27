// «Haken-Verlauf» (Noah 27.11.2026 «3a»): the card on top of Auswerten › Woche shows which activity was ticked on which day.
// German, phone + desktop, fictional ticks of the seeded activities, the clock on Friday 9 October 2026.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');

function ticks() {
  const flowLog = [];
  const add = (actId, back, i = 0) => flowLog.push({ id: `test_hv_${actId}_${back}_${i}`, actId, day: addDays(TODAY, -back), at: `${addDays(TODAY, -back)}T08:00:00+02:00`, n: 1 });
  [0, 1, 2, 4, 5].forEach((b) => add('sauna', b));
  [1, 3, 3].forEach((b, i) => add('yoga', b, i)); // two ticks on one day are one day
  [2, 40, 200].forEach((b) => add('meditation', b));
  return { flowLog };
}

async function open(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  await put(page, ticks());
  await page.goto('./#/auswerten/woche');
  await page.reload();
  await ready(page);
  return errors;
}

test('Haken-Verlauf: stands on top, 10 days at first, every activity with a tick is a row', async ({ page, context }) => {
  const errors = await open(page, context);
  const card = page.locator('[data-haken-verlauf]');
  await expect(card).toBeVisible();
  await expect(card.getByRole('heading', { name: T('Tick history') })).toBeVisible();
  // the shared switch stands on top, then this card, then the other cards and the report (Paket A, Noah «2a»)
  const first = await page.evaluate(() => {
    const sw = document.querySelector('[data-haken-zeitraum]');
    const hv = document.querySelector('[data-haken-verlauf]');
    const next = document.querySelector('[data-tagestotal]');
    const after = (a, b) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    return after(sw, hv) && after(hv, next);
  });
  expect(first).toBe(true);
  await expect(card.locator('[data-hv-grid]')).toHaveAttribute('data-hv-span-days', '10');
  // sauna 5 days, yoga 2 days, meditation 1 day inside the last 10 days
  await expect(card.locator('[data-hv-act="sauna"] .c.on')).toHaveCount(5);
  await expect(card.locator('[data-hv-act="yoga"] .c.on')).toHaveCount(2);
  await expect(card.locator('[data-hv-act="meditation"] .c.on')).toHaveCount(1);
  await expect(card.locator('[data-hv-act="sauna"] .sum')).toHaveText('5');
  await expect(card.locator('[data-hv-group="rest"]')).toHaveText(T('Recovery|ring'));
  // 10 columns, today is the last one and marked
  await expect(card.locator('[data-hv-act="sauna"] .c')).toHaveCount(10);
  await expect(card.locator('[data-hv-act="sauna"] .c').last()).toHaveClass(/now/);
  // 0, 1, 2, 4, 5 days back for sauna, 1 and 3 for yoga, 2 for meditation: six different days
  await expect(card.locator('[data-hv-sentence]')).toContainText(T('On {a} of the last {n} days you ticked something.').split('{a}')[0]);
  await expect(card.locator('[data-hv-sentence]')).toContainText('6');
  // an activity without a tick in the period is named in one line, not as an empty row
  await expect(card.locator('[data-hv-quiet]')).toContainText(T('No tick in this period: {names}').split('{names}')[0]);
  await expect(card.locator('[data-hv-act="gym"]')).toHaveCount(0);
  const w = page.viewportSize().width;
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);
  expect(errors).toEqual([]);
});

test('Haken-Verlauf: 30 days, 3 months and a year, and the choice stays', async ({ page, context }) => {
  const errors = await open(page, context);
  const card = page.locator('[data-haken-verlauf]');
  const chip = (name) => page.locator('[data-haken-zeitraum]').getByRole('radio', { name }); // the one switch of the page (Noah «2a»)
  await chip(T('30 days|hv')).click();
  await expect(card.locator('[data-hv-grid]')).toHaveAttribute('data-hv-span-days', '30');
  await expect(card.locator('[data-hv-act="sauna"] .c')).toHaveCount(30);
  await expect(card.locator('[data-hv-act="meditation"] .c.on')).toHaveCount(1);
  await chip(T('3 months|hv')).click();
  await expect(card.locator('[data-hv-grid]')).toHaveClass(/week/);
  expect(await card.locator('[data-hv-act="sauna"] .c').count()).toBeLessThan(20); // weeks, not days
  await expect(card.locator('[data-hv-act="meditation"] .c.on')).toHaveCount(2); // 40 days back is inside 90 days, 2 days back too
  await chip(T('Year|hv')).click();
  await expect(card.locator('[data-hv-grid]')).toHaveAttribute('data-hv-span-days', '365');
  await expect(card.locator('[data-hv-act="meditation"] .sum')).toHaveText('3');
  await expect(card.locator('[data-hv-sentence]')).toContainText(T('On {a} of {n} days in the last year you ticked something.').split('{a}')[0]);
  const w = page.viewportSize().width;
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);
  // the choice is remembered on this device
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-haken-verlauf] [data-hv-grid]')).toHaveAttribute('data-hv-span-days', '365');
  expect(errors).toEqual([]);
});

test('Haken-Verlauf: without any tick it says so and points to Heute', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  await page.goto('./#/flow');
  await ready(page);
  await page.goto('./#/auswerten/woche');
  await page.reload();
  await ready(page);
  const card = page.locator('[data-haken-verlauf]');
  await expect(card).toBeVisible();
  await expect(card.locator('[data-hv-none]')).toBeVisible();
  await expect(card.locator('[data-hv-grid]')).toHaveCount(0);
});
