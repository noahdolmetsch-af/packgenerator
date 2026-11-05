// «Frage deine Daten» (Noah 03.11.2026, Idee 7): ⌘ K / Ctrl K opens the search; training questions are answered from the
// Strava activities on the device (fictional rides written straight into IndexedDB; the clock stands on Friday 9 October 2026).
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en;
const act = (id, ago, w, hr, km) => ({
  id, day: addDays(TODAY, -ago), time: '08:00', start: `${addDays(TODAY, -ago)}T06:00:00Z`, name: `Probe ${id}`, type: 'Ride', kind: 'bike', km, hm: 300, movingS: 5400, elapsedS: 5600, gearId: null,
  hrAvg: hr, hrMax: 160, commute: false, trainer: false, wAvg: w, wMax: null, wDevice: true, spdAvg: null, spdMax: null, cad: 85, tempAvg: 12, wNorm: null, kj: null, effort: 60, line: null, workout: null, prs: 0, achv: 0, elevHigh: null, elevLow: null, kcal: 800,
});

test('⌘ K opens the search and the app answers training questions', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/');
  await ready(page);
  await put(page, { activities: [act('e2e-q1', 3, 180, 130, 40), act('e2e-q2', 10, 150, 128, 30), act('e2e-q3', 20, 170, 125, 35)] });
  await page.reload();
  await ready(page);
  await page.keyboard.press('Control+k');
  const field = page.locator('.search input[type="search"]:visible').first();
  await expect(field).toBeFocused();
  // the most efficient rides: three rows, each a link to its ride; the first has the most watts per beat (170/125 = 1,36 … 180/130 = 1,38)
  await field.fill('Zeig mir meine effizientesten Fahrten');
  const card = page.locator('[data-aa="efficient"]');
  await expect(card).toBeVisible();
  await expect(card.locator('[data-aa-row]')).toHaveCount(3);
  await expect(card.locator('[data-aa-row]').first()).toContainText('Probe e2e-q1');
  await expect(card.locator('[data-aa-row]').first()).toHaveAttribute('href', '#/flow/training/a/e2e-q1');
  // two weeks against the two before
  await field.fill('Vergleiche meine letzten zwei Wochen');
  await expect(page.locator('[data-aa="compare"]')).toBeVisible();
  await expect(page.locator('[data-aa="compare"]')).toContainText(T('Distance|ask'));
  expect(errors).toEqual([]);
});
