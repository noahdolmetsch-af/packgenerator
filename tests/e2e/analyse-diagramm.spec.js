// «Eigenes Diagramm» (Noah 27.10.2026 «1a 2a 3a und b möglich 4a 5a», mockups D1, D2, D3, D6): at the top of
// Analyse, up to 6 values from every area on one time axis, under each other or on top of each other; a tap
// on a day shows that day with every value; values are added with search, removed, reordered. German, phone
// + desktop, fictional Fitbit days, Strava rides, ticks, «Wi gaht's?» and one trip written straight into
// IndexedDB. The clock stands on Friday 9 October 2026 (aktiv-fixture.js). Fictional data only.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';
import { DEFAULT_KEYS } from '../../src/lib/analyse/diagram.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const P = 'test_data_dg_';

function rows() {
  const healthDays = [];
  for (let i = 0; i < 95; i++) {
    const date = addDays(TODAY, -i);
    healthDays.push({ date, azm: 15 + (i % 6) * 8, restingHr: 49 + (i % 4), hrvMs: 50 + (i % 7), steps: 6000 + (i % 5) * 1500, sleep: { asleepMin: 380 + (i % 7) * 15, deepMin: 70, remMin: 85, lightMin: 220, awakeMin: 20, start: '23:20', end: '06:50', efficiency: 90 + (i % 5) }, spo2: 95 + (i % 3), breath: 14, kcal: 2200 + (i % 9) * 40, kcalActive: 550, hrMax: 140 + (i % 9), src: 'google', at: `${date}T08:00:00Z` });
  }
  const act = (id, day, km) => ({
    id: `${P}${id}`, day, time: '17:10', start: `${day}T15:10:00Z`, name: `${P}${id}`, type: 'Ride', kind: 'bike', km, hm: 300, movingS: 4800, elapsedS: 5100, gearId: null,
    hrAvg: 132, hrMax: 160, commute: false, trainer: false, wAvg: null, wMax: null, wDevice: false, spdAvg: null, spdMax: null, cad: 85, tempAvg: 12, wNorm: null, kj: null, effort: 60, line: null, workout: null, prs: 0, achv: 0, elevHigh: null, elevLow: null, kcal: 800,
  });
  const activities = [];
  for (let i = 1; i < 90; i += 3) activities.push(act(`r${i}`, addDays(TODAY, -i), 25 + (i % 5) * 6));
  const flowLog = [];
  const tick = (actId, i, extra = {}) => flowLog.push({ id: `${P}${actId}_${i}`, actId, day: addDays(TODAY, -i), at: `${addDays(TODAY, -i)}T18:00:00+02:00`, ...extra });
  for (let i = 0; i < 60; i++) {
    if (i % 4 === 1) tick('sauna', i, { min: 30 });
    if (i % 5 === 2) tick('gym', i, { min: 60 });
    if (i % 7 === 3) tick('hockey', i, { min: 75 });
    if (i % 9 === 4) tick('tennis', i, { min: 90 });
    if (i % 2 === 0) tick('meditation', i, { min: 15 });
  }
  const flowChecks = [];
  for (let i = 0; i < 90; i++) flowChecks.push({ day: addDays(TODAY, -i), sleep: 6 + (i % 4), energy: 5 + (i % 5), mood: 6 + (i % 3) });
  const trips = [{ id: `${P}trip`, name: 'Probefahrt Jura', domain: 'bike', status: 'done', startDate: addDays(TODAY, -30), days: 4 }];
  return { healthDays, activities, flowLog, flowChecks, trips };
}

async function open(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow'); // seeds the activities of the small start (Eishockey, Sauna, Gym …)
  await ready(page);
  await expect(page.locator('[data-act]').first()).toBeVisible();
  await put(page, rows());
  return errors;
}
async function go(page, hash) {
  await page.goto(`./${hash}`);
  await page.reload();
  await ready(page);
}
const shot = (page, name, info) => process.env.ANALYSE_SHOTS && page.screenshot({ path: `qa/analyse/${name}-${info.project.name}.png`, fullPage: true });

test('Eigenes Diagramm: the D1 values under each other, a tapped day with all values', async ({ page, context }, info) => {
  const errors = await open(page, context);
  await go(page, '#/auswerten/analyse');
  const dg = page.locator('[data-diagram]');
  await expect(dg).toBeVisible();
  // at the top: before the tiles' choice
  const [yd, yp] = await Promise.all([dg.boundingBox(), page.locator('.pick').boundingBox()]);
  expect(yd.y).toBeLessThan(yp.y);
  await expect(dg.locator('[data-dg-row]')).toHaveCount(DEFAULT_KEYS.length);
  for (const k of DEFAULT_KEYS) await expect(dg.locator(`[data-dg-row="${k}"]`), k).toBeVisible();
  await expect(dg.locator('[data-dg-row="rhr"] rect.band')).toHaveCount(1);
  await expect(dg.locator('[data-dg-row="km:bike"] rect.bar').first()).toBeVisible();
  await shot(page, 'diagramm', info);
  // tap a day in the resting pulse row: a line through all rows and the day with every value
  const svg = dg.locator('[data-dg-row="rhr"] svg[role="img"]');
  const box = await svg.boundingBox();
  await svg.click({ position: { x: box.width - 2, y: box.height / 2 } });
  const sheet = page.locator('[data-day-sheet]');
  await expect(sheet).toHaveAttribute('data-day-sheet', TODAY);
  await expect(sheet).toContainText(T('Resting pulse'));
  await expect(sheet.locator('[data-ticked]')).toContainText('Meditation');
  await sheet.evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)));
  if (process.env.ANALYSE_SHOTS) await page.screenshot({ path: `qa/analyse/diagramm-tag-${info.project.name}.png` });
  await sheet.locator('[data-prev]').click();
  await expect(sheet).toHaveAttribute('data-day-sheet', addDays(TODAY, -1));
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
  await expect(dg.locator('[data-dg-pv]')).toHaveCount(DEFAULT_KEYS.length);
  expect(errors).toEqual([]);
});

test('Eigenes Diagramm: add with search up to 6, remove, reorder, on top of each other, weeks; it stays', async ({ page, context }, info) => {
  const errors = await open(page, context);
  await go(page, '#/auswerten/analyse');
  const dg = page.locator('[data-diagram]');
  await dg.locator('[data-dg-add]').click();
  const vp = page.locator('[data-value-picker]');
  await vp.locator('[data-find]').fill('sauna');
  await vp.locator('[data-pick="act:sauna"]').click();
  await expect(vp.locator('[data-count]')).toHaveText(T('{n} of {max} chosen|diagram').replace('{n}', '6').replace('{max}', '6'));
  await vp.locator('[data-find]').fill('');
  await expect(vp.locator('[data-pick="hrv"]')).toBeDisabled();
  await vp.evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)));
  if (process.env.ANALYSE_SHOTS) await page.screenshot({ path: `qa/analyse/diagramm-wert-${info.project.name}.png` });
  await vp.getByRole('button', { name: T('Done'), exact: true }).click();
  await expect(dg.locator('[data-dg-row]')).toHaveCount(6);
  await expect(dg.locator('[data-dg-add]')).toHaveCount(0);
  // remove one, reorder with the arrows
  await dg.locator('[data-dg-value="azm"] .x').click();
  await expect(dg.locator('[data-dg-row]')).toHaveCount(5);
  // read the colour with the pointer away (a hovered chip is darker) and once nothing moves any more
  const dot = async () => {
    await page.mouse.move(0, 0);
    await dg.evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {}))));
    return dg.locator('[data-dg-value="rhr"] .dot').evaluate((el) => getComputedStyle(el).backgroundColor);
  };
  const before = await dot();
  await dg.locator('[data-dg-sort]').click();
  await dg.locator('[data-dg-order] li').first().locator('.sort-ar').nth(1).click();
  await expect(dg.locator('[data-dg-row]').first()).toHaveAttribute('data-dg-row', 'rhr');
  expect(await dot(), 'a value keeps its colour').toBe(before);
  // on top of each other: one picture, one line per value
  await dg.getByRole('button', { name: T('On top of each other|diagram'), exact: true }).click();
  await expect(dg.locator('.over svg path.smooth')).toHaveCount(5);
  await shot(page, 'diagramm-uebereinander', info);
  // one point per week
  await dg.getByRole('button', { name: T('Week|diagram'), exact: true }).click();
  await dg.getByRole('button', { name: T('Under each other|diagram'), exact: true }).click();
  const bars = await dg.locator('[data-dg-row="km:bike"] rect.bar').count();
  expect(bars).toBeGreaterThan(8);
  expect(bars).toBeLessThan(15);
  // it stays after a reload
  await page.reload();
  await ready(page);
  await expect(dg.locator('[data-dg-row]').first()).toHaveAttribute('data-dg-row', 'rhr');
  await expect(dg.locator('[data-dg-row="azm"]')).toHaveCount(0);
  await expect(dg.getByRole('button', { name: T('Week|diagram'), exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});

test('Eigenes Diagramm: a filter for everything, one for a single value, marked days; days left out stay gaps', async ({ page, context }, info) => {
  const errors = await open(page, context);
  await go(page, '#/auswerten/analyse');
  const dg = page.locator('[data-diagram]');
  const points = (k) => dg.locator(`[data-dg-row="${k}"] rect.bar`).count();
  await expect(dg.locator('[data-dg-row="azm"] rect.bar').first()).toBeVisible();
  const before = await points('azm');
  await dg.locator('[data-dg-filter]').click();
  const fs = page.locator('[data-filter-sheet="all"]');
  // only Monday to Friday, without sauna, marked: gym
  await fs.locator('[data-wd="5"]').click();
  await fs.locator('[data-wd="6"]').click();
  await fs.locator('[data-act-pick]').selectOption({ label: 'Sauna' });
  await fs.locator('[data-act-without]').click();
  await fs.locator('[data-mark]').selectOption({ label: 'Gym' });
  await fs.evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)));
  if (process.env.ANALYSE_SHOTS) await page.screenshot({ path: `qa/analyse/diagramm-filter-${info.project.name}.png` });
  await fs.locator('[data-apply]').click();
  await expect(dg.locator('[data-dg-filter]')).toContainText('2');
  await expect(dg.locator('[data-dg-part="wd"]')).toContainText(/Mo.Fr/);
  await expect(dg.locator('[data-dg-part="act"]')).toContainText('Sauna');
  await expect(dg.locator('[data-dg-kept]')).toContainText('90');
  const after = await points('azm');
  expect(after).toBeLessThan(before);
  await expect(dg.locator('[data-dg-row="rhr"] circle.mk').first()).toBeVisible();
  await shot(page, 'diagramm-gefiltert', info);
  // a filter only for the bike km: only trip days
  await dg.locator('[data-dg-row-filter="km:bike"]').click();
  const one = page.locator('[data-filter-sheet="value"]');
  await one.locator('[data-trip="only"]').click();
  await one.locator('[data-apply]').click();
  await expect(dg.locator('[data-dg-row="km:bike"] .ownf')).toBeVisible();
  expect(await points('km:bike')).toBeLessThan(4);
  expect(await points('azm')).toBe(after);
  // × takes one part away; the filters stay after a reload
  await dg.locator('[data-dg-part="act"] .x').click();
  await page.reload();
  await ready(page);
  await expect(dg.locator('[data-dg-part="act"]')).toHaveCount(0);
  await expect(dg.locator('[data-dg-part="wd"]')).toBeVisible();
  await expect(dg.locator('[data-dg-row="km:bike"] .ownf')).toBeVisible();
  expect(errors).toEqual([]);
});

test('Eigenes Diagramm: two trips starting the same day (or before the window) do not break the page', async ({ page, context }) => {
  const errors = await open(page, context);
  await put(page, { trips: [{ id: `${P}trip2`, name: 'Zweite Tour', domain: 'bike', status: 'done', startDate: addDays(TODAY, -30), days: 2 }] });
  await go(page, '#/auswerten/analyse');
  await expect(page.locator('[data-diagram]')).toBeVisible();
  await expect(page.locator('[data-diagram] [data-dg-row="rhr"] rect.band')).toHaveCount(2);
  expect(errors).toEqual([]);
});

test('Überblick (M2): the numbers of the period, every day a field, ranking, ticks per week', async ({ page, context }, info) => {
  const errors = await open(page, context);
  await go(page, '#/auswerten/analyse');
  await page.getByRole('button', { name: T('{n} days|analyse').replace('{n}', '90') }).click();
  const ov = page.locator('[data-overview]');
  for (const k of ['ticks', 'km:bike', 'sleep', 'azm', 'rhr', 'run']) await expect(ov.locator(`[data-ov-box="${k}"]`), k).toBeVisible();
  await expect(ov.locator('[data-ov-box="ticks"]')).toContainText(T('ticks in {n} days|overview').replace('{n}', '90'));
  const heat = page.locator('[data-heat]');
  await expect(heat.locator('button.cell')).toHaveCount(90);
  await expect(heat.locator('button.cell.l4').first()).toBeVisible();
  const rank = page.locator('[data-ranking] li');
  await expect(rank.first()).toHaveAttribute('data-rank', /meditation/);
  expect(await page.locator('[data-weekly] rect.wb').count()).toBeGreaterThanOrEqual(13);
  await expect(page.locator('[data-weekly] path.m4')).toBeVisible();
  await heat.scrollIntoViewIfNeeded();
  await shot(page, 'ueberblick', info);
  // a field opens its day
  await heat.locator(`button.cell[data-day="${TODAY}"]`).click();
  await expect(page.locator('[data-day-sheet]')).toHaveAttribute('data-day-sheet', TODAY);
  await page.keyboard.press('Escape');
  // without Aktiv: no calendar and no ranking
  await page.locator('[data-src="aktiv"]').click();
  await expect(page.locator('[data-heat]')).toHaveCount(0);
  await expect(ov.locator('[data-ov-box="ticks"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Vergleichen (M3): period against period, activity against activity, before and after a trip', async ({ page, context }, info) => {
  const errors = await open(page, context);
  await go(page, '#/auswerten/analyse');
  const per = page.locator('[data-compare-period]');
  await expect(per.locator('[data-cmp-value]').first()).toHaveAttribute('data-cmp-value', 'km:bike');
  await expect(per.locator('[data-cmp-now]')).toBeVisible();
  await expect(per.locator('[data-cmp-prev]')).toBeVisible();
  await expect(per.locator('[data-cmp-say]')).toBeVisible();
  // sleep: the mean so far against the month before
  await per.locator('[data-cmp-value="sleep"]').click();
  await expect(per.locator('[data-cmp-value="sleep"]')).toHaveAttribute('aria-pressed', 'true');
  await per.getByRole('button', { name: T('Week|compare') }).click();
  await expect(per.locator('[data-cmp-now]')).toBeVisible();
  // activity against activity: the two most ticked first, one more added, one removed
  const aa = page.locator('[data-compare-acts]');
  await expect(aa.locator('[data-cmp-act]')).toHaveCount(2);
  await expect(aa.locator('[data-cmp-act]').first()).toHaveAttribute('data-cmp-act', /meditation/);
  await aa.locator('[data-cmp-add]').selectOption({ index: 1 });
  await expect(aa.locator('[data-cmp-act]')).toHaveCount(3);
  await expect(aa.locator('path[data-cmp-line]')).toHaveCount(3);
  await aa.locator('[data-cmp-act]').nth(2).getByRole('button').click();
  await expect(aa.locator('[data-cmp-act]')).toHaveCount(2);
  // before and after the trip
  const tr = page.locator('[data-compare-trip]');
  await expect(tr.locator('[data-cmp-trip]')).toHaveValue(`${P}trip`);
  await expect(tr.locator('[data-cmp-row="sleep"]')).toBeVisible();
  await expect(tr.locator('[data-cmp-row="rhr"] td').nth(2)).not.toHaveText('');
  await per.scrollIntoViewIfNeeded();
  await shot(page, 'vergleiche', info);
  // the choice stays
  await go(page, '#/auswerten/analyse');
  await expect(page.locator('[data-compare-period] [data-cmp-value="sleep"]')).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});

test('Muster und Rekorde (M4): week pattern, year against year, records, runs and gaps', async ({ page, context }, info) => {
  const errors = await open(page, context);
  await go(page, '#/auswerten/analyse');
  const wp = page.locator('[data-week-pattern]');
  await expect(wp.locator('[data-pat-cell]')).toHaveCount(28);
  await expect(wp.locator('[data-pat-say]')).toContainText(T('Evening|patterns'));
  await wp.locator('[data-pat-act]').selectOption({ label: 'Sauna' });
  await expect(wp.locator('[data-pat-say]')).toBeVisible();
  const yy = page.locator('[data-year-year]');
  await expect(yy.locator('[data-yy-value]')).toHaveValue('km:bike');
  await expect(yy.locator('rect[data-yy-now]')).toHaveCount(12);
  await yy.getByRole('button', { name: T('Seasons|patterns') }).click();
  await expect(yy.locator('rect[data-yy-now]')).toHaveCount(4);
  const rec = page.locator('[data-records]');
  for (const k of ['run', 'bikeMonth', 'rhr', 'steps', 'sleep']) await expect(rec.locator(`[data-record="${k}"]`), k).toBeVisible();
  await expect(rec.locator('[data-record^="week:"]').first()).toBeVisible();
  const runs = page.locator('[data-runs] [data-run]');
  expect(await runs.count()).toBeGreaterThanOrEqual(5);
  await expect(page.locator(`[data-runs] [data-run="meditation"] td`).first()).toHaveText('1');
  await wp.scrollIntoViewIfNeeded();
  await shot(page, 'muster', info);
  // the choice stays
  await go(page, '#/auswerten/analyse');
  await expect(page.locator('[data-year-year] rect[data-yy-now]')).toHaveCount(4);
  expect(errors).toEqual([]);
});

test('Eigene Rechnungen: Schlafindex and Unruhe as labelled own calculations', async ({ page, context }) => {
  const errors = await open(page, context);
  await go(page, '#/auswerten/analyse');
  const tile = page.locator('[data-value="sleepScore"]');
  await expect(tile).toBeVisible();
  await expect(tile).toContainText(T('own calculation|own'));
  await expect(page.locator('[data-value="restless"]')).toContainText(T('own calculation|own'));
  await tile.click();
  await expect(page.locator('[data-detail="sleepScore"]')).toBeVisible();
  await expect(page.locator('[data-detail="sleepScore"] > header')).toContainText(T('Own calculation, 0–100: duration (half, full at 8 h), deep and REM sleep (a quarter), calm (a quarter).|own'));
  expect(errors).toEqual([]);
});

test('Ansichten: a starter brings its values, a new view keeps what you see, rename, move, delete with undo', async ({ page, context }, info) => {
  const errors = await open(page, context);
  await go(page, '#/auswerten/analyse');
  const vw = page.locator('[data-views]');
  const dg = page.locator('[data-diagram]');
  await expect(vw.locator('[data-view="start-all"]')).toHaveAttribute('aria-pressed', 'true');
  // the starter «Schlaf und Training» brings its values
  await vw.locator('[data-view="start-sleep"]').click();
  await expect(dg.locator('[data-dg-row="sleepScore"]')).toBeVisible();
  await expect(vw.locator('[data-view="start-sleep"]')).toHaveAttribute('aria-pressed', 'true');
  // a new view of what you see now, after a change
  await page.getByRole('button', { name: T('{n} days|analyse').replace('{n}', '30') }).click();
  await vw.locator('[data-view-add]').click();
  await page.locator('[data-view-form] input').fill('Winterzeit');
  await page.locator('[data-view-form] button[type=submit]').click();
  const mine = vw.locator('[data-view]').last();
  await expect(mine).toHaveText('Winterzeit');
  await expect(mine).toHaveAttribute('aria-pressed', 'true');
  await vw.locator('[data-view="start-all"]').click();
  await expect(dg.locator('[data-dg-row="sleepScore"]')).toHaveCount(0);
  await mine.click();
  await expect(dg.locator('[data-dg-row="sleepScore"]')).toBeVisible();
  // edit: rename, move up, delete with undo
  await vw.locator('[data-view-edit]').click();
  const list = page.locator('[data-view-list]');
  await list.locator('[data-view-rename]').last().click();
  await list.locator('[data-view-name]').fill('Ski');
  await list.locator('[data-view-name]').press('Enter');
  await expect(vw.locator('[data-view]').last()).toHaveText('Ski');
  await list.locator('li').last().locator('.sort-ar').first().click();
  await expect(vw.locator('[data-view]').nth(1)).toHaveText('Ski');
  await shot(page, 'ansichten', info);
  await list.locator('[data-view-del]').first().click();
  await page.getByRole('button', { name: T('Delete') }).last().click();
  await expect(vw.locator('[data-view]')).toHaveCount(2);
  await page.getByRole('button', { name: T('Undo') }).click();
  await expect(vw.locator('[data-view]')).toHaveCount(3);
  // it stays
  await go(page, '#/auswerten/analyse');
  await expect(page.locator('[data-views] [data-view]').nth(1)).toHaveText('Ski');
  expect(errors).toEqual([]);
});
