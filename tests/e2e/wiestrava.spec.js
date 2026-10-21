// «Wie Strava» (Noah 21.10.2026: «diese übersicht und peak power und der karte mit linie der tour … beide
// übersichten 1:1 übernehmen», «verstrichene Zeit … hh:mm:ss» then «dd:hh:mm:ss», «2 leere Kacheln», «fehlen
// werte für stimmung und energie», «herzfrequenzbereiche in verschiedenen farben»). German UI, phone 390 and
// desktop 1440, fictional data (sn4plus-fixture.js plus at1-acts.js, clock Friday 9 October 2026): a made-up
// trip two days ago ridden with Strava only (two rides, no GPX upload), with Fitbit days around it.
// a) the Rückblick: the tiles have the numbers of the Strava rides; «Übersicht wie Strava» per ride with Peak
//    Power, the elapsed time as dd:hh:mm:ss, «Mehr anzeigen», the weather at the start and the map; the pauses
//    as dd:hh:mm:ss; the heart rate zones in colours;
// b) mood and energy: added afterwards, shown, Undo takes them back; the Fitbit values around the trip;
// c) Rückblick › «Letzte Fahrt» has its numbers too;
// d) Lieferung 2: the Zeitleiste from the Strava rides (pause with km, best time, climb, photo); the weather from
//    the rides' starts, the same on the tour page and in the Rückblick (Strava check #8).
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { sn4plusData, P, D0, day } from './sn4plus-fixture.js';
import { at1Acts } from './at1-acts.js';
import { importAndSettle } from './settle.js';
import { actRecord } from '../../src/lib/training.js';
import { encodePolyline } from '../../src/lib/spur/polyline.js';

/** A made-up line from the home point (47.30, 8.50). */
const lineOf = (n) => encodePolyline(Array.from({ length: n }, (_, i) => [47.3 + i * 0.002, 8.5 + i * 0.003]));

const SHOTS = '/tmp/claude-0/sn-shots/wiestrava';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const A = 'test_ws_';
const TRIP = `${P}ws-strava`;

function data() {
  const d = sn4plusData();
  const T0 = d.tables;
  const herbst = T0.trips.find((x) => x.id === `${P}herbst`);
  T0.trips.push({ ...herbst, id: TRIP, title: 'Feierabend mit Strava', startDate: day(-2), days: 1, status: 'done', route: null, templateId: null });
  const deb = T0.debriefs.find((x) => x.tripId === herbst.id);
  T0.debriefs.push({ ...deb, id: `${TRIP}-deb`, tripId: TRIP, status: 'done', km: null, doneAt: `${day(-1)}T18:00:00.000Z` });
  const acts = at1Acts(day, A);
  acts[0] = { ...acts[0], pauses: { n: 4, secs: 900 }, pCurve: [[5, 820], [15, 690], [30, 560], [60, 430], [120, 372], [300, 318], [600, 284], [1200, 236]], effort: 142, kj: 2350, line: lineOf(20), wxRide: { v: 1, t: 17, feel: 16, hum: 66, wind: 6.8, dir: 25, code: 3 } };
  // Lieferung 2: the Zeitleiste from Strava (a pause of 5 min and more, a best time, a climb, a photo)
  Object.assign(acts[0], {
    pauses: { ...acts[0].pauses, list: [{ t: 3600, at: null, km: 30.2, min: 6 }] },
    segs: [{ name: `${A}Seestrasse`, from: 12.4, t: 1500, s: 412, pr: 1 }],
    climbs: [{ name: `${A}Huegel`, from: 40.1, t: 6000, s: 600, km: 2.1, grade: 5, hm: 110 }],
    photos: [{ url: 'https://example.invalid/test_ws_photo.jpg', caption: `${A}Aussicht`, t: 4000, km: 33 }],
  });
  acts.push({ ...actRecord({ id: `${A}mtb`, startLocal: `${day(-2)}T16:05:00`, name: `${A} Mountainbike am Nachmittag`, type: 'MountainBikeRide', km: 5.55, hm: 41, movingS: 1179, elapsedS: 1605, hrAvg: 114, hrMax: 172, spdAvg: 17, spdMax: 35.6 }), pauses: { n: 2, secs: 426 }, line: lineOf(8), pCurve: [[5, 578], [15, 349], [600, 102], [1200, 90]], wxRide: { v: 1, t: 9, feel: 8, hum: 80, wind: 4.2, dir: 200, code: 2 } });
  T0.activities = acts;
  T0.healthDays = Array.from({ length: 40 }, (_, i) => day(-36 + i)).filter((x) => x <= D0).map((date, i) => ({ date, restingHr: 50 + (i % 3), sleep: { asleepMin: 420 + (i % 2) * 30 }, src: 'test' }));
  return d;
}

async function start(page, context, info) {
  mkdirSync(info.project.outputDir, { recursive: true });
  const file = `${info.project.outputDir}/ws-${info.testId}.json`;
  writeFileSync(file, JSON.stringify(data()));
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
const shot = async (loc, info, name) => {
  mkdirSync(SHOTS, { recursive: true });
  await loc.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

test('a) Rückblick: tiles from Strava, the overview like Strava with Peak Power, weather, map and dd:hh:mm:ss', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/debrief/${TRIP}`);
  const tiles = page.locator('section.ride .rv-tiles').first();
  await expect(tiles).toContainText('68 km');
  await expect(tiles).not.toContainText('–');
  const ro = page.locator('[data-ride-overview]');
  await ro.scrollIntoViewIfNeeded();
  await expect(ro.getByRole('heading', { name: T('Overview like Strava') })).toBeVisible();
  await expect(ro.locator('[data-ro-pick]')).toHaveCount(2);
  // the first ride: Peak Power 5 s first, the elapsed time with days and hours, the weather at the start
  await expect(ro.locator('[data-ana-peak] th').first()).toHaveText('5 s');
  await expect(ro.locator('[data-ana-peak] td').first()).toContainText('820');
  await expect(ro.locator('[data-elapsed]')).toHaveText('00:02:45:00');
  await expect(ro.locator('[data-ride-wx]')).toContainText(T('Cloudy|sky'));
  await expect(ro.locator('[data-ride-wx]')).toContainText(T('NNE|wind'));
  await expect(ro.locator('[data-ro-map]')).toHaveCount(1);
  // «Mehr anzeigen»: heart rate and more under speed
  await expect(ro.locator('[data-am="hr"]')).toHaveCount(0);
  await ro.locator('[data-am-more]').click();
  await expect(ro.locator('[data-am="hr"]')).toBeVisible();
  await shot(ro, info, 'W1-uebersicht');
  // the afternoon ride: as on Strava, 0:26:45 elapsed, Peak Power only up to 10 minutes (19:39 moving)
  await ro.locator(`[data-ro-pick="${A}mtb"]`).click();
  await expect(ro.locator('[data-elapsed]')).toHaveText('00:00:26:45');
  await expect(ro.locator('[data-ana-peak] tr')).toHaveCount(3);
  await expect(ro.locator('[data-ana-peak] th').last()).toHaveText(T('{n} min|peak', { n: 10 }));
  // «Körper und Leistung»: the pauses of both rides as dd:hh:mm:ss
  const body = page.locator('[data-group="body"] .gb');
  if ((await body.getAttribute('aria-expanded')) !== 'true') await body.click();
  await expect(page.locator('[data-heart-power] [data-pause-time]')).toHaveText('6 · 00:00:22:06');
  // the heart rate zones in colours, not grey: each part of the bar has the colour of its zone (app.css --z1…--z5)
  const bar = page.locator('[data-heart-power] .zbar').first();
  await bar.scrollIntoViewIfNeeded();
  const parts = await bar.evaluate((el) => {
    const probe = document.createElement('i');
    document.body.append(probe);
    const out = [...el.children].map((x) => {
      const z = /zc-(\d)/.exec(x.className)[1];
      probe.style.background = `var(--z${z})`;
      return { z, bg: getComputedStyle(x).backgroundColor, want: getComputedStyle(probe).backgroundColor };
    });
    probe.remove();
    return out;
  });
  expect(parts.length).toBeGreaterThan(1);
  for (const p of parts) expect(p.bg, `Z${p.z}`).toBe(p.want);
  expect(new Set(parts.map((p) => p.bg)).size).toBe(parts.length);
  await noSideways(page);
  expect(errors).toEqual([]);
});

test('b) mood and energy added afterwards with Undo; the Fitbit values around the trip', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/debrief/${TRIP}`);
  const body = page.locator('[data-group="body"] .gb');
  if ((await body.getAttribute('aria-expanded')) !== 'true') await body.click();
  const mood = page.locator('[data-mood]');
  await mood.scrollIntoViewIfNeeded();
  await expect(mood.locator('[data-quiet="mood"]')).toBeVisible();
  // Fitbit: the night before with the resting heart rate and «dein Normal», the 2 days after
  const fit = page.locator('[data-fitbit-trip]');
  await expect(fit.locator('[data-fitbit-before]')).toContainText(T('Night before'));
  await expect(fit.locator('[data-fitbit-before]')).toContainText(T('resting heart rate {n}', { n: '' }).trim());
  await expect(fit.locator('[data-fitbit-after]')).toHaveCount(2);
  await mood.locator('[data-mood-add]').click();
  await mood.locator(`[data-mood-sel="${day(-2)}"]`).selectOption('7');
  await mood.locator(`[data-energy-sel="${day(-2)}"]`).selectOption('6');
  await mood.locator('[data-mood-save]').click();
  await expect(mood.locator('.rv-row.mood')).toHaveCount(1);
  await expect(mood.locator('[data-quiet="mood"]')).toHaveCount(0);
  await shot(page.locator('[data-mood]'), info, 'W2-stimmung');
  await page.getByRole('button', { name: DE['Undo'] ?? 'Rückgängig' }).first().click();
  await expect(mood.locator('[data-quiet="mood"]')).toBeVisible();
  await noSideways(page);
  expect(errors).toEqual([]);
});

test('c) Rückblick › «Letzte Fahrt» has the numbers of the Strava rides', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/debrief');
  // on a phone «Letzte Fahrt» is a fold: open it
  // wait until the page has drawn «Letzte Fahrt» (a fold on a phone, a heading on a computer) before deciding
  await expect(page.getByRole('heading', { name: new RegExp(`^${T('Last ride')}`) }).first()).toBeVisible();
  const fold = page.getByRole('button', { name: new RegExp(`^${T('Last ride')}`) });
  if ((await fold.count()) && (await fold.first().getAttribute('aria-expanded')) === 'false') await fold.first().click();
  const last = page.locator('.lastride');
  await last.scrollIntoViewIfNeeded();
  if ((await last.locator('[aria-expanded="false"]').count()) > 0) await last.locator('.fold-btn').click();
  await expect(last.locator('.rv-tiles')).toContainText('68 km');
  await expect(last.locator('.rv-tiles')).not.toContainText('–');
  expect(errors).toEqual([]);
});

test('d) Zeitleiste from Strava and one weather on both pages', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/debrief/${TRIP}`);
  const tl = page.locator('[data-timeline]');
  await tl.scrollIntoViewIfNeeded();
  await expect(tl.locator('.tle.pause')).toHaveCount(1);
  await expect(tl.locator('.tle.pause')).toContainText('km 30');
  await expect(tl.locator('[data-tl-best]')).toHaveText(T('Best time|timeline'));
  await expect(tl.locator('.tle.best')).toContainText(`${A}Seestrasse`);
  await expect(tl.locator('[data-tl-climb]')).toHaveText(T('Climb|timeline'));
  await expect(tl.locator('.tle.climb')).toContainText('110 Hm');
  await expect(tl.locator('[data-tl-photo] img')).toHaveAttribute('alt', `${A}Aussicht`);
  // the weather of the rides' starts: 9–17 °C, wind 4–7 km/h
  const facts = page.locator('ul.facts').first();
  await expect(facts).toContainText(T('at the start|weather'));
  await expect(facts.locator('[data-ride-wind]')).toHaveText(T('wind {kmh} km/h', { kmh: '4–7' }));
  await shot(tl, info, 'W4-zeitleiste');
  await page.goto(`./#/tour/${encodeURIComponent(`t:${TRIP}`)}`);
  await expect(page.locator('[data-tour-weather]').first()).toContainText(T('at the start|weather'));
  await expect(page.locator('[data-tour-weather]').first()).toContainText(T('wind {kmh} km/h', { kmh: '4–7' }));
  await noSideways(page);
  expect(errors).toEqual([]);
});
