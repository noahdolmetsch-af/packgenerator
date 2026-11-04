// «Belastungslandschaft» (Noah 03.11.2026, Cockpit-Idee 1) on the page «Form und Erholung»: the past days and the
// planned sessions as hills, the same days as curves, a day opens its sessions. German, phone + desktop; fictional
// Strava activities and two planned sessions written into IndexedDB; the clock stands on Friday 9 October 2026.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en;
const P = 'test_data_ls_';

function rows() {
  const act = (id, day, movingS, hrAvg, effort) => ({
    id: `${P}${id}`, day, time: '07:10', start: `${day}T05:10:00Z`, name: `${P}${id}`, type: 'Ride', kind: 'bike', km: 30, hm: 400, movingS, elapsedS: movingS + 300, gearId: null,
    hrAvg, hrMax: hrAvg + 25, commute: false, trainer: false, wAvg: null, wMax: null, wDevice: false, spdAvg: null, spdMax: null, cad: 84, hist: { 120: movingS / 2, 150: movingS / 2 },
    tempAvg: 8, wNorm: null, kj: null, effort, line: null, workout: null, prs: 0, achv: 0, elevHigh: null, elevLow: null, kcal: Math.round(movingS / 6),
  });
  const activities = [];
  for (let i = 0; i < 60; i += 3) activities.push(act(`r${i}`, addDays(TODAY, -i), 5400, 135, 60 + (i % 5) * 10));
  const sessions = [
    { id: 'ls1', day: addDays(TODAY, 2), kind: 'bike', name: `${P}Grundlage`, mins: 90, zone: 2 },
    { id: 'ls2', day: addDays(TODAY, 5), kind: 'bike', name: `${P}Intervalle`, mins: 60, zone: 4 },
  ];
  return { activities, settings: [{ key: 'training.plan', value: { sessions } }] };
}

test('Belastungslandschaft: Hügel, Kurven, ein Tag mit seinen Einheiten', async ({ page, context }, info) => {
  const shot = (name) => (process.env.SHOTS ? page.locator('[data-form-landscape]').screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` }) : null);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  await put(page, rows());
  await page.goto('./#/flow/form');
  await page.reload();
  await ready(page);
  const card = page.locator('[data-form-landscape]');
  await expect(page.getByRole('heading', { name: T('Load landscape') })).toBeVisible();
  const ls = card.locator('[data-chart="landscape"]');
  await expect(ls).toHaveAttribute('data-view', 'land');
  await expect(ls.locator('[data-plot]')).toHaveAttribute('data-n', '70'); // 56 days back, today, 14 ahead
  await expect(ls.locator('[data-ahead-label]')).toHaveText(T('planned, estimated|ls'));
  // the readout starts at today; the day below lists its single sessions, each a link
  await expect(ls.locator('[data-ls-day]')).toHaveAttribute('data-ls-day', TODAY);
  // through the days with the keyboard: two days on is the first planned session, an estimate
  await ls.locator('[data-plot]').focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(ls.locator('[data-ls-day]')).toHaveAttribute('data-ls-day', addDays(TODAY, 2));
  await expect(ls.locator('[data-ls-planned]')).toHaveCount(1);
  await expect(ls.locator('[data-ls-planned]')).toContainText(`${P}Grundlage`);
  await expect(ls.locator('[data-ls-planned]')).toContainText('~Belastung 63'); // Z2 = 0,65 × FTP, 1,5 h: 0,65² × 1,5 × 100
  await shot('landschaft-huegel');
  // the same days as precise curves, with an axis
  await ls.getByRole('button', { name: T('Curves|ls') }).click();
  await expect(ls).toHaveAttribute('data-view', 'curve');
  await expect(ls.locator('[data-yticks]')).toBeVisible();
  await shot('landschaft-kurven');
  // a past day (5 days back from there) lists its ride as a link to the ride
  await ls.locator('[data-plot]').focus();
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowLeft');
  await expect(ls.locator('[data-ls-day]')).toHaveAttribute('data-ls-day', addDays(TODAY, -3));
  await expect(ls.locator('[data-ls-act] a')).toHaveAttribute('href', `#/flow/training/a/${P}r3`);
  expect(errors).toEqual([]);
});
