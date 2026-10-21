// AT1 «Abgeschlossene Touren aus Strava» (mockup AT1, Noah 14.10.2026 21:19 «1a 2a 3b 4b at1 freigeben»),
// German UI, phone 390 and desktop 1440, fictional data (sn4plus-fixture.js plus the activities of at1-acts.js):
// a) Touren › Fahrten (Gesamttest 20.10.2026 B3, Noah «3a»; before on Übersicht as «Abgeschlossene Touren») lists every
//    Strava activity of the period, newest first; a ride of a trip with a packing list shows once, with the mark, a
//    multi-day trip is one row; Übersicht keeps «Mit Packliste» (was «Packmodus») and one row «Fahrten aus Strava ›»;
// b) the values Noah named, 1a TSS only with a power meter, 2a the zones as a bar with min and %, 3b a run,
//    a hike and yoga only with the values that fit;
// c) the sport chips and the period; 4b the newest 20, «Mehr laden» shows 20 more;
// d) part 2: «Filter» of the activities (bike, commute, distance, climbing, power meter), «Meine Filter».
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { ftpEstimate, powerLoad } from '../../src/lib/training.js';
import { PAGE } from '../../src/lib/touren/aktivitaeten.js';
import { sn4plusData, P, D0, day } from './sn4plus-fixture.js';
import { at1Acts } from './at1-acts.js';
import { importAndSettle } from './settle.js';
import { openShort } from './kurz-open.js';

const SHOTS = '/tmp/claude-0/sn-shots/at1';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const shot = async (page, info, name, fullPage = true) => {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

const A = 'test_at1_';
const HERBST = `${P}herbst`; // «Herbsttour Hochland», 2 days, rated
const ROAD = 'bike-road';

/** The calendar day after YYYY-MM-DD. */
const nextDay = (iso) => ((d) => (d.setUTCDate(d.getUTCDate() + 1), d.toISOString().slice(0, 10)))(new Date(`${iso}T12:00:00Z`));

/** The SN4 plus data, the fictional activities, two rides on the days of the Herbsttour, a ride counted for the road bike. */
function data({ many = 0 } = {}) {
  const d = sn4plusData();
  const trip = d.tables.trips.find((x) => x.id === HERBST);
  const acts = at1Acts(day, A);
  const ride = (id, date, km) => ({ ...acts[5], id, day: date, time: '09:00', name: `${A} Etappe ${id}`, type: 'Ride', kind: 'bike', km, hm: 700, movingS: 3 * 3600, elapsedS: 4 * 3600, hrAvg: 128, hrMax: 166, wAvg: null });
  acts.push(ride(`${A}h1`, trip.startDate, 61), ride(`${A}h2`, nextDay(trip.startDate), 54));
  for (let i = 0; i < many; i++) acts.push({ ...acts[1], id: `${A}m${i}`, name: `${A} Pendeln ${i}`, day: day(-30 - i) });
  d.tables.activities = acts;
  d.tables.kmBook = [...(d.tables.kmBook ?? []), { id: `${A}kb1`, stravaId: `${A}1`, bikeId: ROAD, date: acts[0].day, km: acts[0].km, kind: 'ride', source: 'strava', state: 'counted', type: 'Ride' }];
  return d;
}

async function start(page, context, info, d = data()) {
  mkdirSync(info.project.outputDir, { recursive: true });
  const file = `${info.project.outputDir}/at1-${info.testId}.json`;
  writeFileSync(file, JSON.stringify(d));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.clock.setFixedTime(new Date(`${D0}T10:00:00+02:00`));
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('dialog', (x) => x.accept());
  await page.goto('./');
  await importAndSettle(page, file);
  await page.goto('./#/trips/rides');
  await openShort(page);
  await expect(page.locator('[data-act-list] [data-act-row]').first()).toBeVisible();
  return { errors, d };
}
const acts = (page) => page.locator('section[data-activities]');
const row = (page, id) => acts(page).locator(`[data-act-row="${id}"]`);
const field = (r, f) => r.locator(`[data-field="${f}"] dd`);

test('a) Touren › Fahrten: every Strava activity, a trip with a packing list is one row with its mark; Übersicht keeps those trips', async ({ page, context }, info) => {
  const { errors } = await start(page, context, info);
  await expect(page.getByRole('heading', { level: 1, name: T('Rides from Strava') })).toBeVisible();
  await expect(page.locator('[data-rides-intro]')).toHaveText(T('Everything you recorded with Strava. Your trips with a packing list are under Overview.'));
  await expect(acts(page).getByRole('heading', { level: 2, name: T('All activities|rides') })).toBeVisible();
  await expect(page.locator('section[data-packmode], [data-packmode-open]')).toHaveCount(0);
  // 12 months: the six recent activities and the Herbsttour (its two rides as one row); the old one is out
  const ids = await acts(page).locator('[data-act-row]').evaluateAll((els) => els.map((e) => e.dataset.actRow));
  expect(ids).toEqual([`a:${A}1`, `a:${A}2`, `a:${A}3`, `a:${A}4`, `a:${A}5`, `t:${HERBST}`, `a:${A}6`]);
  await expect(acts(page).locator('[data-acts-sub]')).toContainText(T('{n} activities', { n: 7 }));
  // the Herbsttour: the trip's name, the mark «Packmodus: …» with its state, the km of both rides
  const herbst = row(page, `t:${HERBST}`);
  await expect(herbst.locator('a.an')).toHaveText('Herbsttour Hochland');
  await expect(herbst.locator(`[data-pm="${HERBST}"]`)).toContainText(T('With packing list: {name}', { name: 'Herbsttour Hochland' }));
  await expect(herbst.locator('.ak')).toContainText('115');
  // the Strava type and the bike the ride ledger counted it for
  const one = row(page, `a:${A}1`);
  await expect(one.locator('[data-type="Ride"]')).toHaveText(T('Strava type «{type}»', { type: 'Ride' }));
  await expect(one.locator(`[data-bike="${ROAD}"]`)).toHaveText('Rennrad Blau');
  await expect(one.locator('a.an')).toHaveAttribute('href', `#/tour/${encodeURIComponent(`a:${A}1`)}`); // Tour-Seite (Noah 19.10.2026 «1a»)
  await noSideways(page);
  await shot(page, info, 'AT1-touren-aktivitaeten');
  // Übersicht: the trips with a packing list, no Strava list, one quiet row to «Fahrten» below them
  await page.goto('./#/trips');
  await openShort(page);
  const pack = page.locator('section[data-packmode]');
  await expect(pack.getByRole('heading', { level: 2, name: T('With packing list|section') })).toBeVisible();
  await expect(acts(page)).toHaveCount(0);
  const toRides = page.locator('a[data-to-rides]');
  await expect(toRides).toContainText(T('Rides from Strava'));
  await expect(toRides).toContainText(T('{n} activities', { n: 9 }));
  expect((await pack.boundingBox()).y).toBeLessThan((await toRides.boundingBox()).y);
  // the row of that trip also names its Strava activities
  const pm = pack.locator('li[data-row]').filter({ has: page.getByRole('link', { name: 'Herbsttour Hochland', exact: true }) });
  if (info.project.name === 'phone') {
    // 0.163.0 «Handy kurz» (2b): on a phone the values are one grey line; the things packed and Strava after a tap
    await expect(pm.locator('[data-pack-line]')).toContainText(T('Weather'));
  } else {
    await expect(pm.locator('[data-strava-of="2"]')).toContainText(T('Strava: {n} activities', { n: 2 }));
    // 19.10.2026 «1a»: each activity of the trip is a link to its page
    await expect(pm.locator('[data-strava-of="2"] a[data-act-link]')).toHaveCount(2);
    // answer 4a (14.10.2026 «1-5a»): the Packmodus row keeps its values (ride time, heart rate, weather …)
    await expect(pm.locator('[data-values] dt', { hasText: T('Weather') })).toBeVisible();
  }
  await noSideways(page);
  await toRides.click();
  await expect(page).toHaveURL(/#\/trips\/rides$/);
  await expect(acts(page).locator('[data-act-row]').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('b) the values: 1a TSS only with a power meter, 2a zones in min and %, 3b only fitting values', async ({ page, context }, info) => {
  const { errors, d } = await start(page, context, info);
  const all = d.tables.activities;
  const pmRide = row(page, `a:${A}1`);
  const ftp = ftpEstimate(all, D0);
  if (info.project.name === 'phone') {
    // 0.163.0 «Handy kurz» (answer 2b): on a phone the values are one grey line, the rest after a tap
    await expect(pmRide.locator('[data-act-line]')).toHaveText(`${T('Duration|act')} 2:30 h · ${T('Elapsed|col')} 00:02:45:00 · ${T('Ø speed')} 25.0 km/h · ${T('Ø HR')} 138 ${T('bpm')} · ${T('Max. HR')} 172 ${T('bpm')} · ${T('TSS')} ${powerLoad(all[0], ftp).load} · ${T('Ø power')} 182 W`);
    await expect(row(page, `a:${A}6`).locator('[data-act-line]')).toContainText(`${T('Ø power')} 150 W`);
    await expect(row(page, `a:${A}5`).locator('[data-act-line]')).toHaveText(`${T('Duration|act')} 1:00 h · ${T('Elapsed|col')} 00:01:00:00 · ${T('Ø HR')} 92 ${T('bpm')} · ${T('Max. HR')} 120 ${T('bpm')}`);
    await expect(page.locator('[data-act-values], [data-act-zones]')).toHaveCount(0);
    await noSideways(page);
    expect(errors).toEqual([]);
    return;
  }
  await expect(field(pmRide, 'tss')).toHaveText(String(powerLoad(all[0], ftp).load));
  await expect(field(pmRide, 'w20')).toHaveText('236 W');
  await expect(field(pmRide, 'wmax')).toHaveText('640 W');
  await expect(field(pmRide, 'hf')).toHaveText(`138 ${T('bpm')}`);
  // 1a: without a power meter «–» for TSS and max. power, Strava's estimated average stays
  const gravel = row(page, `a:${A}6`);
  await expect(field(gravel, 'tss')).toHaveText('–');
  await expect(field(gravel, 'wmax')).toHaveText('–');
  await expect(field(gravel, 'w')).toHaveText('150 W');
  // 2a: the zones as a bar and Z1–Z5 with minutes and percent; without the detail a quiet line
  const z = pmRide.locator('[data-act-zones]');
  await expect(z.locator('.azv li')).toHaveCount(5);
  await expect(z.locator('.azv li').nth(1)).toContainText('1:00 h');
  await expect(z.locator('.azv li').nth(1)).toContainText('40 %');
  await expect(row(page, `a:${A}2`).locator('[data-act-zones]')).toContainText(T('Comes when the activity is opened once.'));
  // 3b: a ride shows all eleven values, a run its own (no power), a hike and yoga fewer
  const fieldsOf = (r) => r.locator('[data-field]').evaluateAll((els) => els.map((e) => e.dataset.field));
  expect(await fieldsOf(pmRide)).toEqual(['dauer', 'verstr', 'tss', 'hf', 'hfmax', 'tf', 'kmh', 'kmhmax', 'w', 'wmax', 'w20']);
  expect(await fieldsOf(row(page, `a:${A}3`))).toEqual(['dauer', 'verstr', 'hf', 'hfmax', 'tf', 'kmh', 'kmhmax']);
  await expect(field(row(page, `a:${A}3`), 'tf')).toHaveText(`168 ${T('steps/min')}`);
  expect(await fieldsOf(row(page, `a:${A}4`))).toEqual(['dauer', 'verstr', 'hf', 'hfmax', 'kmh']);
  expect(await fieldsOf(row(page, `a:${A}5`))).toEqual(['dauer', 'verstr', 'hf', 'hfmax']);
  // «Dauer» explains itself
  const q = pmRide.getByRole('button', { name: T('Explain: {what}', { what: T('Duration|act') }) });
  await q.click();
  await expect(pmRide.getByRole('note')).toBeVisible();
  await q.click();
  await noSideways(page);
  expect(errors).toEqual([]);
});

test('c) sport chips and period; 4b: the newest 20, «Mehr laden» shows more', async ({ page, context }, info) => {
  const { errors } = await start(page, context, info, data({ many: 25 }));
  const list = acts(page).locator('[data-act-row]');
  await expect(list).toHaveCount(PAGE);
  const more = acts(page).locator('[data-load-more]');
  await expect(more).toContainText(T('Load more'));
  await more.click();
  // 7 rows, 25 commutes more; three of them ride on the days of the «Drei-Täler-Loop» and join its one row
  await expect(list).toHaveCount(30);
  await expect(acts(page).locator(`[data-act-row="t:${P}loop"]`)).toHaveCount(1);
  await expect(more).toHaveCount(0);
  // the sport chips: a tap shows only that sport, «Alle» all again
  await acts(page).locator('button[data-kind="run"]').click();
  await expect(list).toHaveCount(1);
  await expect(list.first()).toHaveAttribute('data-act-row', `a:${A}3`);
  await acts(page).locator('button[data-kind="all"]').click();
  // «Alle» as period also shows the old activity
  await acts(page).locator('.tools').getByRole('button', { name: T('All|period'), exact: true }).click();
  await expect(acts(page).locator(`[data-act-row="a:${A}7"]`)).toHaveCount(0); // still behind «Mehr laden»
  while (await more.count()) await more.click();
  await expect(acts(page).locator(`[data-act-row="a:${A}7"]`)).toBeVisible();
  await noSideways(page);
  await shot(page, info, 'AT1-touren-mehr');
  expect(errors).toEqual([]);
});

test('d) part 2 «Filter»: commute, power meter, the chips to tap away, a saved filter under «Meine Filter»', async ({ page, context }, info) => {
  const { errors } = await start(page, context, info);
  const list = acts(page).locator('[data-act-row]');
  await expect(list).toHaveCount(7);
  const open = acts(page).locator('[data-act-filter-open]');
  const sheet = page.locator('dialog[data-act-filter-sheet]');
  // «Ohne Arbeitsweg»: the number on the button before it is applied, then one chip
  await open.click();
  await expect(sheet).toBeVisible();
  await sheet.locator('[data-fs="AF2"] button[data-key="without"]').click();
  await expect(sheet.locator('[data-apply]')).toHaveText(T('Show {n} activities', { n: 6 }));
  await shot(page, info, 'AT1-filter', false);
  // save it under a name, then apply
  await sheet.locator('[data-save-name]').fill('Ohne Arbeitsweg');
  await sheet.locator('[data-save]').click();
  await expect(sheet.locator('.saved li')).toHaveText(['Ohne Arbeitsweg']);
  await sheet.locator('[data-apply]').click();
  await expect(sheet).toHaveCount(0);
  await expect(list).toHaveCount(6);
  await expect(acts(page).locator(`[data-act-row="a:${A}2"]`)).toHaveCount(0);
  await expect(acts(page).locator('[data-act-filter-n]')).toHaveText('1');
  const chip = acts(page).locator('[data-act-active-filters] [data-chip="commute"]');
  await expect(chip).toHaveText(T('Without commute'));
  const mine = acts(page).locator('[data-act-my-filters] [data-saved="Ohne Arbeitsweg"]');
  await expect(mine).toHaveAttribute('aria-pressed', 'true');
  await noSideways(page);
  await shot(page, info, 'AT1-filter-aktiv');
  // a tap on the chip takes it away; the saved filter stays after a reload and sets it again with one tap
  await chip.click();
  await expect(list).toHaveCount(7);
  await page.reload();
  await openShort(page);
  await expect(mine).toHaveAttribute('aria-pressed', 'false');
  await mine.click();
  await expect(list).toHaveCount(6);
  await acts(page).locator('[data-act-active-filters] [data-clear-filters]').click();
  await expect(list).toHaveCount(7);
  // only with a power meter: the one ride with watts
  await open.click();
  await sheet.locator('[data-watts]').check();
  await expect(sheet.locator('[data-apply]')).toHaveText(T('Show {n} activity', { n: 1 }));
  await sheet.locator('[data-apply]').click();
  await expect(list).toHaveCount(1);
  await expect(list.first()).toHaveAttribute('data-act-row', `a:${A}1`);
  // the trips with a packing list and their own filters are on Übersicht, not here (Gesamttest 20.10.2026 B3)
  await expect(page.locator('section[data-packmode] [data-active-filters]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('e) bug fix 19.10.2026: a tap anywhere on an activity row opens it, not only on its name', async ({ page, context }, info) => {
  const { errors } = await start(page, context, info);
  const r = acts(page).locator('[data-act-row]').first();
  const href = await r.locator('a').first().getAttribute('href');
  await r.scrollIntoViewIfNeeded();
  const b = await r.boundingBox();
  await page.mouse.click(b.x + b.width - 30, b.y + b.height / 2); // the chevron side, away from the name
  await expect(page).toHaveURL(new RegExp(`${href.replace(/[/?]/g, '\\$&')}$`));
  expect(errors).toEqual([]);
});
