// «Dauer nachtragen» (Noah 21.11.2026, S12): ticks without a measured time are listed; a tap writes the minutes, Undo takes them back. Fictional data only;
// the clock stands on Friday 9 October 2026; German UI, phone + desktop. SHOTS=<folder> saves pictures (Handy 390 / Computer 1440).
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, put } from './aktiv-fixture.js';
import { flowSeeded } from './wall-fixture.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const press = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());
const SHOTS = process.env.SHOTS || '';

async function open(page, context, rows) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  await page.goto('./#/flow');
  await ready(page);
  await flowSeeded(page);
  await put(page, rows);
  await page.goto('./#/flow/sports');
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
const act = (id, name, order) => ({ id, name, ring: 'move', icon: 'heart', order, goals: [] });
const tick = (id, actId, day, min) => ({ id, actId, day, at: `${day}T18:30:00+02:00`, n: 1, ...(min ? { min } : {}) });
const minOf = (page, id) => page.evaluate(async (id) => {
  const db = await new Promise((res) => { const r = indexedDB.open('pack-generator'); r.onsuccess = () => res(r.result); });
  const row = await new Promise((res) => { const r = db.transaction('flowLog').objectStore('flowLog').get(id); r.onsuccess = () => res(r.result); });
  db.close();
  return row?.min ?? null;
}, id);
const FIX = { flowActs: [act('zz-y', 'Fiktiv-Yoga', 90)], flowLog: [tick('zz-1', 'zz-y', '2026-10-05'), tick('zz-2', 'zz-y', '2026-10-07'), tick('zz-3', 'zz-y', '2026-10-08', 45)] };

test('ticks without a measured time are listed; a tap writes the minutes, a typed number works, Undo takes it back', async ({ page, context }, info) => {
  const errors = await open(page, context, FIX);
  const fold = page.locator('[data-nachtragen]');
  await expect(fold).toHaveCount(1);
  await fold.locator('summary').click();
  await expect(fold.locator('[data-nachtrag]')).toHaveCount(2); // the tick with 45 min is not offered
  await expect(fold.locator('[data-nachtrag]').first()).toHaveAttribute('data-nachtrag', 'zz-2'); // newest first
  await shot(page, info, 'nachtragen-liste');
  await press(fold.locator('[data-nachtrag="zz-2"] [data-nachtrag-min="30"]'), info);
  await expect.poll(() => minOf(page, 'zz-2')).toBe(30);
  await expect(fold.locator('[data-nachtrag]')).toHaveCount(1);
  await shot(page, info, 'nachtragen-danach');
  await press(page.locator('.rtoast').getByRole('button', { name: T('Undo') }), info);
  await expect.poll(() => minOf(page, 'zz-2')).toBe(null);
  await expect(fold.locator('[data-nachtrag]')).toHaveCount(2);
  // an own number
  const own = fold.locator('[data-nachtrag="zz-1"] [data-own-min-input]');
  await own.fill('75');
  await own.press('Enter');
  await expect.poll(() => minOf(page, 'zz-1')).toBe(75);
  expect(errors).toEqual([]);
});
