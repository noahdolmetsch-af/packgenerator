// «Zusammenlegen» (Noah 21.11.2026 «Ja, bauen», S8): two sports become one; the ticks go over, with Undo. Fictional data only;
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
// the open window is shown as the person sees it: the screen, not the whole page
async function shotView(page, info, name) {
  if (!SHOTS) return;
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
}
const act = (id, name, order) => ({ id, name, ring: 'move', icon: 'heart', order, goals: [] });
const tick = (id, actId, day = TODAY) => ({ id, actId, day, at: `${day}T18:30:00+02:00`, n: 1 });
const rowsOf = (page) => page.evaluate(async () => {
  const db = await new Promise((res) => { const r = indexedDB.open('pack-generator'); r.onsuccess = () => res(r.result); });
  const all = (store) => new Promise((res) => { const r = db.transaction(store).objectStore(store).getAll(); r.onsuccess = () => res(r.result); });
  const acts = (await all('flowActs')).map((a) => a.id);
  const log = Object.fromEntries((await all('flowLog')).map((e) => [e.id, e.actId]));
  db.close();
  return { acts, log };
});
const FIX = { flowActs: [act('zz-a', 'Krafttest', 90), act('zz-b', 'Krafttest', 91)], flowLog: [tick('zz-1', 'zz-a', '2026-10-07'), tick('zz-2', 'zz-b', '2026-10-08'), tick('zz-3', 'zz-b')] };

test('two sports with the same name: «Merge» moves the ticks, the first sport leaves, Undo brings everything back', async ({ page, context }, info) => {
  const errors = await open(page, context, FIX);
  const hint = page.locator('[data-similar]');
  await expect(hint).toHaveCount(1);
  await shot(page, info, 'zusammen-hinweis');
  await press(hint.locator('[data-similar-merge]'), info);
  const sheet = page.locator('[data-merge-sheet]');
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('[data-merge-to="zz-a"]')).toBeChecked(); // the first one of the pair stays
  await expect(sheet.locator('[data-merge-counts]')).toContainText('2'); // the 2 ticks of the second sport
  await shotView(page, info, 'zusammen-fenster');
  await press(sheet.locator('[data-merge-go]'), info);
  await expect(sheet).toBeHidden();
  await expect.poll(async () => (await rowsOf(page)).acts.filter((id) => id.startsWith('zz-'))).toEqual(['zz-a']);
  expect(await rowsOf(page).then((r) => ['zz-1', 'zz-2', 'zz-3'].map((id) => r.log[id]))).toEqual(['zz-a', 'zz-a', 'zz-a']);
  await expect(page.locator('[data-row="zz-b"]')).toHaveCount(0);
  await expect(page.locator('[data-similar]')).toHaveCount(0);
  await shot(page, info, 'zusammen-danach');
  await press(page.locator('.rtoast').getByRole('button', { name: T('Undo') }), info);
  await expect.poll(async () => (await rowsOf(page)).acts.filter((id) => id.startsWith('zz-')).sort()).toEqual(['zz-a', 'zz-b']);
  expect(await rowsOf(page).then((r) => ['zz-1', 'zz-2', 'zz-3'].map((id) => r.log[id]))).toEqual(['zz-a', 'zz-b', 'zz-b']);
  expect(errors).toEqual([]);
});

test('the menu of a sport and the editor can merge too, with another sport of your choice', async ({ page, context }, info) => {
  const errors = await open(page, context, { flowActs: [act('zz-c', 'Eishockey spielen', 90), act('zz-d', 'Eishockey Match', 91)], flowLog: [tick('zz-4', 'zz-d')] });
  // the editor: «Pause or delete» › «Merge with another sport»
  await page.goto('./#/flow/edit/zz-d');
  await ready(page);
  await page.locator('details', { hasText: T('Pause or delete') }).locator('summary').click();
  await press(page.locator('[data-act-merge]'), info);
  const sheet = page.locator('[data-merge-sheet]');
  await expect(sheet).toBeVisible();
  await sheet.locator('[data-merge-to="zz-c"]').check();
  await press(sheet.locator('[data-merge-go]'), info);
  await expect.poll(async () => (await rowsOf(page)).log['zz-4']).toBe('zz-c');
  expect((await rowsOf(page)).acts).not.toContain('zz-d');
  expect(errors).toEqual([]);
});
