// «Muster entdeckt» (Noah 03.11.2026, Idee 5): the value «Late sessions» in «Alle Werte» and its page.
// Same set-up as analyse-wert.spec.js:  German, phone +
// desktop; fictional Fitbit days and one fictional trip written straight into IndexedDB; the clock stands on
// Friday 9 October 2026 (aktiv-fixture.js).
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const H = (fill) => Array.from({ length: 24 }, (_, i) => fill(i));

function rows() {
  const healthDays = [];
  for (let i = 0; i < 120; i++) {
    const date = addDays(TODAY, -i);
    healthDays.push({
      date, restingHr: 48 + (i % 5) + (i >= 20 && i < 24 ? 6 : 0), steps: 6000 + (i % 7) * 900,
      sleep: { asleepMin: 380 + (i % 4) * 20, deepMin: 70, remMin: 85, lightMin: 220, awakeMin: 20, start: '23:20', end: '06:50', efficiency: 92 },
      vo2max: 55 + (i % 3) / 10, hrH: H((h) => 52 + Math.round(18 * Math.max(0, Math.sin((h - 6) / 5)))), stepH: H((h) => (h >= 7 && h <= 20 ? 300 + h * 20 : 0)),
      src: 'google', at: `${date}T08:00:00Z`,
    });
  }
  const trips = [{ id: 'e2e-wert-trip', name: 'Probefahrt Jura', domain: 'bike', status: 'done', startDate: addDays(TODAY, -23), days: 4 }];
  return { healthDays, trips };
}

async function open(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  await put(page, rows());
  await page.goto('./#/auswerten/analyse');
  await page.reload();
  await ready(page);
  await page.locator('[data-tab="werte"]').click(); // the tiles sit in the tab «Alle Werte»
  await page.locator('[data-groups-toggle]').click(); // the groups are closed until opened
  return errors;
}


test('Späte Einheiten: the value is in «Alle Werte» and has its page', async ({ page, context }) => {
  const errors = await open(page, context);
  // one evening session (18:30, an hour) and one morning session
  const act = (id, day, time) => ({ id, day, time, start: `${day}T10:00:00Z`, name: id, type: 'Ride', kind: 'bike', km: 25, hm: 300, movingS: 3600, elapsedS: 3700, gearId: null, hrAvg: 132, hrMax: 160, commute: false, trainer: false, wAvg: null, wMax: null, wDevice: false, spdAvg: null, spdMax: null, cad: 85, tempAvg: 12, wNorm: null, kj: null, effort: 60, line: null, workout: null, prs: 0, achv: 0, elevHigh: null, elevLow: null, kcal: 800 });
  await put(page, { activities: [act('e2e-late-1', addDays(TODAY, -2), '18:30'), act('e2e-late-2', addDays(TODAY, -3), '07:00')] });
  await page.reload();
  await ready(page);
  await page.locator('[data-tab="werte"]').click();
  await page.locator('[data-groups-toggle]').click();
  await page.locator('[data-value="late"]').click();
  await expect(page).toHaveURL(/#\/auswerten\/analyse\/late$/);
  await expect(page.locator('[data-detail="late"]').getByRole('heading', { level: 1 })).toHaveText(T('Late sessions'));
  expect(errors).toEqual([]);
});
