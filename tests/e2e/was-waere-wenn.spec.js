// «Was wäre, wenn …» (Noah 03.11.2026, Cockpit-Idee 2) on «Form und Erholung»: pause, short and long session for one
// day of the next week, a model with a range. German, phone + desktop; fictional Strava rides and one planned session
// in IndexedDB; the clock stands on Friday 9 October 2026.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en;
const P = 'test_data_ww_';

function rows() {
  const act = (id, day, movingS, hrAvg, effort) => ({
    id: `${P}${id}`, day, time: '07:10', start: `${day}T05:10:00Z`, name: `${P}${id}`, type: 'Ride', kind: 'bike', km: 30, hm: 400, movingS, elapsedS: movingS + 300, gearId: null,
    hrAvg, hrMax: hrAvg + 25, commute: false, trainer: false, wAvg: null, wMax: null, wDevice: false, spdAvg: null, spdMax: null, cad: 84, hist: { 120: movingS / 2, 150: movingS / 2 },
    tempAvg: 8, wNorm: null, kj: null, effort, line: null, workout: null, prs: 0, achv: 0, elevHigh: null, elevLow: null, kcal: Math.round(movingS / 6),
  });
  const activities = [];
  for (let i = 0; i < 60; i += 3) activities.push(act(`r${i}`, addDays(TODAY, -i), 5400, 135, 60 + (i % 5) * 10));
  const sessions = [{ id: 'ww1', day: addDays(TODAY, 3), kind: 'bike', name: `${P}Grundlage`, mins: 90, zone: 2 }];
  return { activities, settings: [{ key: 'training.plan', value: { sessions } }] };
}

test('Was wäre, wenn: Pause, kurz und lang im Vergleich, mit Spanne', async ({ page, context }) => {
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
  const card = page.locator('[data-form-whatif]');
  await expect(page.getByRole('heading', { name: T('What if …') })).toBeVisible();
  // tomorrow: nothing planned, so three columns: pause, short, long
  await expect(card.locator('[data-ww-col]')).toHaveCount(3);
  await expect(card.locator('[data-ww-col="pause"]')).toBeVisible();
  await expect(card.locator('[data-ww-sentence]')).toContainText('langen Einheit');
  await expect(card.locator('[data-ww-note]')).toContainText('keine Vorhersage');
  await expect(card.getByText('Ruhepuls, HRV und Schlaf lassen sich aus einem Plan nicht vorhersagen')).toBeVisible();
  // the long session leaves more fatigue the day after than a pause
  await card.getByRole('button', { name: T('Fatigue|form') }).click();
  const n = async (id) => Number((await card.locator(`[data-ww-cell="${id}"] b`).innerText()).replace(/[^0-9.-]/g, ''));
  expect(await n('long-1')).toBeGreaterThan(await n('pause-1'));
  // the day with the planned session adds the column «Wie geplant»
  await card.locator('[data-ww-day]').selectOption(addDays(TODAY, 3));
  await expect(card.locator('[data-ww-col]')).toHaveCount(4);
  await expect(card.locator('[data-ww-col="plan"]')).toContainText('Wie geplant');
  // a longer «long» session changes the numbers
  const before = await n('long-1');
  await card.locator('[data-ww-long]').fill('300');
  expect(await n('long-1')).toBeGreaterThan(before);
  expect(errors).toEqual([]);
});
