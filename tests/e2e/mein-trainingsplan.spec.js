// «Mein Trainingsplan» (Noah 21.11.2026 «ich möchte alle entwürfe 1-3 umsetzen», S6): plan and what you did, on one page.
// Fictional data only; the clock stands on Friday 9 October 2026, 09:00 in Europe/Zurich (calendar week 41); German UI.
// SHOTS=<folder> saves pictures (Handy 390 / Computer 1440).
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, addDays, put } from './aktiv-fixture.js';
import { flowSeeded } from './wall-fixture.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const SHOTS = process.env.SHOTS || '';
const THIS_MONDAY = '2026-10-05';

/** Four past weeks as frozen snapshots (planned and ticked), a weekly plan, some ticks this week and a goal. */
function rows() {
  const units = [
    { id: 'bikeOut#1', type: 'bikeOut', d: 5, t: '10:00', mins: 160 },
    { id: 'bikeOut#2', type: 'bikeOut', d: 1, t: '17:00', mins: 100 },
    { id: 'runOut#1', type: 'runOut', d: 1, t: '12:30', mins: 50 },
    { id: 'tennis@1', type: 'tennis', d: 2, t: '18:00', mins: 90 },
    { id: 'tennis@2', type: 'tennis', d: 6, t: '10:00', mins: 60 },
    { id: 'gym@1', type: 'gym', d: 3, t: '12:00', mins: 50 },
    { id: 'gym@2', type: 'gym', d: 4, t: '08:00', mins: 50 },
    { id: 'yoga@1', type: 'yoga', d: 4, t: '09:30', mins: 60 },
    { id: 'yoga@2', type: 'yoga', d: 0, t: '09:30', mins: 60 },
    { id: 'hockey@1', type: 'hockey', d: 3, t: '19:00', mins: 90 },
    { id: 'bikeIn#1', type: 'bikeIn', d: 2, t: '13:00', mins: 50 },
  ];
  const weeks = {};
  [0, 1, 2, 3].forEach((k) => {
    const monday = addDays(THIS_MONDAY, -7 * (4 - k));
    const done = {};
    units.slice(0, units.length - [0, 2, 4, 1][k]).forEach((u) => (done[u.id] = addDays(monday, u.d)));
    weeks[monday] = { done, no: [], snap: { saved: addDays(monday, 6), hours: 14, units } };
  });
  // this week: the units of the plan whose ids are known are ticked, the others simply stay open
  weeks[THIS_MONDAY] = { done: { 'tennis@1': '2026-10-06', 'runOut#1': '2026-10-06', 'gym@1': '2026-10-08' }, no: [] };
  return {
    settings: [
      { key: 'training.weekplan', value: { v: 1 } },
      { key: 'training.weeklog', value: { v: 1, weeks } },
      { key: 'training.goal', value: { name: 'Fictional alps crossing', until: '2027-01-04' } },
    ],
  };
}

async function open(page, context, hash, seed = true) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  await page.goto(hash);
  await ready(page);
  await flowSeeded(page);
  if (seed) await put(page, rows());
  await page.reload();
  await ready(page);
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
const press = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());

test('Mein Trainingsplan: goal, the week in numbers, bars against the plan line, the week unit by unit, plan against done', async ({ page, context }, info) => {
  const errors = await open(page, context, './#/flow/trainingsplan');
  const pg = page.locator('[data-meinplan]');
  await expect(pg).toBeVisible();
  await expect(pg.locator('h1')).toHaveText(T('My training plan'));
  await expect(pg.locator('[data-mp-goal]')).toContainText('Fictional alps crossing');
  await expect(pg.locator('[data-mp-sources]')).toContainText(T('Weekly plan'));
  await expect(pg.locator('[data-mp-kw]')).toContainText('41');
  await expect(pg.locator('[data-mp-hours]')).toContainText(/\d+:\d\d h/);
  await expect(pg.locator('[data-mp-units]')).toContainText(/\d+ von \d+/);
  await expect(pg.locator('[data-chart="meinplan"] [data-plot]')).toHaveAttribute('data-n', '8');
  const rowsN = await pg.locator('[data-mp-week] [data-mp-row]').count();
  expect(rowsN).toBeGreaterThan(3);
  expect(await pg.locator('[data-mp-week] [data-mp-status="done"]').count()).toBeGreaterThan(0);
  await expect(pg.locator('[data-mp-last] [data-mp-last-week]')).toHaveCount(4);
  await expect(pg.locator('[data-mp-last]')).toContainText('%');
  await shot(page, info, 'meinplan');
  expect(errors).toEqual([]);
});

test('Mein Trainingsplan: a tap on a bar opens that week unit by unit', async ({ page, context }, info) => {
  const errors = await open(page, context, './#/flow/trainingsplan');
  await pg(page).locator('[data-chart="meinplan"] [data-plot]').click({ position: { x: 5, y: 60 } });
  await expect(page.locator('[data-chart-sheet]')).toBeVisible();
  await expect(page.locator('[data-chart-sheet] [data-mp-sheet-sum]')).toContainText(/\d+:\d\d/);
  await expect(page.locator('[data-chart-sheet] [data-mp-row]').first()).toBeVisible();
  await shot(page, info, 'meinplan-woche');
  expect(errors).toEqual([]);
});
function pg(page) {
  return page.locator('[data-meinplan]');
}

test('Mein Trainingsplan: without any plan it says why and offers the weekly plan', async ({ page, context }, info) => {
  const errors = await open(page, context, './#/flow/trainingsplan', false);
  const p = pg(page);
  await expect(p).toContainText(T('No plan yet'));
  await expect(p.locator('a[href="#/flow/wochenplan"]')).toBeVisible();
  await shot(page, info, 'meinplan-leer');
  expect(errors).toEqual([]);
});

test('Mein Trainingsplan: Active leads there under «This week»', async ({ page, context }, info) => {
  const errors = await open(page, context, './#/flow');
  const link = page.locator('[data-to-trainingsplan]');
  await expect(link).toBeVisible();
  await press(link, info);
  await expect(pg(page)).toBeVisible();
  expect(errors).toEqual([]);
});
