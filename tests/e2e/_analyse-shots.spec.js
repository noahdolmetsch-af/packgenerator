// «Eigenes Diagramm» (Noah 27.10.2026 «1a 2a 3a und b möglich 4a 5a», mockups D1, D2, D3, D6): at the top of
// Analyse, up to 6 values from every area on one time axis, under each other or on top of each other; a tap
// on a day shows that day with every value; values are added with search, removed, reordered. German, phone
// + desktop, fictional Fitbit days, Strava rides, ticks, «Wi gaht's?» and one trip written straight into
// IndexedDB. The clock stands on Friday 9 October 2026 (aktiv-fixture.js). Fictional data only.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';
import { DEFAULT_KEYS } from '../../src/lib/analyse/diagram.js';
import { valueHref, dayHref } from '../../src/lib/analyse/jump.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const P = 'test_data_dg_';

function rows() {
  // fictional, but not too regular: a fixed noise per day, sleep a bit longer the night after sauna
  const rnd = (i, k) => {
    const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  const healthDays = [];
  for (let i = 0; i < 95; i++) {
    const date = addDays(TODAY, -i);
    const azm = (k) => Math.round(20 + 50 * rnd(k, 1));
    const sleep = Math.round(380 + 40 * rnd(i, 2) + (i % 4 === 0 ? 25 : 0) + 0.4 * azm(i + 1));
    healthDays.push({ date, azm: azm(i), restingHr: 48 + Math.round(4 * rnd(i, 3)) + (i >= 26 && i <= 31 ? 3 : 0), hrvMs: 45 + Math.round(15 * rnd(i, 4)), steps: 5000 + Math.round(6000 * rnd(i, 5)), sleep: { asleepMin: sleep, deepMin: 70, remMin: 85, lightMin: 220, awakeMin: 20, start: '23:20', end: '06:50', efficiency: 88 + Math.round(6 * rnd(i, 6)) }, spo2: 95 + Math.round(2 * rnd(i, 7)), breath: 14, kcal: 2100 + Math.round(500 * rnd(i, 8)), kcalActive: 550, hrMax: 135 + Math.round(30 * rnd(i, 9)), src: 'google', at: `${date}T08:00:00Z`, ...(i < 3 ? { hrH: Array.from({ length: 24 }, (_, h) => (h < 7 ? 50 : 62 + (h % 5) * 3)), stepH: Array.from({ length: 24 }, (_, h) => (h < 7 ? 0 : 200 + (h % 4) * 400)) } : {}) });
  }
  const act = (id, day, km) => ({
    id: `${P}${id}`, day, time: '17:10', start: `${day}T15:10:00Z`, name: `${P}${id}`, type: 'Ride', kind: 'bike', km, hm: 300, movingS: 4800, elapsedS: 5100, gearId: null,
    hrAvg: 132, hrMax: 160, commute: false, trainer: false, wAvg: null, wMax: null, wDevice: false, spdAvg: null, spdMax: null, cad: 85, tempAvg: 12, wNorm: null, kj: null, effort: 60, line: null, workout: null, prs: 0, achv: 0, elevHigh: null, elevLow: null, kcal: 800,
  });
  const activities = [];
  for (let i = 1; i < 90; i += 3) activities.push(act(`r${i}`, addDays(TODAY, -i), 25 + (i % 5) * 6));
  const flowLog = [];
  const tick = (actId, i, extra = {}) => flowLog.push({ id: `${P}${actId}_${i}`, actId, day: addDays(TODAY, -i), at: `${addDays(TODAY, -i)}T18:00:00+02:00`, ...extra });
  for (let i = 0; i < 60; i++) {
    if (i % 4 === 1) tick('sauna', i, { min: 30 });
    if (i % 5 === 2) tick('gym', i, { min: 60 });
    if (i % 7 === 3) tick('hockey', i, { min: 75 });
    if (i % 9 === 4) tick('tennis', i, { min: 90 });
    if (i % 2 === 0) tick('meditation', i, { min: 15 });
  }
  const flowChecks = [];
  for (let i = 0; i < 90; i++) flowChecks.push({ day: addDays(TODAY, -i), sleep: 5 + Math.round(4 * rnd(i, 10)), energy: 4 + Math.round(5 * rnd(i, 11)), mood: 5 + Math.round(4 * rnd(i, 12)) });
  const trips = [{ id: `${P}trip`, name: 'Probefahrt Jura', domain: 'bike', status: 'done', startDate: addDays(TODAY, -30), days: 4 }];
  // two fictional bikes with a km book and a chain that is soon worn
  const bikes = [
    { id: `${P}bk1`, name: 'Testvelo Gravel', km: 5200, parts: [{ key: 'chain', model: '', history: [{ action: 'replace', date: addDays(TODAY, -200), km: 2700 }] }, { key: 'tyres', model: '', history: [{ action: 'replace', date: addDays(TODAY, -100), km: 4200 }] }] },
    { id: `${P}bk2`, name: 'Testvelo Stadt', km: 900, parts: [] },
  ];
  const kmBook = [];
  for (let i = 1; i < 84; i += 2) kmBook.push({ id: `${P}kb${i}`, bikeId: i % 6 === 1 ? `${P}bk2` : `${P}bk1`, date: addDays(TODAY, -i), km: 20 + (i % 5) * 7, kind: 'ride', state: 'counted', at: `${addDays(TODAY, -i)}T18:00:00Z` });
  return { healthDays, activities, flowLog, flowChecks, trips, bikes, kmBook };
}

async function open(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow'); // seeds the activities of the small start (Eishockey, Sauna, Gym …)
  await ready(page);
  await expect(page.locator('[data-act]').first()).toBeVisible();
  await put(page, rows());
  return errors;
}
async function go(page, hash) {
  await page.goto(`./${hash}`);
  await page.reload();
  await ready(page);
}



const OUT = process.env.SHOT_DIR;
const snap = (page, name, info) => page.screenshot({ path: `${OUT}/${name}-${info.project.name}.png`, fullPage: true });
const tab = (page, k) => page.locator(`[data-tab="${k}"]`).click();

test('shots', async ({ page, context }, info) => {
  test.setTimeout(120000);
  const errors = await open(page, context);
  // a second entry called «Gym» (as on the real page), ticked a few times
  const flowLog = [];
  for (let i = 0; i < 40; i += 9) flowLog.push({ id: `${P}g2_${i}`, actId: 'test_data_gym2', day: addDays(TODAY, -i), at: `${addDays(TODAY, -i)}T18:00:00+02:00`, min: 60 });
  await put(page, { flowActs: [{ id: 'test_data_gym2', name: 'Gym', icon: 'heart', ring: 'move', order: 99, perTap: 1, minMin: 0, paused: false, goals: [], counts: [] }], flowLog });
  await go(page, '#/auswerten/analyse');
  await page.waitForTimeout(500);
  await snap(page, 'ueberblick', info);
  await tab(page, 'diagramm');
  await page.waitForTimeout(500);
  await snap(page, 'diagramm', info);
  expect(errors).toEqual([]);
});
