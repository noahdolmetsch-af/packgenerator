// «Form im Vergleich zu früher» (Noah 21.11.2026, Klügere Auswertungen K2): fictional rides of three years (May to October),
// the clock on Friday 9 October 2026; German UI, phone + desktop. SHOTS=<folder> saves pictures (Handy 390 / Computer 1440).
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { D0 } from './aktiv-fixture.js';
import { put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const press = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());
const SHOTS = process.env.SHOTS || '';
const P = 'test_data_vg_';

/** Per year: 12 rides in June (power meter, pulse 100) with watt per beat = wpb, and 25 days of resting pulse in July. */
function rows(spec, { lowDays = false } = {}) {
  const healthDays = [];
  const activities = [];
  for (const [year, { wpb, rhr }] of Object.entries(spec)) {
    for (let d = 1; d <= 25; d++) {
      const date = `${year}-07-${String(d).padStart(2, '0')}`;
      healthDays.push({ date, restingHr: rhr, src: 'google', at: `${date}T08:00:00Z` });
    }
    for (let d = 1; d <= 12; d++) {
      const day = `${year}-06-${String(d * 2).padStart(2, '0')}`;
      const low = lowDays && year === '2026' && d <= 4; // four rides with a much lower value
      const w = (low ? 0.8 : wpb) * 100;
      activities.push({
        id: `${P}${year}-${d}`, day, time: '08:00', start: `${day}T06:00:00Z`, name: `${P}${year}-${d}`, type: 'Ride', kind: 'bike', km: 40, hm: 400, movingS: 7200, elapsedS: 7500, gearId: null,
        hrAvg: 100, hrMax: 130, commute: false, trainer: false, wAvg: w, wMax: w * 3, wDevice: true, spdAvg: null, spdMax: null, cad: 85,
        tempAvg: null, wNorm: null, kj: null, effort: null, line: null, workout: null, prs: 0, achv: 0, elevHigh: null, elevLow: null,
      });
    }
  }
  return { healthDays, activities };
}
const THREE = { 2024: { wpb: 1.0, rhr: 52 }, 2025: { wpb: 1.05, rhr: 50 }, 2026: { wpb: 1.1, rhr: 48 } };

async function open(page, context, data, extra = {}) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  await page.goto('./#/flow');
  await ready(page);
  await put(page, { ...data, ...extra });
  await page.goto('./#/flow/form');
  await page.reload();
  await ready(page);
  return errors;
}
async function shotCard(page, info, name) {
  if (!SHOTS) return;
  await page.waitForTimeout(700);
  await page.locator('[data-vergleich]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
}

test('Vergleich: three years in the same direction say «Sicher», words without judgement', async ({ page, context }, info) => {
  const errors = await open(page, context, rows(THREE));
  const card = page.locator('[data-vergleich]');
  await expect(card.locator('[data-sure]')).toHaveAttribute('data-sure', 'sure');
  await expect(card.locator('[data-sure]')).toContainText(T('Sure'));
  await expect(card.locator('[data-vergleich-sentence]')).toContainText('1.1');
  await expect(card.locator('[data-vergleich-sentence]')).toContainText('1.05');
  await expect(card.locator('[data-vergleich-year]')).toHaveCount(3);
  await shotCard(page, info, 'vergleich-sicher');
  expect(errors).toEqual([]);
});

test('Vergleich: a marker leaves its days out; «Too little data» with a higher minimum', async ({ page, context }, info) => {
  // four low rides this year (June 2, 4, 6, 8): without a marker the middle value stays, so build the low ones into most of the rides
  const data = rows(THREE, { lowDays: true });
  const marker = { settings: [{ key: 'training.marker', value: [{ id: 'm1', kind: 'injured', from: '2026-06-01', to: '2026-06-09' }] }] };
  const errors = await open(page, context, data, marker);
  const card = page.locator('[data-vergleich]');
  await card.locator('[data-vergleich-how] summary').click();
  await expect(card.locator('[data-vergleich-how]')).toContainText('9');
  await shotCard(page, info, 'vergleich-so-gerechnet');
  // the minimum of rides: 12 rides a year, with 8 left (4 marked) a minimum of 10 gives «few»
  await expect(card.locator('[data-sure]')).toHaveAttribute('data-sure', 'few');
  await card.locator('[data-vergleich-rides]').fill('8');
  await card.locator('[data-vergleich-rides]').dispatchEvent('change');
  await expect(card.locator('[data-sure]')).not.toHaveAttribute('data-sure', 'few');
  await expect(card.locator('[data-vergleich-reset]')).toBeVisible();
  await press(card.locator('[data-vergleich-reset]'), info);
  await expect(card.locator('[data-sure]')).toHaveAttribute('data-sure', 'few');
  expect(errors).toEqual([]);
});

test('Vergleich: without rides it says what is missing', async ({ page, context }, info) => {
  const errors = await open(page, context, { healthDays: rows(THREE).healthDays });
  const card = page.locator('[data-vergleich]');
  await expect(card.locator('[data-sure]')).toHaveAttribute('data-sure', 'few');
  await expect(card.locator('[data-vergleich-empty]')).toBeVisible();
  await shotCard(page, info, 'vergleich-leer');
  expect(errors).toEqual([]);
});
