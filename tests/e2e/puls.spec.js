// v0.116.0 Puls pro Fahrt (Noah 12.10.2026 «1b 2a und b», «1a 2a»): the heart rate of the Strava rides
// as a quiet observation in the bike's ride ledger, Rückblick (last tour), Touren (average per trip),
// Aktiv (this week), one ride and Today's «This week». Fictional fixture (test_data_gtp_) plus Strava
// ledger entries with heart rate; German, phone + desktop. PULS_SHOTS=<dir> also saves screenshots.
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle } from './settle.js';
import { actRecord } from '../../src/lib/training.js';
import { openShort } from './kurz-open.js';

const FIX = fileURLToPath(new URL('../fixtures/gesamttest/test_data_gtp_daten.json', import.meta.url));
const P = 'test_data_gtp_';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const SHOTS = process.env.PULS_SHOTS || '';

const ride = (id, bikeId, date, km, hrAvg, hrMax, hh = '06') => ({
  id: `${P}hr-${id}`, bikeId, date, time: `${date}T${hh}:00:00.000Z`, km, kind: 'ride', source: 'strava', name: `${P} Fahrt ${id}`, device: 'Edge', serial: null,
  profile: '', sensors: [], gear: '', type: 'Ride', stravaId: `9${id}`, hrAvg, hrMax, by: 'gear', sure: 'likely', state: 'counted', reason: null, note: '',
  importId: null, inclusive: false, span: null, tripId: null, at: `${date}T18:00:00.000Z`,
});
const ROAD = `${P}road`, HT = `${P}hardtail`, FULLY = `${P}fully`;
const KM = [
  ride('1', ROAD, '2026-10-08', 80, 132, 165),
  ride('2', ROAD, '2026-10-09', 95, 136, 171),
  ride('3', ROAD, '2026-10-10', 70, 130, 160),
  ride('4', HT, '2026-10-09', 35, 145, 178),
  ride('5', ROAD, '2026-10-12', 40, 141, 168, '05'),
  ride('6', HT, '2026-09-27', 30, 139, 172),
  ride('7', FULLY, '2026-09-13', 38, 128, 158),
];

async function start(page, context, info) {
  const data = JSON.parse(readFileSync(FIX, 'utf8'));
  data.tables.kmBook = [...(data.tables.kmBook ?? []), ...KM];
  // AT1: Touren shows the Strava activities themselves, so the same rides are also in the activities store
  data.tables.activities = KM.map((r) => actRecord({ id: r.stravaId, startLocal: `${r.date}T08:00:00`, name: r.name, type: 'Ride', km: r.km, movingS: 3 * 3600, hrAvg: r.hrAvg, hrMax: r.hrMax }));
  const file = info.outputPath('puls-daten.json');
  writeFileSync(file, JSON.stringify(data));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.clock.setFixedTime(new Date('2026-10-12T10:00:00+02:00'));
  await page.goto('./');
  await importAndSettle(page, file);
  // the ride of today (trip28) would open «Unterwegs» once on Today: count it as opened
  await page.evaluate((v) => localStorage.setItem('ride.autoOpened', v), `${P}trip28:2026-10-12`);
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

test('Puls pro Fahrt: ledger, Rückblick, Touren, Aktiv, one ride, Today', async ({ page, context }, info) => {
  await start(page, context, info);
  const line = (avg, max) => T('Ø {avg} · max {max} bpm', { avg, max });

  // P1 the ride ledger of the road bike: every Strava ride with its heart rate
  await page.goto(`./#/bikes?tab=care&bike=${ROAD}&open=1`);
  await expect(page.getByText(line(136, 171)).first()).toBeVisible();
  await shot(page, info, 'P1-fahrtenbuch');

  // P2 Rückblick: the last tour with its heart rate instead of «kommt später»
  // (SN2 «Seiten neu»: the last ride's numbers are folded at the end of the Rückblick)
  await page.goto('./#/debrief');
  // UI-Regeln Teil 2 (Noah 14.10.2026 «a», on purpose): on a phone «Letzte Fahrt» starts closed, one tap opens it
  if (info.project.name === 'phone') await page.getByRole('button', { name: new RegExp(`^${T('Last ride')}`) }).click();
  await page.getByRole('button', { name: T('Numbers of the last ride') }).click();
  await expect(page.locator('main .heart').first()).toContainText(T('Heart rate'));
  await shot(page, info, 'P2-rueckblick');

  // P3 Touren: the heart rate of each ride (AT1, 14.10.2026: «Ø HF» and «max. HF» in the values of every
  // Strava activity of «Abgeschlossene Touren»; before, SN4g showed them in the rows of the app trips;
  // Gesamttest 20.10.2026 B3: the activities have their own tab Touren › Fahrten)
  await page.goto('./#/trips/rides');
  await openShort(page);
  // 0.163.0 «Handy kurz» (2b): on a phone the values of an activity are one grey line
  const hr = info.project.name === 'phone' ? page.locator('[data-activities] [data-act-line]') : page.locator('[data-activities] [data-act-values] [data-field="hf"]');
  await expect(hr.filter({ hasText: new RegExp(`\\d+\\s*${T('bpm').replace('/', '\\/')}`) }).first()).toBeVisible();
  await hr.first().scrollIntoViewIfNeeded();
  await shot(page, info, 'P3-touren');

  // P4 Aktiv: «Aktiv neu» (Noah 20.10.2026 «2a», 0.168.0, changed on purpose): «Deine Woche in Zahlen» replaces
  // «Velo diesen Monat» and «Puls diese Woche»; the pulse of each ride stays in P1, P3, P5 and on Today (P6)
  await page.goto('./#/flow');
  await expect(page.getByRole('heading', { name: T('Your week in numbers') })).toBeVisible();
  await shot(page, info, 'P4-aktiv');

  // P5 one ride: heart rate Ø / max beside the numbers (same day and km as the Strava ride)
  await page.goto('./#/debrief/ride/ride-gtp-01');
  await expect(page.getByText(T('Heart rate Ø / max · bpm'))).toBeVisible();
  await expect(page.getByText('139 / 172')).toBeVisible();
  await shot(page, info, 'P5-fahrt');

  // P6 Today: «This week» with the heart rate of this week's rides
  await page.goto('./');
  await expect(page.locator('[data-section="week"] [data-week-values]')).toContainText(line(141, 168));
  await shot(page, info, 'P6-heute');
});
