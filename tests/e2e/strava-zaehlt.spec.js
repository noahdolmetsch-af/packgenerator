// v0.121.0 Strava-Fahrten zählen mit (Noah 12.10.2026 «1a»): the counted Strava rides count in Today's
// «This week» and «Bike this month» and in Aktiv's «Bike this month»; a Strava ride that was also
// uploaded as a file counts once. Fictional fixture (test_data_gtp_) plus Strava ledger entries; German,
// phone + desktop. ZAEHLT_SHOTS=<dir> also saves screenshots.
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle } from './settle.js';

const FIX = fileURLToPath(new URL('../fixtures/gesamttest/test_data_gtp_daten.json', import.meta.url));
const P = 'test_data_gtp_';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const SHOTS = process.env.ZAEHLT_SHOTS || '';

const ride = (id, bikeId, date, km, state = 'counted') => ({
  id: `${P}sz-${id}`, bikeId, date, time: `${date}T06:00:00.000Z`, km, kind: 'ride', source: 'strava', name: `${P} Fahrt ${id}`, device: 'Edge', serial: null,
  profile: '', sensors: [], gear: '', type: 'Ride', stravaId: `8${id}`, hrAvg: null, hrMax: null, by: 'gear', sure: 'likely', state, reason: null, note: '',
  importId: null, inclusive: false, span: null, tripId: null, at: `${date}T18:00:00.000Z`,
});
const ROAD = `${P}road`, HT = `${P}hardtail`;
// this week (Monday 5. to Sunday 11. October): 3 days with Strava rides; October 1–11: 280 km
const KM = [
  ride('1', ROAD, '2026-10-06', 80),
  ride('2', ROAD, '2026-10-08', 95),
  ride('3', HT, '2026-10-08', 35),
  ride('4', ROAD, '2026-10-10', 70),
  // waits in «Zum Prüfen»: does not count yet
  ride('5', HT, '2026-10-09', 50, 'open'),
  // September 1–11: 200 km to compare with (+40 %)
  ride('6', ROAD, '2026-09-05', 200),
  // the same ride as the uploaded file ride-gtp-01 (27.9., 30 km, 06:00): counts once
  ride('7', HT, '2026-09-27', 30),
];

async function start(page, context, info) {
  const data = JSON.parse(readFileSync(FIX, 'utf8'));
  data.tables.kmBook = [...(data.tables.kmBook ?? []), ...KM];
  const file = info.outputPath('zaehlt-daten.json');
  writeFileSync(file, JSON.stringify(data));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.clock.setFixedTime(new Date('2026-10-11T10:00:00+02:00'));
  await page.goto('./');
  await importAndSettle(page, file);
}

async function shot(page, info, name, sel) {
  if (!SHOTS) return;
  const w = info.project.name === 'phone' ? 390 : 1440;
  await page.waitForTimeout(400);
  if (sel) {
    await page.locator(sel).first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${SHOTS}/${name}-${w}.png` });
  } else await page.screenshot({ path: `${SHOTS}/${name}-${w}.png`, fullPage: true });
}

test('Strava rides count in This week and Bike this month, a file ride once', async ({ page, context }, info) => {
  await start(page, context, info);

  // SZ1 Today: «This week» counts the 3 days with Strava rides
  await page.goto('./');
  const week = page.locator('[data-section="week"]');
  await expect(week.locator('.sub')).toContainText(T('{n} days active', { n: 3 }));
  await shot(page, info, 'SZ1-heute-woche', '[data-section="week"]');

  // SZ2 Aktiv: «Bike this month» from the rides and Strava: 280 km, +40 % against September
  await page.goto('./#/flow');
  const km = page.locator('[data-section="km"]');
  await expect(km).toContainText('280 km');
  await expect(km).toContainText('40 %');
  await expect(page.getByText(T('from your rides and Strava'))).toBeVisible();
  await shot(page, info, 'SZ2-aktiv-monat', '[data-section="km"]');
});
