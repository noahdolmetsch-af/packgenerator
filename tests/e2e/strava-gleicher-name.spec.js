// Gesamttest 20.10.2026 B1 (Noah «1a»): Strava rides that wait with a Strava bike the app did not know at
// import time (the bike was renamed later) are assigned on opening «Zum Prüfen», with «Rückgängig».
// A ride whose sensor says another bike stays for you. Fictional bikes and rides only; in German, no
// sideways scroll, no page errors.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const P = 'test_data_gn_';
const GB = `${P}gravel`;
const MR = `${P}mtb`;
const zurichToday = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const day = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${zurichToday()}T12:00:00Z`));
const entry = (id, f) => ({ id: `${P}${id}`, time: null, kind: 'ride', source: 'strava', name: '', device: '', serial: null, profile: '', sensors: [], gear: '', type: '', stravaId: null, by: null, sure: 'unclear', state: 'open', reason: null, note: '', importId: null, inclusive: false, span: null, tripId: null, at: `${f.date}T18:00:00.000Z`, ...f });
const waiting = (id, f) => entry(id, { gear: 'Demo Kies', reason: { code: 'none', gear: 'Demo Kies', profile: '' }, ...f });

function seed() {
  return {
    bikes: [
      { id: GB, name: 'Demo Kies', type: 'Gravel bike', slots: [], setup: {}, fixtures: [], km: 1000, kmDate: day(-60) },
      { id: MR, name: 'Demo Berg', type: 'Hardtail', slots: [], setup: {}, fixtures: [], km: 500, kmDate: day(-60) },
    ],
    kmBook: [
      entry('s1', { bikeId: GB, date: day(-60), km: 1000, kind: 'start', source: 'hand', by: 'user', sure: 'user', state: 'counted', note: 'Start value' }),
      entry('s2', { bikeId: MR, date: day(-60), km: 500, kind: 'start', source: 'hand', by: 'user', sure: 'user', state: 'counted', note: 'Start value' }),
      waiting('w1', { date: day(-3), km: 40, stravaId: '9001', name: 'Kiesrunde Test' }),
      waiting('w2', { date: day(-2), km: 30, stravaId: '9002', name: 'Abendrunde Test' }),
      // the sensor says the other bike: a contradiction, it stays for you
      waiting('w3', { date: day(-1), km: 20, stravaId: '9003', name: 'Widerspruch Test', sensors: ['FPTEST'] }),
    ],
    settings: [{ key: 'kmRules', value: [{ id: 'r1', kind: 'sensor', value: 'FPTEST', bikeIds: [MR] }] }],
  };
}

async function writeTables(page, data) {
  await page.evaluate(
    (data) =>
      new Promise((ok, fail) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = () => fail(r.error);
        r.onsuccess = () => {
          const tx = r.result.transaction(Object.keys(data), 'readwrite');
          for (const [name, rows] of Object.entries(data)) for (const row of rows) tx.objectStore(name).put(row);
          tx.oncomplete = () => (r.result.close(), ok());
          tx.onerror = () => fail(tx.error);
        };
      }),
    data,
  );
}

test('Strava «Zum Prüfen»: same name → assigned automatically, Undo brings them back', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  await ready(page);
  await writeTables(page, seed());
  await page.goto('./#/bikes?tab=care&view=strava-check');
  await page.reload();
  await ready(page);
  const main = page.locator('main');

  const note = main.locator('.note[role="status"]');
  await expect(note).toContainText(T('{n} rides assigned automatically: the Strava bike has the same name.', { n: 2 }));
  await expect(main.locator('[data-ride="9001"]')).toHaveCount(0);
  await expect(main.locator('[data-ride="9003"]')).toBeVisible();
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw).toBeLessThanOrEqual(page.viewportSize().width);

  // «Rückgängig»: both wait again and are not assigned again on the next visit
  await note.getByRole('button', { name: T('Undo') }).click();
  await expect(main.locator('[data-ride="9001"]')).toBeVisible();
  await expect(main.locator('[data-ride="9002"]')).toBeVisible();
  await page.reload();
  await ready(page);
  await expect(main.locator('[data-ride="9001"]')).toBeVisible();
  await expect(main.locator('.note[role="status"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
