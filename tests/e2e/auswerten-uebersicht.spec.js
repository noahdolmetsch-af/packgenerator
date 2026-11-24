// «Auswerten-Übersicht» (Noah 24.11.2026 «1-5a», Impeccable ganze App, Paket 5): the answer of the day sits directly under the
// title; the period is one line «Zeitraum: Woche · …» + «Ändern» right above «Überblick und letzte 7 Tage»; under the answer one line
// per level (Ruhe, Locker, Normal, Bereit) that leads on, outside the link of the card; the same line on the page «Form».
// German UI, phone + desktop, fictional days, the clock on Friday 9 October 2026.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');

// quiet=false: normal values; low=true: two clearly low values so the answer moves to rest
function rows({ low = false } = {}) {
  const healthDays = [];
  for (let i = 0; i < 40; i++) {
    const date = addDays(TODAY, -i);
    const bad = low && i < 3;
    healthDays.push({ date, azm: 20, restingHr: bad ? 64 : 50 + (i % 3), hrvMs: bad ? 28 : 45 + (i % 4), steps: 9000, sleep: { asleepMin: bad ? 300 : 440, deepMin: 70, remMin: 90, lightMin: 230, awakeMin: 25, start: '23:05', end: '06:55', efficiency: 90 }, spo2: 96, breath: 14, kcal: 2300, kcalActive: 600, hrMax: 150, src: 'google', at: `${date}T08:00:00Z` });
  }
  const flowChecks = [{ day: TODAY, sleep: low ? 3 : 8, energy: low ? 3 : 9, mood: 7 }];
  return { healthDays, activities: [], trips: [], flowChecks, flowLog: [] };
}

async function open(page, context, opts, hash = '#/auswerten/uebersicht') {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  await page.goto('./#/flow');
  await ready(page);
  await put(page, rows(opts));
  await page.goto(`./${hash}`);
  await page.reload();
  await ready(page);
}

test('AU-1 the answer of the day stands under the title, the period is one line above the overview', async ({ page, context }) => {
  await open(page, context);
  const title = page.locator('h1.title');
  const card = page.locator('[data-section="form"]');
  await expect(card).toBeVisible();
  const line = page.locator('[data-period-line]');
  await expect(line).toBeVisible();
  const ty = (await title.boundingBox()).y;
  const cy = (await card.boundingBox()).y;
  const ly = (await line.boundingBox()).y;
  expect(cy).toBeGreaterThan(ty);
  expect(ly).toBeGreaterThan(cy);
  // the period line sits above «Überblick und letzte 7 Tage» (fold on the phone) / «Überblick» (computer)
  const ov = page.locator('[data-ov-fold], [data-overview]').first();
  expect((await ov.boundingBox()).y).toBeGreaterThan(ly);
  // «Im Fokus» comes before the line
  const focus = page.locator('#focus-h');
  if (await focus.count()) expect((await focus.boundingBox()).y).toBeLessThan(ly);
  await expect(page.locator('[data-period-sum]')).toContainText(`${T('Period: {label}').split('{')[0]}${T('Week|period')}`);
  // the switch is folded; «Ändern» opens it, the choice shows in the line
  await expect(page.locator('[data-period-bar]')).toHaveCount(0);
  await page.locator('[data-period-change]').click();
  await expect(page.locator('[data-period-bar]')).toBeVisible();
  await page.locator('[data-period-bar]').getByRole('button', { name: T('Month|period'), exact: true }).click();
  await expect(page.locator('[data-period-sum]')).toContainText(T('Month|period'));
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});

test('AU-2 normal day: the plan line leads to the weekly plan, outside the card link', async ({ page, context }) => {
  await open(page, context);
  const s = page.locator('[data-day-suggest]');
  await expect(s).toHaveCount(1);
  const level = await page.locator('[data-section="form"]').getAttribute('data-level');
  await expect(s).toHaveAttribute('data-day-suggest', level);
  // no link in a link: the line is not inside the card's anchor
  expect(await page.locator('[data-section="form"] [data-day-suggest]').count()).toBe(0);
  const href = await s.locator('[data-day-suggest-link]').getAttribute('href');
  const want = { rest: '#/flow/rest', easy: '#/trips/dreams', normal: '#/flow/wochenplan', hard: '#/trips/dreams' }[level];
  expect(href).toBe(want);
  await s.locator('[data-day-suggest-link]').click();
  await expect(page).toHaveURL(new RegExp(want.replace(/[/#]/g, (c) => `\\${c}`)));
});

test('AU-3 low values: the day asks for rest and leads to recovery', async ({ page, context }) => {
  await open(page, context, { low: true });
  await expect(page.locator('[data-section="form"]')).toHaveAttribute('data-level', 'rest');
  const s = page.locator('[data-day-suggest="rest"]');
  await expect(s).toContainText(T('Rest today?'));
  await s.locator('[data-day-suggest-link]').click();
  await expect(page).toHaveURL(/#\/flow\/rest/);
});

test('AU-4 the page Form carries the same line; «Performance tips» off hides it', async ({ page, context }) => {
  await open(page, context, {}, '#/flow/form');
  await expect(page.locator('[data-day-suggest]')).toHaveCount(1);
  await put(page, { settings: [{ key: 'suggestOff', value: ['performance'] }] });
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-form-now]')).toBeVisible();
  await expect(page.locator('[data-day-suggest]')).toHaveCount(0);
});
