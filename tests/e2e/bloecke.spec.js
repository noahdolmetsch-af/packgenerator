// «Block-Knöpfe» (Noah 21.11.2026 «a»): on «Geschafft» the duration comes in blocks of the sport (sauna 12 min, running indoors 10 min,
// any sport you set); the button of the last choice is marked. Fictional data only; the clock stands on Friday 9 October 2026;
// German UI, phone + desktop. SHOTS=<folder> saves pictures (Handy 390 / Computer 1440).
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
const tick = (id, actId) => ({ id, actId, day: TODAY, at: `${TODAY}T18:30:00+02:00`, n: 1 });
const goTo = async (page, id) => {
  await page.goto(`./#/flow/geschafft?e=${id}`);
  await page.reload();
  await ready(page);
};
const minOf = (page, id) => page.evaluate(async (id) => {
  const db = await new Promise((res) => { const r = indexedDB.open('pack-generator'); r.onsuccess = () => res(r.result); });
  const row = await new Promise((res) => { const r = db.transaction('flowLog').objectStore('flowLog').get(id); r.onsuccess = () => res(r.result); });
  db.close();
  return row?.min ?? null;
}, id);

test('sauna shows blocks of 12 minutes; a tap saves the minutes, the same tap takes it back, the last choice is marked', async ({ page, context }, info) => {
  const errors = await open(page, context, { flowLog: [tick('b-sauna', 'sauna')] });
  await goTo(page, 'b-sauna');
  const row = page.locator('[data-geschafft-blocks]');
  await expect(row.locator('[data-block]')).toHaveCount(4);
  await expect(row.locator('[data-block="1"]')).toHaveText(T('{n} × {size} min').replace('{n}', '1').replace('{size}', '12'));
  await expect(row.locator('[data-block].usual')).toHaveCount(1);
  await expect(row.locator('[data-block="1"]')).toHaveClass(/usual/); // the standard of the sauna is one block
  await shot(page, info, 'bloecke-sauna');
  await press(row.locator('[data-block="3"]'), info);
  await expect(row.locator('[data-block="3"]')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => minOf(page, 'b-sauna')).toBe(36);
  await press(row.locator('[data-block="3"]'), info); // the same button again takes it back
  await expect(row.locator('[data-block="3"]')).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => minOf(page, 'b-sauna')).toBe(null);
  await expect(row.locator('[data-block="3"]')).toHaveClass(/usual/); // the last choice is marked
  await shot(page, info, 'bloecke-sauna-gemerkt');
  expect(errors).toEqual([]);
});

test('running indoors shows blocks of 10 minutes with two marked at first', async ({ page, context }, info) => {
  const errors = await open(page, context, { flowActs: [{ id: 'laufen-indoor', name: 'Running indoors', nameDe: 'Laufen indoor', icon: 'run', ring: 'move', order: 99, goals: [] }], flowLog: [tick('b-ind', 'laufen-indoor')] });
  await goTo(page, 'b-ind');
  const row = page.locator('[data-geschafft-blocks]');
  await expect(row.locator('[data-block="2"]')).toHaveText(T('{n} × {size} min').replace('{n}', '2').replace('{size}', '10'));
  await expect(row.locator('[data-block="2"]')).toHaveClass(/usual/);
  await press(row.locator('[data-block="2"]'), info);
  await expect.poll(() => minOf(page, 'b-ind')).toBe(20);
  expect(errors).toEqual([]);
});

test('any sport can get blocks: tennis has the usual chips and «In Blöcken» sets a block, with Undo', async ({ page, context }, info) => {
  const errors = await open(page, context, { flowLog: [tick('b-tennis', 'tennis')] });
  await goTo(page, 'b-tennis');
  await expect(page.locator('[data-geschafft-blocks]')).toHaveCount(0);
  await expect(page.locator('[data-geschafft-mins] [data-min]')).toHaveCount(4);
  await press(page.locator('[data-geschafft-size]'), info);
  const edit = page.locator('[data-geschafft-sizing]');
  await expect(edit).toBeVisible();
  await edit.locator('[data-block-size]').fill('30');
  await shot(page, info, 'bloecke-einstellen');
  await press(edit.locator('[data-block-save]'), info);
  const row = page.locator('[data-geschafft-blocks]');
  await expect(row.locator('[data-block="2"]')).toHaveText(T('{n} × {size} min').replace('{n}', '2').replace('{size}', '30'));
  await press(row.locator('[data-block="2"]'), info);
  await expect.poll(() => minOf(page, 'b-tennis')).toBe(60);
  expect(errors).toEqual([]);
});
