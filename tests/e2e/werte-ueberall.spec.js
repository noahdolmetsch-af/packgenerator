// v0.125.0 «Werte überall» (WU1–WU4) and «Strava verbinden» (SV1), Noah 13.10.2026 «1-5a», mockups approved
// «ich gebe alle bild mockups frei»: metres climbed from Strava on Today, Aktiv, the year goals and per part;
// the footprint; the card «Strava verbinden» until connected. Fictional fixture (test_data_gtp_) plus
// Strava ledger entries with climbing; German, phone + desktop. WERTE_SHOTS=<dir> also saves screenshots.
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle } from './settle.js';
import { openOverview } from './ov-fold.js';

const FIX = fileURLToPath(new URL('../fixtures/gesamttest/test_data_gtp_daten.json', import.meta.url));
const P = 'test_data_gtp_';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const SHOTS = process.env.WERTE_SHOTS || '';

const ride = (id, bikeId, date, km, hm) => ({
  id: `${P}wu-${id}`, bikeId, date, time: `${date}T06:00:00.000Z`, km, kind: 'ride', source: 'strava', name: `${P} Fahrt ${id}`, device: 'Edge', serial: null,
  profile: '', sensors: [], gear: '', type: 'Ride', stravaId: `9${id}`, hrAvg: 140, hrMax: 170, hm, by: 'gear', sure: 'likely', state: 'counted', reason: null, note: '',
  importId: null, inclusive: false, span: null, tripId: null, at: `${date}T18:00:00.000Z`,
});
const ROAD = `${P}road`;
// this week (Monday 5. to Sunday 11. October); the road bike's chain was last serviced on 3 October
const KM = [ride('1', ROAD, '2026-10-06', 80, 900), ride('2', ROAD, '2026-10-08', 95, 1100), ride('3', ROAD, '2026-10-10', 70, 700)];

async function start(page, context, info) {
  const data = JSON.parse(readFileSync(FIX, 'utf8'));
  data.tables.kmBook = [...(data.tables.kmBook ?? []), ...KM];
  const file = info.outputPath('werte-daten.json');
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

test('metres climbed on Today, Aktiv, the year goals and per part; Strava card until connected', async ({ page, context }, info) => {
  await start(page, context, info);
  const hm = /\d[\d'’ .]*\sHm/;

  // SV1: the card «Strava verbinden»; «Später» hides it for good. «Heute neu» A 5b (0.165.0, changed on purpose): on
  // top of Ich, no longer on Today
  await page.goto('./');
  await expect(page.locator('[data-section="week"]')).toBeVisible();
  await expect(page.locator('[data-section="strava-connect"]')).toHaveCount(0);
  await page.goto('./#/me');
  const card = page.locator('[data-section="strava-connect"]');
  await expect(card).toBeVisible();
  await expect(card.getByRole('link', { name: T('Connect') })).toHaveAttribute('href', '#/bikes?tab=care&view=strava');
  await shot(page, info, 'SV1-strava-karte');
  await card.getByRole('button', { name: T('Later') }).click();
  await expect(card).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.ich-cols')).toBeVisible();
  await expect(page.locator('[data-section="strava-connect"]')).toHaveCount(0);

  // WU1: «This week» with km, metres climbed and heart rate in one line; «Bike this month» with metres
  // («Heute neu» A: the month left Today, its metres are checked on Aktiv below)
  await page.goto('./');
  const vals = page.locator('[data-week-values]');
  await expect(vals).toContainText(hm);
  await expect(vals).toContainText(T('Minutes come with Fitbit'));
  await expect(vals).toContainText('140');
  await shot(page, info, 'WU1-heute-woche', '[data-section="week"]');

  // WU2: Aktiv «Deine Woche in Zahlen» (Aktiv neu 20.10.2026 «2a», changed on purpose: replaces «Velo diesen
  // Monat») with the metres climbed of the 7 days; without Fitbit the minutes point to the page Fitbit
  await page.goto('./#/flow');
  await openOverview(page);
  await expect(page.locator('[data-section="week-numbers"] [data-wn="hm"]')).toContainText(/2.?700/);
  await expect(page.locator('[data-section="azm"]')).toContainText(T('Connect Fitbit: then the minutes of every activity count here.'));
  await expect(page.locator('[data-section="azm"]')).toHaveAttribute('href', '#/me/fitbit');
  await shot(page, info, 'WU2-aktiv-monat', '[data-section="week-numbers"]');

  // WU3: Aktiv › Goals: three year goals, each can be switched off; the footprint
  await page.goto('./#/flow/goals');
  const goals = page.locator('[data-section="year-goals"]');
  await expect(goals.locator('[data-goal]')).toHaveCount(3);
  await expect(goals.locator('[data-goal="km"] .bar')).toBeVisible();
  await expect(goals.locator('[data-goal="azm"]')).toContainText(T('Not counted for the year yet. Your minutes of this week are on Aktiv.'));
  await expect(page.locator('[data-section="footprint"]')).toContainText('CO₂');
  await shot(page, info, 'WU3-ziele', '[data-section="year-goals"]');
  await goals.locator('[data-goal="km"] input[type="checkbox"]').uncheck();
  await expect(goals.locator('[data-goal="km"] .bar')).toHaveCount(0);
  await goals.locator('[data-goal="km"] .ofb').click();
  const inp = goals.locator('[data-goal="km"] input.inp');
  await inp.fill('6000');
  await inp.press('Enter');
  await expect(goals.locator('[data-goal="km"] .ofb')).toContainText(/6.000/);
  // Noah 19.10.2026: a goal can be emptied by hand (no goal), and set again
  await goals.locator('[data-goal="hm"] .ofb').click();
  await goals.locator('[data-goal="hm"] [data-clear]').click();
  await expect(goals.locator('[data-goal="hm"] .ofb')).toContainText(T('No goal · set one'));
  await expect(goals.locator('[data-goal="hm"] .bar')).toHaveCount(0);
  await goals.locator('[data-goal="hm"] .ofb').click();
  const hmInp = goals.locator('[data-goal="hm"] input.inp');
  await hmInp.fill('40000');
  await hmInp.press('Enter');
  await expect(goals.locator('[data-goal="hm"] .bar')).toBeVisible();

  // WU4: bike care: the chain (serviced 3 October) shows the metres climbed since: 900 + 1100 + 700
  await page.goto(`./#/bikes?tab=care&bike=${ROAD}`);
  await expect(page.locator('.ptable .hm').first()).toContainText(/2.700 Hm/);
  await shot(page, info, 'WU4-velopflege', '.ptable');
});

// Noah 19.10.2026 «1b»: with Fitbit days, Aktiv shows the minutes of this week, one bar per day, and the
// weekly goal can be changed. Fictional values; «today» is Sunday 11 October 2026.
test('active zone minutes of this week on Aktiv, with the weekly goal changeable', async ({ page, context }, info) => {
  const data = JSON.parse(readFileSync(FIX, 'utf8'));
  data.tables.healthDays = [
    { date: '2026-10-04', azm: 500, src: 'google', at: '2026-10-04T20:00:00.000Z' },
    { date: '2026-10-05', azm: 40, src: 'google', at: '2026-10-05T20:00:00.000Z' },
    { date: '2026-10-07', azm: 25, src: 'google', at: '2026-10-07T20:00:00.000Z' },
    { date: '2026-10-10', azm: 60, src: 'google', at: '2026-10-10T20:00:00.000Z' },
  ];
  const file = info.outputPath('azm-daten.json');
  writeFileSync(file, JSON.stringify(data));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.clock.setFixedTime(new Date('2026-10-11T10:00:00+02:00'));
  await page.goto('./');
  await importAndSettle(page, file);

  // Noah 19.10.2026 «1a»: Today's «This week» shows the minutes too
  await page.goto('./');
  await expect(page.locator('[data-week-azm]')).toContainText(T('{n} active zone min', { n: '125' }));
  await page.goto('./#/flow');
  await openOverview(page);
  const box = page.locator('[data-section="azm"]');
  await expect(box.locator('[data-azm-sum]')).toContainText('125');
  await expect(box.locator('[data-day]')).toHaveCount(7);
  await expect(box.locator('[data-day="2026-10-05"]')).toContainText('40');
  await expect(box.locator('[data-day="2026-10-06"]')).toContainText('–');
  await expect(box.locator('[data-azm-goal]')).toContainText('150');
  await shot(page, info, 'AZM-woche', '[data-section="azm"]');
  await box.locator('[data-azm-goal]').click();
  const inp = box.locator('input.inp');
  await inp.fill('200');
  await inp.press('Enter');
  await expect(box.locator('[data-azm-goal]')).toContainText('200');
});
