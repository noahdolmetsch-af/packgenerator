// «Fragen» (Plan «ganze App», Schritt 4a, Noah 08.11.2026 «D b»): the first tab of Auswerten. Six questions, each with one
// sentence, its limit and a way on; without data the page says so and does not guess; the search leads to it.
// German, phone + desktop. Fictional data (Gesamttest fixture plus Fitbit days and Strava rides). FRAGEN_SHOTS=<dir> saves screenshots.
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle, ready } from './settle.js';
import { actRecord } from '../../src/lib/training.js';

const FIX = fileURLToPath(new URL('../fixtures/gesamttest/test_data_gtp_daten.json', import.meta.url));
const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const SHOTS = process.env.FRAGEN_SHOTS || '';
const TODAY = '2026-10-16';
const addDays = (day, n) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** 100 days of Fitbit (the last 4 days with a higher resting pulse; shorter nights after a ride day) and Strava rides every 5th day. */
function rows() {
  const rideDays = new Set();
  const activities = [];
  for (let i = 0; i < 700; i += 5) {
    const date = addDays(TODAY, -i);
    rideDays.add(date);
    const km = 30 + (i % 4) * 10;
    const speed = i < 90 ? 26.2 : 25;
    activities.push(actRecord({ id: `9${i}`, startLocal: `${date}T08:00:00`, name: `Fictional ride ${i}`, type: 'Ride', km, movingS: Math.round((km / speed) * 3600) }));
  }
  const healthDays = [];
  for (let i = 0; i < 100; i++) {
    const date = addDays(TODAY, -i);
    healthDays.push({ date, restingHr: i < 4 ? 66 : 52 + (i % 5), sleep: { asleepMin: rideDays.has(addDays(date, -1)) ? 390 : 420 + (i % 3) * 5 }, src: 'google', at: `${date}T08:00:00Z` });
  }
  return { healthDays, activities };
}

async function shot(page, info, name) {
  if (!SHOTS) return;
  const w = info.project.name === 'phone' ? 390 : 1440;
  await page.evaluate(() => window.scrollTo(0, 0));
  const vp = page.viewportSize();
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: vp.width, height: Math.max(vp.height, h) });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SHOTS}/${name}-${w}.png`, fullPage: true });
  await page.setViewportSize(vp);
}

async function setup(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.clock.setFixedTime(new Date(`${TODAY}T10:00:00+02:00`));
}

test('Fragen: six cards, the first tab, a sentence and a limit each, and the way on', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await setup(page, context);
  const data = JSON.parse(readFileSync(FIX, 'utf8'));
  Object.assign(data.tables, rows());
  const file = info.outputPath('fragen-daten.json');
  writeFileSync(file, JSON.stringify(data));
  await page.goto('./');
  await importAndSettle(page, file);

  await page.goto('./#/auswerten/fragen');
  const root = page.locator('[data-fragen]');
  await expect(root.locator('h1')).toHaveText(T('Questions about my data'));
  await expect(root.locator('[data-frage]')).toHaveCount(6);
  for (const k of ['koerper', 'tempo', 'tour', 'zusammen', 'velo', 'jahr']) await expect(root.locator(`[data-frage="${k}"] [data-frage-antwort]`)).not.toBeEmpty();

  const ans = (k) => root.locator(`[data-frage="${k}"] [data-frage-antwort]`);
  // the resting pulse: 4 days above the usual, with the range
  await expect(ans('koerper')).toContainText('über deinem Üblichen');
  await expect(ans('koerper')).toContainText('bpm');
  // faster in the last 90 days (26.2 against 25.0 km/h)
  await expect(ans('tempo')).toContainText('schneller');
  // the nights after a ride day are shorter
  await expect(ans('zusammen')).toContainText('kürzer');
  // the limit: never «because»
  await expect(root.locator('[data-frage="koerper"] .lim')).toContainText(T('Observation, not a cause. {n} days with a value; your usual is the middle 80 % of the last 60 days.').replace('{n}', '60'));
  // «Why?» opens the rule
  await root.locator('[data-frage="tempo"] details summary').click();
  await expect(root.locator('[data-frage="tempo"] details p')).toBeVisible();
  await shot(page, info, 'fragen');

  // a way on: the numbers behind the resting pulse
  await root.locator('[data-frage="koerper"] [data-frage-mehr]').click();
  await expect(page).toHaveURL(/#\/auswerten\/analyse\/rhr/);
  expect(errors).toEqual([]);
});

test('Fragen: without data every card says so and nothing is guessed', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await setup(page, context);
  await page.goto('./#/auswerten/fragen');
  await ready(page);
  const root = page.locator('[data-fragen]');
  await expect(root.locator('[data-frage]')).toHaveCount(6);
  await expect(root.locator('[data-frage][data-state="few"]')).toHaveCount(6);
  await expect(root.locator('[data-empty]')).toContainText(T('Not enough data for questions yet'));
  await root.locator('[data-empty] a', { hasText: T('See where your numbers come from') }).click();
  await expect(page).toHaveURL(/#\/auswerten\/quellen/);
  await page.goBack();
  await shot(page, info, 'fragen-leer');
  expect(errors).toEqual([]);
});

test('Fragen: the search leads to the tab', async ({ page, context }, info) => {
  await setup(page, context);
  await page.goto('./');
  await ready(page);
  if (info.project.name === 'phone') await page.locator('header.top .search button.icon').click();
  const field = page.getByRole('searchbox', { name: T('What do you want to do? Search or say an action') }).first();
  await field.fill('frag deine daten');
  await expect(page.locator('[data-cmd="fragen"]').first()).toContainText(T('Questions about my data'));
  await field.press('Enter');
  await expect(page).toHaveURL(/#\/auswerten\/fragen/);
});
