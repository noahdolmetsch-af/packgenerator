// «Tour-Auswertung» (Noah 20.10.2026 «3a und b»): on the tour page under «Werte» what the Garmin shows,
// German UI, phone 390 and desktop 1440, fictional data (sn4plus-fixture.js plus at1-acts.js):
// a) a ride with a power meter: stops, NP, the best 1, 2, 5, 10 and 20 minutes of power and heart rate,
//    the resting heart rate of that day next to «your normal», every ride as a dot with the connection;
// b) a ride without a power meter and without Fitbit days: no power row, the hint where the resting heart rate comes from;
// c) like komoot: the profile by gradient and the speed profile;
// d) like Strava (Noah «baue es 1:1 nach»): the head, Peak Power, the views Analyse, Relative Leistung, Herzfrequenz,
//    Leistungskurve, Zonenverteilung, 25 W and Runden.
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { sn4plusData, D0, day } from './sn4plus-fixture.js';
import { at1Acts } from './at1-acts.js';
import { importAndSettle } from './settle.js';
import { expectRound } from './roundaxis.js';
import { trimCourse, trimMore, trimPower } from '../../api/strava.js';
import { DETAIL_V } from '../../src/lib/training.js';
// the spans from the app source (tourana.js pulls in Svelte runes, so it is read as text)
const ANA_SPANS = [...readFileSync(new URL('../../src/lib/touren/tourana.js', import.meta.url), 'utf8').match(/ANA_SPANS = \[([\s\S]*?)\];/)[1].matchAll(/\[(\d+), (\d+)\]/g)];

const SHOTS = '/tmp/claude-0/sn-shots/tourauswertung';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const A = 'test_ana_';
const key = (k) => `#/tour/${encodeURIComponent(k)}`;

/** A made-up mountain ride: 62 km, flat, a long climb from km 18 to 32, down, a flat end; a stop on top. */
function mountain() {
  const time = [];
  const distance = [];
  const altitude = [];
  let t = 0;
  for (let m = 0; m <= 62300; m += 40) {
    const k = m / 1000;
    const h = k < 18 ? 420 + Math.sin(k) * 15 + k * 2 : k < 32 ? 456 + (k - 18) * 78 + Math.sin(k * 3) * 25 : k < 45 ? 1548 - (k - 32) * 60 + Math.sin(k * 2) * 20 : k < 52 ? 770 - (k - 45) * 45 : 455 - (k - 52) * 2;
    const v = k < 18 ? 24 : k < 32 ? 9 + Math.sin(k * 5) * 2 : k < 45 ? 34 + Math.sin(k * 4) * 8 : 26;
    time.push(Math.round(t));
    distance.push(m);
    altitude.push(Math.round(h * 10) / 10);
    t += 40 / (v / 3.6);
    if (m === 32000) t += 1200;
  }
  // power, heart rate, cadence and temperature along the way: harder up the climb
  const up = (i) => distance[i] >= 18000 && distance[i] < 32000;
  const watts = time.map((_, i) => (up(i) ? 260 + (i % 7) * 6 : 170 + (i % 5) * 8));
  const heartrate = time.map((_, i) => (up(i) ? 158 + (i % 4) : 132 + (i % 3)));
  const cadence = time.map((_, i) => (up(i) ? 78 : 90));
  const temp = time.map((_, i) => Math.round(14 + (altitude[i] < 1000 ? 4 : 0)));
  const st = { time: { data: time }, distance: { data: distance }, altitude: { data: altitude }, watts: { data: watts }, heartrate: { data: heartrate }, cadence: { data: cadence }, temp: { data: temp } };
  return { ...trimCourse(st), prof: trimMore(st).prof, p25: trimPower(time, watts).p25 };
}

function data({ health = true } = {}) {
  const d = sn4plusData();
  const acts = at1Acts(day, A);
  acts[0] = {
    ...acts[0],
    pauses: { n: 4, secs: 900 },
    hCurve: [[60, 171], [120, 168], [300, 163], [600, 158], [1200, 154]],
    ...mountain(),
    pCurve: [[5, 820], [15, 690], [30, 560], [60, 430], [120, 372], [300, 318], [600, 284], [1200, 236], [1800, 228], [3600, 210]],
    pHist: { 160: 1200, 170: 2400, 180: 1800, 200: 600, 260: 1500, 280: 900, 300: 300 },
    effort: 142,
    kj: 2350,
    laps: [
      { n: 1, name: 'Lap 1', km: 18, s: 2700, el: 2760, hm: 40, hr: 133, w: 182, kmh: 24 },
      { n: 2, name: 'Lap 2', km: 14, s: 5600, el: 6800, hm: 1100, hr: 159, w: 276, kmh: 9 },
      { n: 3, name: 'Lap 3', km: 30.3, s: 3600, el: 3700, hm: 30, hr: 134, w: 150, kmh: 30.3 },
    ],
    detail: new Date().toISOString(),
    dv: DETAIL_V,
  };
  // every ride with a power meter gets a different NP, so the dots show a connection
  acts.forEach((a, i) => {
    if (i && a.wDevice) acts[i] = { ...a, wNorm: 190 + i * 4 };
  });
  d.tables.activities = acts;
  if (health) {
    const days = Array.from({ length: 70 }, (_, i) => day(-69 + i));
    d.tables.healthDays = days.map((date, i) => ({ date, restingHr: 50 + (i % 4), src: 'test' }));
  }
  return d;
}

async function start(page, context, info, opts) {
  mkdirSync(info.project.outputDir, { recursive: true });
  const file = `${info.project.outputDir}/ana-${info.testId}.json`;
  writeFileSync(file, JSON.stringify(data(opts)));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.clock.setFixedTime(new Date(`${D0}T10:00:00+02:00`));
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./');
  await importAndSettle(page, file);
  return errors;
}

test('a) a ride with a power meter: stops, NP, best minutes, resting heart rate, dots', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./${key(`a:${A}1`)}`);
  const ana = page.locator('[data-tour-part="values"] [data-tour-analysis]');
  await ana.scrollIntoViewIfNeeded();
  await expect(ana.getByRole('heading', { name: T('Like on the Garmin') })).toBeVisible();
  await expect(ana.locator('[data-ana="stops"] dd')).toContainText(T('{n} stops', { n: 4 }));
  await expect(ana.locator('[data-ana="np"] dd')).toContainText('205');
  // the columns come from the app's list of spans
  await expect(ana.locator('[data-ana-best] thead th')).toHaveCount(ANA_SPANS.length + 1);
  await expect(ana.locator('[data-best="power"] td')).toHaveText(['430', '372', '318', '284', '236']);
  await expect(ana.locator('[data-best="hr"] td')).toHaveText(['171', '168', '163', '158', '154']);
  await expect(ana.locator('[data-ana-missing]')).toHaveCount(0);
  await expect(ana.locator('[data-ana-rest] li')).toHaveCount(1);
  await expect(ana.locator('[data-ana-normal]')).toBeVisible();
  await expect(ana.locator('[data-ana-dots] circle.me')).toHaveCount(1);
  // «Genaue Werte» (27.10.2026): both axes of the dots in round steps, a grid line at every step up
  const yt = await ana.locator('[data-ana-dots] [data-yticks] span').allTextContents();
  expectRound(yt);
  expectRound(await ana.locator('[data-ana-xt]').allTextContents());
  await expect(ana.locator('[data-ana-dots] [data-grid] line')).toHaveCount(yt.length);
  await expect(ana.locator('[data-ana-corr]')).not.toBeEmpty();
  // the 20 minutes are no longer twice on the page
  await expect(page.locator('[data-tour-values] [data-field="w20"]')).toHaveCount(0);
  mkdirSync(SHOTS, { recursive: true });
  await ana.screenshot({ path: `${SHOTS}/A1-werte-${info.project.name === 'phone' ? 390 : 1440}.png` });
  // «Diagramme zum Antippen» (27.10.2026): the line over the dots names this tour; few dots carry their number;
  // a tap on another dot opens a window with its numbers and the way to that ride; «Als Tabelle» the same as rows
  const dots = ana.locator('[data-ana-dots]');
  await expect(dots.locator('[data-readout]')).toContainText(T('this tour'));
  const nDots = await dots.locator('circle').count();
  await expect(dots.locator('[data-ana-lab]')).toHaveCount(nDots);
  await dots.locator('circle:not(.me)').first().click();
  const sheet = page.locator('[data-chart-sheet]');
  await expect(sheet.locator('[data-ana-sheet] dd')).toHaveCount(2);
  await expect(sheet.locator('[data-ana-open]')).toHaveAttribute('href', /#\/tour\//);
  await sheet.screenshot({ path: `${SHOTS}/A2-punkt-${info.project.name === 'phone' ? 390 : 1440}.png` });
  await sheet.getByRole('button', { name: T('Close') }).click();
  await expect(sheet).toHaveCount(0);
  await dots.getByText(T('As table'), { exact: true }).click();
  await expect(dots.locator('[data-chart-table] tbody tr')).toHaveCount(nDots);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});

test('b) without Fitbit days: the hint where the resting heart rate comes from', async ({ page, context }, info) => {
  const errors = await start(page, context, info, { health: false });
  await page.goto(`./${key(`a:${A}1`)}`);
  const ana = page.locator('[data-tour-part="values"] [data-tour-analysis]');
  await ana.scrollIntoViewIfNeeded();
  await expect(ana.locator('[data-ana-norest]')).toHaveText(T('No resting heart rate for these days. It comes from Fitbit: Ich › Verbindungen.'));
  await expect(ana.locator('[data-ana-dots]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('c) like komoot: the profile by gradient with ascent, descent, highest and lowest point, the speed profile', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./${key(`a:${A}1`)}`);
  const course = page.locator('[data-tour-part="overview"] [data-tour-course="ride"]');
  await course.scrollIntoViewIfNeeded();
  await expect(course.getByRole('heading', { name: T('Elevation profile') })).toBeVisible();
  await expect(course.locator('[data-tour-course-sum] dt')).toHaveText([T('Ascent'), T('Descent'), T('Highest point'), T('Lowest point')]);
  await expect(course.locator('[data-tour-course-sum] dd').nth(2)).toContainText(/1[.’']?5\d\d m/);
  const speed = page.locator('[data-tour-part="overview"] [data-tour-speed]');
  await expect(speed.getByRole('heading', { name: T('Speed profile') })).toBeVisible();
  // «Genaue Werte» (27.10.2026): km/h in round steps from 0 with a grid line at each, the unit at the top
  const ys = await speed.locator('[data-yticks] span').allTextContents();
  expectRound(ys, { zero: true });
  expect(ys.at(-1)).toContain('km/h');
  await expect(speed.locator('[data-grid] line')).toHaveCount(ys.length);
  // drag over the speed profile: the numbers of that stretch
  await speed.locator('svg').scrollIntoViewIfNeeded();
  const box = await speed.locator('svg').boundingBox();
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();
  await expect(speed.locator('.tc-hint')).toContainText('km/h');
  mkdirSync(SHOTS, { recursive: true });
  const w = info.project.name === 'phone' ? 390 : 1440;
  await course.screenshot({ path: `${SHOTS}/C1-hoehenprofil-${w}.png` });
  await speed.screenshot({ path: `${SHOTS}/C2-tempo-${w}.png` });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});

test('d) like Strava: head, Peak Power and the views of the analysis', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./${key(`a:${A}1`)}`);
  const sa = page.locator('[data-tour-part="analysis"] [data-strava-analysis]');
  await sa.scrollIntoViewIfNeeded();
  await expect(page.locator('[data-tour-part="analysis"]').getByRole('heading', { name: T('Analysis|ana'), exact: true })).toBeVisible();
  await expect(sa.locator('[data-ana-avgmax] tbody th').first()).toHaveText(T('Speed|ana'));
  // Peak Power: the rows from the curve, 5 s first
  await expect(sa.locator('[data-ana-peak] th').first()).toHaveText('5 s');
  await expect(sa.locator('[data-ana-peak] td').first()).toContainText('820');
  const w = info.project.name === 'phone' ? 390 : 1440;
  mkdirSync(SHOTS, { recursive: true });
  await sa.locator('.head').screenshot({ path: `${SHOTS}/D0-kopf-${w}.png` });
  // Analyse: the profile, the Sauce row, the curves; drag for a stretch
  const show = sa.locator('[data-ana-show]');
  await expect(show).toHaveAttribute('data-ana-show', 'analysis');
  await expect(show.locator('[data-ana-curve]')).toHaveCount(5);
  const prof = show.locator('[data-ana-profile]');
  await prof.scrollIntoViewIfNeeded();
  const box = await prof.boundingBox();
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height / 2, { steps: 6 });
  await page.mouse.up();
  await expect(show.locator('[data-ana-pick]')).toContainText(T('Selection'));
  await expect(show.locator('[data-ana-sauce]')).toContainText('W');
  await show.screenshot({ path: `${SHOTS}/D1-analyse-${w}.png` });
  // each view
  for (const [view, sel, shot] of [
    ['effort', '[data-ana-weeks]', 'D2-relative-leistung'],
    ['hr', '[data-ana-hrzones] tr', 'D3-herzfrequenz'],
    ['curve', '[data-ana-curvechart]', 'D4-leistungskurve'],
    ['zones', '[data-ana-pzones] tr', 'D5-zonen'],
    ['dist', '[data-ana-dist]', 'D6-25w'],
    ['laps', '[data-ana-laps] tbody tr', 'D7-runden'],
  ]) {
    await sa.locator(`[data-ana-view="${view}"]`).click();
    await expect(show).toHaveAttribute('data-ana-show', view);
    await expect(show.locator(sel).first()).toBeVisible();
    await show.screenshot({ path: `${SHOTS}/${shot}-${w}.png` });
  }
  await expect(show.locator('[data-ana-laps] tbody tr')).toHaveCount(3);
  await sa.locator('[data-ana-view="hr"]').click();
  await expect(show.locator('[data-ana-hrzones] tr')).toHaveCount(5);
  await sa.locator('[data-ana-view="zones"]').click();
  await expect(show.locator('[data-ana-pzones] tr')).toHaveCount(7);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});

test('e) like Garmin Connect: Statistiken in groups, Diagramme with Ø and Max, laps with a total', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./${key(`a:${A}1`)}`);
  const sa = page.locator('[data-tour-part="analysis"] [data-strava-analysis]');
  await sa.scrollIntoViewIfNeeded();
  const show = sa.locator('[data-ana-show]');
  const w = info.project.name === 'phone' ? 390 : 1440;
  mkdirSync(SHOTS, { recursive: true });
  // Statistiken: the groups of Garmin, empty values left out
  await sa.locator('[data-ana-view="stats"]').click();
  const stats = show.locator('[data-garmin-stats]');
  await expect(stats.locator('[data-gs="speed"] h4')).toHaveText(T('Speed|gc'));
  await expect(stats.locator('[data-gs-row="np"] dd')).toContainText('205');
  await expect(stats.locator('[data-gs-row="down"]')).toBeVisible();
  await expect(stats.locator('[data-gs-row="turns"]')).toBeVisible();
  await expect(stats.locator('dd', { hasText: /^–$/ })).toHaveCount(0);
  await show.screenshot({ path: `${SHOTS}/E1-statistiken-${w}.png` });
  // Diagramme: one chart per sensor, then height with the heart rate zones; tap shows the value
  await sa.locator('[data-ana-view="charts"]').click();
  const charts = show.locator('[data-garmin-charts]');
  await expect(charts.locator('[data-garmin-chart]')).toHaveCount(7);
  await expect(charts.locator('[data-garmin-chart="alt"] .gc-head dt')).toHaveText([T('Minimum'), T('Maximum')]);
  const box = charts.locator('[data-garmin-chart="spd"] .gc-box');
  await box.scrollIntoViewIfNeeded();
  const b = await box.boundingBox();
  await page.mouse.click(b.x + b.width * 0.4, b.y + b.height / 2);
  await expect(charts.locator('[data-garmin-chart="spd"] [data-garmin-tip]')).toContainText('km/h');
  await charts.locator('.seg button[data-key="time"]').click();
  await expect(charts.locator('.gc-unit').first()).toHaveText(T('Time (h:mm)'));
  await show.screenshot({ path: `${SHOTS}/E2-diagramme-${w}.png` });
  await charts.locator('[data-garmin-chart="althr"]').screenshot({ path: `${SHOTS}/E3-hoehe-puls-${w}.png` });
  // Runden with the row «Gesamt»
  await sa.locator('[data-ana-view="laps"]').click();
  await expect(show.locator('[data-ana-laps-total] th')).toHaveText(T('Total|laps'));
  await expect(show.locator('[data-ana-laps-total] td').first()).toContainText('62.30');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});
