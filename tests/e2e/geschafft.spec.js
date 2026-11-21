// «Geschafft» (Noah 19.11.2026 «1-5a», Thread «Training erfassen vereinfachen», T1 and T2): after a tick on Aktiv the page opens at once
// (T2 «Haken zuerst», with optional chips for duration and feeling); on Heute the message after the tick still leads to
// the page «Geschafft»: what you did, the time this week, the week in hours and days, the weekly goals still open, one next step, Undo.
// Fictional data only; the clock stands on Friday 9 October 2026, 07:52 in Europe/Zurich; German UI, phone + desktop.
// SHOTS=<folder> saves pictures (Handy 390 / Computer 1440).
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, addDays, aktivRows, put } from './aktiv-fixture.js';
import { flowSeeded } from './wall-fixture.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const press = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());
const SHOTS = process.env.SHOTS || '';

async function open(page, context, hash = './#/flow') {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  await page.goto(hash);
  await ready(page);
  await flowSeeded(page);
  return errors;
}
async function shot(page, info, name) {
  if (!SHOTS) return;
  const w = info.project.name === 'phone' ? 390 : 1440;
  await page.waitForTimeout(900);
  await page.evaluate(() => window.scrollTo(0, 0));
  const vp = page.viewportSize();
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: vp.width, height: Math.max(vp.height, h) });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SHOTS}/${name}-${w}.png`, fullPage: true });
  await page.setViewportSize(vp);
}

test('a tick leads to «Geschafft» with the number of the week, the week and one next step', async ({ page, context }, info) => {
  const errors = await open(page, context);
  await put(page, aktivRows());
  await page.reload();
  await ready(page);
  const push = page.locator('main [data-act="pushups"]').first(); // not ticked on 9 October in the fixture
  await expect(push).toBeVisible();
  await press(push, info);
  await expect(page).toHaveURL(/#\/flow\/geschafft\?e=/); // T2: one tap ticks and opens the page
  await expect(page.locator('.ftoast')).toHaveCount(0); // the page has its own Undo
  const pg = page.locator('[data-geschafft]');
  await expect(pg.locator('[data-geschafft-head]')).toContainText(T('Done page: {name}').replace('{name}', ''));
  await expect(pg.locator('[data-geschafft-source]')).toContainText(T('ticked by you'));
  await expect(pg.locator('[data-geschafft-nth]')).toContainText(/Mal diese Woche/);
  await expect(pg.locator('[data-geschafft-days] b')).toHaveCount(7);
  await expect(pg.locator('[data-geschafft-days] b.y').first()).toBeVisible();
  await expect(pg.locator('[data-geschafft-goals]')).toBeVisible();
  await expect(pg.locator('[data-geschafft-quiet]')).toContainText(T('With a watch or Strava this card shows time, distance and heart rate next to the last time.'));
  await expect(pg.locator('[data-geschafft-back]')).toHaveAttribute('href', '#/flow');
  await expect(pg.locator('[data-geschafft-all]')).toHaveAttribute('href', /#\/flow\/sport\/act%3Apushups$/);
  await shot(page, info, 'geschafft-hand');
  expect(errors).toEqual([]);
});

test('no hours bar without a goal; with a goal from the weekly plan the bar and its hours show', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const rows = { flowLog: [] };
  // two ticks with a duration this week (Monday 5 and Friday 9 October)
  rows.flowLog.push({ id: 'g-mon', actId: 'yoga', day: '2026-10-05', at: '2026-10-05T18:00:00+02:00', n: 1, min: 45 }, { id: 'g-fri', actId: 'yoga', day: TODAY, at: `${TODAY}T07:30:00+02:00`, n: 1, min: 45 });
  await put(page, rows);
  await page.goto('./#/flow/geschafft?e=g-fri');
  await page.reload();
  await ready(page);
  const pg = page.locator('[data-geschafft]');
  await expect(pg.locator('[data-geschafft-hours]')).toHaveText(/1:30 h/);
  await expect(pg.locator('[data-geschafft-week] .prog')).toHaveCount(0);
  await put(page, { settings: [{ key: 'training.goal', value: { hours: 6 } }] });
  await page.reload();
  await ready(page);
  await expect(pg.locator('[data-geschafft-week] .prog')).toBeVisible();
  await expect(pg.locator('[data-geschafft-week]')).toContainText(T('of {h} h weekly goal').replace('{h}', '6'));
  await shot(page, info, 'geschafft-ziel');
  expect(errors).toEqual([]);
});

test('a Strava tick compares with the last time of the same sport, only to look at', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const rows = aktivRows();
  rows.flowLog.push({ id: 'fl-strava-r2', actId: 'run', day: TODAY, at: `${TODAY}T06:10:00+02:00`, n: 1, min: 46, via: 'strava', stravaId: 'r2' });
  rows.activities = [
    { id: 'r1', day: addDays(TODAY, -7), start: `${addDays(TODAY, -7)}T05:00:00Z`, type: 'Run', kind: 'run', name: 'Fictional run', km: 8, movingS: 2900, hrAvg: 151 },
    { id: 'r2', day: TODAY, start: `${TODAY}T04:10:00Z`, type: 'Run', kind: 'run', name: 'Fictional morning run', km: 8.2, movingS: 2760, hrAvg: 148 },
  ];
  await put(page, rows);
  await page.goto('./#/flow/geschafft?e=fl-strava-r2');
  await page.reload();
  await ready(page);
  const pg = page.locator('[data-geschafft]');
  await expect(pg.locator('[data-geschafft-source]')).toContainText(T('from Strava|done'));
  await expect(pg.locator('[data-geschafft-compare]')).toContainText('46 statt 48 Min');
  await expect(pg.locator('[data-geschafft-compare]')).toContainText('8.2 statt 8 km');
  await expect(pg.locator('[data-geschafft-compare]')).toContainText('148 statt 151');
  await expect(pg.locator('[data-geschafft-obs]')).toContainText(T('Only to look at.'));
  await shot(page, info, 'geschafft-strava');
  expect(errors).toEqual([]);
});

test('a planned session of the day (TrainingPeaks) stands next to what was done, only to look at', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const rows = aktivRows();
  rows.flowLog.push({ id: 'fl-strava-b2', actId: 'bike', day: TODAY, at: `${TODAY}T06:10:00+02:00`, n: 1, min: 62, via: 'strava', stravaId: 'b2' });
  rows.activities = [{ id: 'b2', day: TODAY, start: `${TODAY}T04:10:00Z`, type: 'Ride', kind: 'bike', name: 'Fictional morning ride', km: 31, movingS: 3720, hrAvg: 138 }];
  rows.settings = [{ key: 'training.plan', value: { sessions: [{ id: 'tp-demo', day: TODAY, kind: 'bike', name: 'Endurance Z2', mins: 60, zone: 2, src: 'tp' }, { id: 'tp-other', day: addDays(TODAY, 1), kind: 'bike', name: 'Tomorrow', mins: 45, zone: null, src: 'tp' }] } }];
  await put(page, rows);
  await page.goto('./#/flow/geschafft?e=fl-strava-b2');
  await page.reload();
  await ready(page);
  const pg = page.locator('[data-geschafft]');
  await expect(pg.locator('[data-geschafft-plan]')).toHaveText(`${T('Planned {planned} min, done {did} min').replace('{planned}', '60').replace('{did}', '62')} · ${T('Zone {z}').replace('{z}', '2')} · ${T('from TrainingPeaks')}`);
  await expect(pg.locator('[data-geschafft-quiet]')).toContainText(T('There is no earlier one to compare with yet.')); // nothing is rated, the other lines stay as they were
  await expect(pg.locator('[data-geschafft-plan]')).not.toContainText(/zu kurz|zu lang|Ziel/); // only both numbers
  await shot(page, info, 'geschafft-plan');
  expect(errors).toEqual([]);
});

test('Undo on the page takes the tick back and leads to Aktiv; an empty page says why', async ({ page, context }, info) => {
  const errors = await open(page, context, './#/flow/geschafft');
  const pg = page.locator('[data-geschafft]');
  await expect(pg.locator('[data-empty]')).toContainText(T('Nothing ticked yet. Tick something on Active and this page shows what it brought.'));
  await expect(pg.locator('[data-empty] a')).toHaveAttribute('href', '#/flow');
  await page.goto('./#/flow');
  const yoga = page.locator('main [data-act="yoga"]').first();
  await expect(yoga).toBeVisible();
  await press(yoga, info);
  await expect(page).toHaveURL(/#\/flow\/geschafft\?e=/);
  await press(pg.locator('[data-geschafft-undo]'), info);
  await expect(page).toHaveURL(/#\/flow$/);
  await expect(page.locator('main [data-act="yoga"]').first()).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.ftoast')).toContainText(T('{name} · taken back').replace('{name}', ''));
  expect(errors).toEqual([]);
});

const readLog = (page) =>
  page.evaluate(
    () =>
      new Promise((res, rej) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = () => rej(r.error);
        r.onsuccess = () => {
          const q = r.result.transaction('flowLog').objectStore('flowLog').getAll();
          q.onsuccess = () => {
            r.result.close();
            res(q.result);
          };
        };
      }),
  );

test('T2: a tap on a tile ticks and opens the page; duration and feeling are optional chips and can be taken back', async ({ page, context }, info) => {
  const errors = await open(page, context);
  await put(page, aktivRows());
  await page.reload();
  await ready(page);
  await press(page.locator('main [data-act="pushups"]').first(), info);
  await expect(page).toHaveURL(/#\/flow\/geschafft\?e=/);
  const how = page.locator('[data-geschafft-how]');
  await expect(how).toBeVisible();
  await expect(how.locator('[data-min]')).toHaveCount(4);
  await expect(how.locator('[data-feel]')).toHaveText([T('light|feel'), T('good|feel'), T('hard|feel')]);
  await expect(how.locator('[aria-pressed="true"]')).toHaveCount(0); // nothing is chosen for you
  await press(how.locator('[data-min="45"]'), info);
  await expect(how.locator('[data-min="45"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-geschafft-head]')).toContainText('45 Min');
  await press(how.locator('[data-feel="good"]'), info);
  await expect(how.locator('[data-feel="good"]')).toHaveAttribute('aria-pressed', 'true');
  const savedRows = async () => (await readLog(page)).filter((e) => e.actId === 'pushups' && e.day === TODAY);
  await expect.poll(async () => (await savedRows()).length).toBe(1); // the chips write on their own: wait for the database, not a fixed time
  await expect.poll(async () => (await savedRows())[0]).toMatchObject({ min: 45, feel: 'good' });
  const saved = await savedRows();
  await shot(page, info, 'geschafft-chips');
  // the same chip again takes it back; another one replaces it
  await press(how.locator('[data-feel="good"]'), info);
  await press(how.locator('[data-min="60"]'), info);
  await expect(how.locator('[data-feel][aria-pressed="true"]')).toHaveCount(0);
  await expect(how.locator('[data-min="60"]')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => (await readLog(page)).find((e) => e.id === saved[0].id)).toMatchObject({ min: 60 });
  expect((await readLog(page)).find((e) => e.id === saved[0].id).feel).toBeUndefined();
  expect(errors).toEqual([]);
});

test('T2: a Strava tick offers the feeling but no duration; the ride to work offers the feeling too', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const rows = aktivRows();
  rows.flowLog.push({ id: 'fl-strava-x', actId: 'run', day: TODAY, at: `${TODAY}T06:10:00+02:00`, n: 1, min: 46, via: 'strava', stravaId: 'x1' });
  await put(page, rows);
  await page.goto('./#/flow/geschafft?e=fl-strava-x');
  await page.reload();
  await ready(page);
  const how = page.locator('[data-geschafft-how]');
  await expect(how.locator('[data-min]')).toHaveCount(0);
  await press(how.locator('[data-feel="hard"]'), info);
  await expect(how.locator('[data-feel="hard"]')).toHaveAttribute('aria-pressed', 'true');
  expect((await readLog(page)).find((e) => e.id === 'fl-strava-x')).toMatchObject({ min: 46, feel: 'hard', via: 'strava' });
  expect(errors).toEqual([]);
});

test('T2: an old tick without «feel» opens as before, nothing chosen', async ({ page, context }) => {
  const errors = await open(page, context);
  await put(page, { flowLog: [{ id: 'old-1', actId: 'yoga', day: TODAY, at: `${TODAY}T07:30:00+02:00`, n: 1, min: 30 }] });
  await page.goto('./#/flow/geschafft?e=old-1');
  await page.reload();
  await ready(page);
  const how = page.locator('[data-geschafft-how]');
  await expect(how.locator('[data-min="30"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(how.locator('[data-feel][aria-pressed="true"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
