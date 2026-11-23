// «Im Fokus» für alle Sportarten (Noah 22.11.2026, Thread «Alle Sportarten und Erholung», Schritt D): Auswerten shows the sports
// you ticked in Aktiv (tennis, ice hockey, gym) next to the Strava sports, in «Im Fokus» (a card each, the one with most time
// first after the Strava sports) and in «Letzte 7 Tage» (the count and the time, «etwa» when it is the usual duration).
// A tick that belongs to a Strava activity counts once. Fictional data, German UI, phone and computer.
// SHOTS=<dir> saves im-fokus-390.png / im-fokus-1440.png.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { flowSeeded, putWall } from './wall-fixture.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const P = 'test_data_gtp_';
const TODAY = '2026-10-09';
const D0 = `${TODAY}T09:00:00+02:00`;
const addDays = (day, n) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const log = (id, actId, day, f = {}) => ({ id: `${P}${id}`, actId, day, at: `${day}T18:00:00+02:00`, n: 1, ...f });
const run = { id: `${P}run1`, day: addDays(TODAY, -2), time: '07:00', start: `${addDays(TODAY, -2)}T05:00:00Z`, name: `${P}Lauf am See`, type: 'Run', kind: 'run', km: 9.6, hm: 80, movingS: 3000, elapsedS: 3100, gearId: null, hrAvg: 150, hrMax: 172, commute: false, trainer: false, wAvg: null, wMax: null, wDevice: false, effort: 50 };
const rows = () => ({
  activities: [run],
  flowLog: [
    log('t1', 'tennis', addDays(TODAY, -1), { min: 75 }),
    log('t2', 'tennis', addDays(TODAY, -4)),
    log('h1', 'hockey', addDays(TODAY, -3), { min: 90 }),
    log('r1', 'run', addDays(TODAY, -2), { stravaId: `${P}run1` }), // the tick of the Strava run: counted once, as the run
  ],
});
const put = (page, data) =>
  page.evaluate(async (data) => {
    const db = await new Promise((res, rej) => {
      const r = indexedDB.open('pack-generator');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    await new Promise((res, rej) => {
      const tx = db.transaction(Object.keys(data), 'readwrite');
      for (const [t, list] of Object.entries(data)) for (const x of list) tx.objectStore(t).put(x);
      tx.oncomplete = res;
      tx.onerror = () => rej(tx.error);
    });
    db.close();
  }, data);

test('Im Fokus: the ticked sports stand next to the Strava sports, in the cards and in the list', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/');
  await flowSeeded(page);
  await put(page, rows());
  await page.goto('./#/auswerten');
  await page.reload();

  const focus = page.locator('[data-focus]');
  await expect(focus).toBeVisible();
  // the Strava run first, then tennis (135 min, 60 of them «etwa») and ice hockey (90 min)
  const cards = focus.locator('[data-focus-card]');
  await expect(cards).toHaveCount(3);
  await expect(cards.nth(0)).toHaveAttribute('data-focus-card', 'run');
  await expect(cards.nth(1)).toHaveAttribute('data-focus-card', 'tick:tennis');
  await expect(cards.nth(2)).toHaveAttribute('data-focus-card', 'tick:hockey');
  await expect(cards.nth(1)).toContainText('2 Sitzungen');
  await expect(cards.nth(1)).toContainText(`${T('about {time}', { time: '2 h 15 min' })}`);
  await expect(cards.nth(2)).toContainText('1 h 30 min');
  await expect(cards.nth(2)).not.toContainText(T('about {time}', { time: '1 h 30 min' }));
  // a card opens the «Rückblick pro Sportart» of that sport
  await expect(cards.nth(1)).toHaveAttribute('href', '#/auswerten/sportjahr/tennis');

  // «Letzte 7 Tage»: on a phone behind one row
  const fold = page.locator('[data-ov-fold] details').first();
  if ((await fold.count()) && !(await fold.evaluate((el) => el.open))) await fold.locator('summary').click();
  const l7 = page.locator('[data-last7]');
  await expect(l7.locator('[data-l7="tick:tennis"]')).toContainText('2× Tennis spielen');
  await expect(l7.locator('[data-l7="tick:hockey"]')).toContainText('1× Eishockey');
  await expect(l7.locator('[data-l7="run"]')).toContainText('1× ');
  // the tick of the Strava run is not a second run: no «run» card of the ticks and no second line
  await expect(l7.locator('[data-l7="tick:run"]')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/im-fokus-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });

  await l7.locator('[data-l7="tick:tennis"]').click();
  await expect(page).toHaveURL(/#\/auswerten\/sportjahr\/tennis/);
  expect(errors).toEqual([]);
});

test('This week on Heute counts a Strava run without a tick as a day', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  await page.goto('./#/');
  await flowSeeded(page);
  await put(page, { activities: [{ ...run, id: `${P}run2`, day: addDays(TODAY, -3), start: `${addDays(TODAY, -3)}T07:00:00Z` }] });
  await putWall(page); // the wall with «Diese Woche» (and reloads)
  const week = page.locator('[data-section="week"]');
  await expect(week).toBeVisible();
  await expect(week.locator('[data-week-sub]')).toContainText('1 Tag aktiv');
  await expect(week.locator('[data-week-list]')).toContainText(T('Run|kind'));
  if (process.env.SHOTS) await week.screenshot({ path: `${process.env.SHOTS}/diese-woche-${info.project.name === 'phone' ? 390 : 1440}.png` });
});

test('Auswerten: «Alles, was du angelegt hast» lists every activity of the period, also a daily habit and ones with 0 times (23.11.2026)', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/');
  await flowSeeded(page);
  await put(page, { ...rows(), flowLog: [...rows().flowLog, log('p1', 'pushups', addDays(TODAY, -1)), log('p2', 'pushups', addDays(TODAY, -2)), log('s1', 'sauna', addDays(TODAY, -3))] });
  await page.goto('./#/auswerten');
  await page.reload();
  await expect(page.locator('[data-focus]')).toBeVisible(); // the page has loaded
  // on a phone «Letzte 7 Tage» waits behind one row
  const fold = page.locator('[data-ov-fold] details').first();
  if ((await fold.count()) && !(await fold.evaluate((el) => el.open))) await fold.locator('summary').click();
  const all = page.locator('[data-alle-fold]');
  await expect(all).toBeVisible();
  await all.locator('summary').first().click();
  const card = all.locator('[data-alle="period"]');
  // a daily habit (push-ups) is not in «Letzte 7 Tage», but here it is; the sauna as a ritual; ones with 0 times in a closed line
  await expect(card.locator('[data-alle-row="pushups"]')).toContainText('2 Mal');
  await expect(card.locator('[data-alle-row="sauna"]')).toContainText('1 Mal');
  await expect(card.locator('[data-alle-row="tennis"]')).toContainText('2 Mal');
  await expect(card.locator('[data-alle-quiet]').first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  if (process.env.SHOTS) await all.screenshot({ path: `${process.env.SHOTS}/alle-auswerten-${info.project.name === 'phone' ? 390 : 1440}.png` });
  expect(errors).toEqual([]);
});
