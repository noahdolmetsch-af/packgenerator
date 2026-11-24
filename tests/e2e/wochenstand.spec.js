// «Wochenstand» (Noah 24.11.2026 «1-3»): on the week card of Heute (Sunday 17:00 to Monday 12:00) one quiet line says on how many
// days of the week Outdoors reached its goal and on how many days there was a meditation. Fictional data only; the clock stands on
// Sunday 15 November 2026, 18:30 (Zürich). SHOTS=<folder> saves pictures.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const SUNDAY = '2026-11-15T18:30:00+01:00';
const walk = (id, day, min) => ({ id: `test_ws_${id}`, day, kind: 'hike', type: 'Walk', name: 'Test walk', movingS: min * 60, km: 4, hm: 0, hist: null });
const ride = (day) => ({ id: 'test_ws_ride', day, kind: 'bike', name: 'Test ride', movingS: 7200, km: 50, hm: 300, hist: null });
const rows = {
  activities: [walk('a', '2026-11-09', 100), walk('b', '2026-11-10', 60), walk('c', '2026-11-12', 95), ride('2026-11-13')],
  flowLog: ['2026-11-09', '2026-11-11', '2026-11-14'].map((d) => ({ id: `test_ws_m${d}`, actId: 'meditation', day: d, at: `${d}T07:05:00+01:00`, n: 1, min: 15 })),
  settings: [{ key: 'outdoor', value: { name: 'Outdoors', goalMin: 90, from: '2026-11-05', until: '2026-12-31', hand: { '2026-11-10': [30] }, stopped: false, closed: false, no: null } }],
};

async function open(page, context, data) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(SUNDAY) });
  await page.goto('./#/');
  await ready(page);
  await put(page, data);
  await page.reload();
  await ready(page);
}

test('the week card names Outdoors days and meditation days of the finished week', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context, rows);
  const card = page.locator('[data-section="week-card"]');
  await expect(card).toBeVisible();
  const line = card.locator('[data-wk-stand]');
  await expect(line.locator('[data-wk-stand-out]')).toHaveText(T('Outdoors on {n} of {m} days', { n: 3, m: 7 }));
  await expect(line.locator('[data-wk-stand-med]')).toHaveText(T('Meditation on {n} days', { n: 3 }));
  if (process.env.SHOTS) {
    await page.waitForTimeout(1200);
    await card.scrollIntoViewIfNeeded();
    await line.evaluate((el) => (el.style.outline = '3px solid #f08a24'));
    await page.screenshot({ path: `${process.env.SHOTS}/wochenstand-${info.project.name === 'phone' ? 390 : 1440}.png` });
  }
  expect(errors).toEqual([]);
});

test('without a challenge and without meditation the line is not there', async ({ page, context }) => {
  await open(page, context, { activities: rows.activities });
  await expect(page.locator('[data-section="week-card"]')).toBeVisible();
  await expect(page.locator('[data-wk-stand]')).toHaveCount(0);
});
