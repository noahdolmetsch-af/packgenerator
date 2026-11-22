// «Zählen?» for Fitbit workouts (Noah 21.11.2026, Klügere Auswertungen K4): fictional workouts, the clock on Friday 9 October 2026;
// German UI, phone + desktop. SHOTS=<folder> saves pictures (Handy 390 / Computer 1440).
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, put } from './aktiv-fixture.js';
import { flowSeeded } from './wall-fixture.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const press = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());
const SHOTS = process.env.SHOTS || '';

const ex = (name, start, min, extra = {}) => ({ type: 'OTHER', name, start, end: '20:00', min, ...extra });
const ROWS = {
  healthDays: [
    { date: '2026-10-07', exercises: [ex('Tennis', '18:00', 60, { hr: 128 })], src: 'google', at: '2026-10-07T08:00:00Z' },
    { date: '2026-10-02', exercises: [ex('Tennis', '18:00', 90, { hr: 131 })], src: 'google', at: '2026-10-02T08:00:00Z' },
    { date: '2026-10-03', exercises: [ex('Hockey', '19:30', 120)], src: 'google', at: '2026-10-03T08:00:00Z' },
    { date: '2026-10-06', exercises: [ex('Walk', '12:00', 40)], src: 'google', at: '2026-10-06T08:00:00Z' },
    { date: '2026-10-08', exercises: [ex('Tennis', '10:00', 60)], src: 'google', at: '2026-10-08T08:00:00Z' },
    { date: '2026-10-04', exercises: [ex('Tennis', '17:00', 60)], src: 'google', at: '2026-10-04T08:00:00Z' },
  ],
  // the Tennis of 8 October is also a Strava activity (the same session), the one of 4 October already has a tick
  activities: [
    { id: 'test_data_fz_s1', day: '2026-10-08', time: '10:05', start: '2026-10-08T08:05:00Z', name: 'Tennis fiction', type: 'Tennis', kind: 'other', km: 0, hm: null, movingS: 3300, elapsedS: 3600, gearId: null, hrAvg: 120, hrMax: 150, commute: false, trainer: false, wAvg: null, wMax: null, wDevice: false, spdAvg: null, spdMax: null, cad: null, tempAvg: null, wNorm: null, kj: null, effort: null, line: null, workout: null, prs: 0, achv: 0, elevHigh: null, elevLow: null },
  ],
  flowLog: [{ id: 'test_data_fz_t1', actId: 'tennis', day: '2026-10-04', at: '2026-10-04T15:00:00+02:00', n: 1 }],
};

async function open(page, context) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  await page.goto('./#/flow');
  await ready(page);
  await flowSeeded(page);
  await put(page, ROWS);
  await page.goto('./#/flow/sports');
  await page.reload();
  await ready(page);
  return errors;
}
async function shotCard(page, info, name) {
  if (!SHOTS) return;
  await page.waitForTimeout(700);
  await page.locator('[data-fitbit-zaehlen]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
}
const fitbitTicks = (page) => page.evaluate(async () => {
  const db = await new Promise((res) => { const r = indexedDB.open('pack-generator'); r.onsuccess = () => res(r.result); });
  const all = await new Promise((res) => { const r = db.transaction('flowLog').objectStore('flowLog').getAll(); r.onsuccess = () => res(r.result); });
  db.close();
  return all.filter((e) => e.via === 'fitbit').map((e) => ({ actId: e.actId, day: e.day, min: e.min, at: e.at })).sort((a, b) => a.day.localeCompare(b.day));
});

test('Zaehlen: only real suggestions, one tap makes the tick with the minutes, Undo takes it back', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const card = page.locator('[data-fitbit-zaehlen]');
  await expect(card).toBeVisible();
  // Tennis: 7 and 2 October; the 4th has a tick, the 8th is the Strava session; Walk stays out; Hockey: 3 October
  await expect(card.locator('[data-fz-sport="tennis"] [data-fz-row]')).toHaveCount(2);
  await expect(card.locator('[data-fz-sport="hockey"] [data-fz-row]')).toHaveCount(1);
  await expect(card.locator('[data-fz-sport]')).toHaveCount(2);
  await expect(card).not.toContainText('40 Min'); // the walk
  await shotCard(page, info, 'fitbit-zaehlen-karte');

  await press(card.locator('[data-fz-sport="hockey"] [data-fz-count]'), info);
  await expect(card.locator('[data-fz-sport="hockey"]')).toHaveCount(0);
  await expect.poll(() => fitbitTicks(page)).toEqual([{ actId: 'hockey', day: '2026-10-03', min: 120, at: '2026-10-03T17:30:00.000Z' }]);
  await press(page.locator('.rtoast').getByRole('button', { name: T('Undo') }), info);
  await expect(card.locator('[data-fz-sport="hockey"] [data-fz-row]')).toHaveCount(1);
  await expect.poll(() => fitbitTicks(page)).toEqual([]);
  expect(errors).toEqual([]);
});

test('Zaehlen: «Count all» for a sport, «Do not count» leaves one out for good', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const card = page.locator('[data-fitbit-zaehlen]');
  await press(card.locator('[data-fz-sport="hockey"] [data-fz-skip]'), info);
  await expect(card.locator('[data-fz-sport="hockey"]')).toHaveCount(0);
  expect(await fitbitTicks(page)).toEqual([]);
  await page.reload();
  await ready(page);
  await expect(card.locator('[data-fz-sport="hockey"]')).toHaveCount(0); // never asked again

  await press(card.locator('[data-fz-all="tennis"]'), info);
  await expect(card).toBeHidden();
  await expect.poll(() => fitbitTicks(page)).toEqual([
    { actId: 'tennis', day: '2026-10-02', min: 90, at: '2026-10-02T16:00:00.000Z' },
    { actId: 'tennis', day: '2026-10-07', min: 60, at: '2026-10-07T16:00:00.000Z' },
  ]);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/fitbit-zaehlen-danach-${info.project.name === 'phone' ? 390 : 1440}.png` });
  expect(errors).toEqual([]);
});
