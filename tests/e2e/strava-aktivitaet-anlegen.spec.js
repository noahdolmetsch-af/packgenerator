// «Aktivität anlegen?» (Noah 21.11.2026 «4a», S7): Meine Sportarten asks about Strava sports without an activity.
// Fictional data only; the clock stands on Friday 9 October 2026, 09:00 in Europe/Zurich; German UI, phone + desktop.
// SHOTS=<folder> saves pictures (Handy 390 / Computer 1440).
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, addDays, put } from './aktiv-fixture.js';
import { flowSeeded } from './wall-fixture.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const SHOTS = process.env.SHOTS || '';

function rows() {
  const activities = [];
  for (let i = 0; i < 9; i++) {
    const day = addDays('2026-08-01', i * 6);
    activities.push({ id: `fx-h${i}`, day, time: '09:00', start: `${day}T07:00:00.000Z`, name: 'Fictional snowshoe tour', type: 'Snowshoe', kind: 'other', km: 12, hm: 700, movingS: 14400, hrAvg: 120 });
  }
  activities.push({ id: 'fx-s1', day: '2026-09-20', time: '12:00', start: '2026-09-20T10:00:00.000Z', name: 'Fictional swim', type: 'Swim', kind: 'other', km: 1.5, hm: 0, movingS: 2400, hrAvg: 130 });
  return { activities };
}
const count = (page, table, filter) =>
  page.evaluate(
    ([table, filter]) =>
      new Promise((res) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const g = r.result.transaction(table).objectStore(table).getAll();
          g.onsuccess = () => {
            r.result.close();
            res(g.result.filter((x) => (filter ? x.actId === filter : true)).length);
          };
        };
      }),
    [table, filter],
  );

async function open(page, context) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  await page.goto('./#/flow/sports');
  await ready(page);
  await flowSeeded(page);
  await put(page, rows());
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

test('Strava sports without an activity: one tap makes it and counts the old ones, Undo takes it back', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const card = page.locator('[data-strava-neu]');
  await expect(card).toBeVisible();
  await expect(card.locator('[data-sn-sport]')).toHaveCount(2); // Snowshoe and Swim
  await expect(card).toContainText('10');
  await shot(page, info, 'strava-neu');
  expect(await count(page, 'flowLog', 'snowshoe')).toBe(0);
  await press(card.locator('[data-sn-make="Snowshoe"]'), info);
  await expect(card.locator('[data-sn-sport="Snowshoe"]')).toHaveCount(0);
  await expect(card.locator('[data-sn-sport="Swim"]')).toBeVisible();
  await expect.poll(() => count(page, 'flowLog', 'snowshoe')).toBe(9);
  expect(await count(page, 'flowActs', null)).toBeGreaterThan(0);
  // Undo
  await press(page.getByRole('button', { name: T('Undo') }).first(), info);
  await expect(card.locator('[data-sn-sport="Snowshoe"]')).toBeVisible();
  await expect.poll(() => count(page, 'flowLog', 'snowshoe')).toBe(0);
  expect(errors).toEqual([]);
});

test('«Do not ask» says no for good', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const card = page.locator('[data-strava-neu]');
  await press(card.locator('[data-sn-never="Swim"]'), info);
  await expect(card.locator('[data-sn-sport="Swim"]')).toHaveCount(0);
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-strava-neu] [data-sn-sport="Swim"]')).toHaveCount(0);
  await expect(page.locator('[data-strava-neu] [data-sn-sport="Snowshoe"]')).toBeVisible();
  expect(errors).toEqual([]);
});
