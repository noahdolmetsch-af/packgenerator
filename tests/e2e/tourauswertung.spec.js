// «Tour-Auswertung» (Noah 20.10.2026 «3a und b»): on the tour page under «Werte» what the Garmin shows,
// German UI, phone 390 and desktop 1440, fictional data (sn4plus-fixture.js plus at1-acts.js):
// a) a ride with a power meter: stops, NP, the best 1, 2, 5, 10 and 20 minutes of power and heart rate,
//    the resting heart rate of that day next to «your normal», every ride as a dot with the connection;
// b) a ride without a power meter and without Fitbit days: no power row, the hint where the resting heart rate comes from.
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { sn4plusData, D0, day } from './sn4plus-fixture.js';
import { at1Acts } from './at1-acts.js';
import { importAndSettle } from './settle.js';
// the spans from the app source (tourana.js pulls in Svelte runes, so it is read as text)
const ANA_SPANS = [...readFileSync(new URL('../../src/lib/touren/tourana.js', import.meta.url), 'utf8').match(/ANA_SPANS = \[([\s\S]*?)\];/)[1].matchAll(/\[(\d+), (\d+)\]/g)];

const SHOTS = '/tmp/claude-0/sn-shots/tourauswertung';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const A = 'test_ana_';
const key = (k) => `#/tour/${encodeURIComponent(k)}`;

function data({ health = true } = {}) {
  const d = sn4plusData();
  const acts = at1Acts(day, A);
  acts[0] = {
    ...acts[0],
    pauses: { n: 4, secs: 900 },
    pCurve: [[5, 820], [60, 430], [120, 372], [300, 318], [600, 284], [1200, 236], [3600, 210]],
    hCurve: [[60, 171], [120, 168], [300, 163], [600, 158], [1200, 154]],
    detail: new Date().toISOString(),
    dv: 4,
  };
  // every ride with a power meter gets a different NP, so the dots show a connection
  acts.forEach((a, i) => {
    if (i && a.wDevice) acts[i] = { ...a, wNorm: 190 + i * 4 };
  });
  d.tables.activities = acts;
  if (health) {
    const days = Array.from({ length: 70 }, (_, i) => day(-69 + i));
    d.tables.healthDays = days.map((date, i) => ({ date, restingHr: 50 + (i % 4), src: 'test' }));
  }
  return d;
}

async function start(page, context, info, opts) {
  mkdirSync(info.project.outputDir, { recursive: true });
  const file = `${info.project.outputDir}/ana-${info.testId}.json`;
  writeFileSync(file, JSON.stringify(data(opts)));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.clock.setFixedTime(new Date(`${D0}T10:00:00+02:00`));
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./');
  await importAndSettle(page, file);
  return errors;
}

test('a) a ride with a power meter: stops, NP, best minutes, resting heart rate, dots', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./${key(`a:${A}1`)}`);
  const ana = page.locator('[data-tour-part="values"] [data-tour-analysis]');
  await ana.scrollIntoViewIfNeeded();
  await expect(ana.getByRole('heading', { name: T('Like on the Garmin') })).toBeVisible();
  await expect(ana.locator('[data-ana="stops"] dd')).toContainText(T('{n} stops', { n: 4 }));
  await expect(ana.locator('[data-ana="np"] dd')).toContainText('205');
  // the columns come from the app's list of spans
  await expect(ana.locator('[data-ana-best] thead th')).toHaveCount(ANA_SPANS.length + 1);
  await expect(ana.locator('[data-best="power"] td')).toHaveText(['430', '372', '318', '284', '236']);
  await expect(ana.locator('[data-best="hr"] td')).toHaveText(['171', '168', '163', '158', '154']);
  await expect(ana.locator('[data-ana-missing]')).toHaveCount(0);
  await expect(ana.locator('[data-ana-rest] li')).toHaveCount(1);
  await expect(ana.locator('[data-ana-normal]')).toBeVisible();
  await expect(ana.locator('[data-ana-dots] circle.me')).toHaveCount(1);
  await expect(ana.locator('[data-ana-corr]')).not.toBeEmpty();
  // the 20 minutes are no longer twice on the page
  await expect(page.locator('[data-tour-values] [data-field="w20"]')).toHaveCount(0);
  mkdirSync(SHOTS, { recursive: true });
  await ana.screenshot({ path: `${SHOTS}/A1-werte-${info.project.name === 'phone' ? 390 : 1440}.png` });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});

test('b) without Fitbit days: the hint where the resting heart rate comes from', async ({ page, context }, info) => {
  const errors = await start(page, context, info, { health: false });
  await page.goto(`./${key(`a:${A}1`)}`);
  const ana = page.locator('[data-tour-part="values"] [data-tour-analysis]');
  await ana.scrollIntoViewIfNeeded();
  await expect(ana.locator('[data-ana-norest]')).toHaveText(T('No resting heart rate for these days. It comes from Fitbit: Ich › Verbindungen.'));
  await expect(ana.locator('[data-ana-dots]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
