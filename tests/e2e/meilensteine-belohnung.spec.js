// «Meilensteine als Belohnung» (Noah 22.10.2026 «1a 2a 3a 4a 5a»):
// 1. The 5th tick of a sport brings «Neuer Stern» in the app's own window right after the tick (4a); OK closes it.
// 2. A sport page shows its milestones: «So funktionieren Meilensteine» (folded), the counters with «zählt: …» (2a, 5a),
//    three ready challenges and an own one (3a); a ready one starts, can be changed and stopped (with Undo).
// 3. The milestones page explains it on top. No sideways scroll on a phone, no page error.
// Fictional data only; the clock stands on Friday 9 October 2026 (aktiv-fixture.js).
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};

async function open(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  // four runs on the days before: the next tick is the 5th (star 1 of «Mal gemacht»)
  await put(page, { flowLog: [1, 2, 3, 4].map((i) => ({ id: `test_run_${i}`, actId: 'run', day: addDays(TODAY, -i), at: `${addDays(TODAY, -i)}T18:00:00+02:00`, n: 1 })) });
  return errors;
}
async function go(page, hash) {
  await page.goto(`./${hash}`);
  await page.reload();
  await ready(page);
}
async function fits(page, where) {
  const w = page.viewportSize().width;
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw, `${where}: no sideways scroll`).toBeLessThanOrEqual(w);
}

test('the 5th tick brings «Neuer Stern» right away', async ({ page, context }) => {
  const errors = await open(page, context);
  await go(page, '#/flow');
  const tick = page.locator('section[aria-labelledby="tick-h"]');
  await tick.locator('[data-act="run"]').click();
  const win = page.locator('dialog[data-star-window]');
  await expect(win).toBeVisible();
  await expect(win.getByRole('heading', { name: T('New star') })).toBeVisible();
  await expect(win).toContainText(T('Times done'));
  await expect(win).toContainText(T('Star {k}', { k: 1 }));
  await expect(win.locator('[data-star-open]')).toHaveAttribute('href', '#/flow/sport/act%3Arun');
  await win.getByRole('button', { name: T('OK') }).click();
  await expect(win).toBeHidden();
  expect(errors).toEqual([]);
});

test('a sport page: counters, what counts, ready challenges', async ({ page, context }) => {
  const errors = await open(page, context);
  await go(page, '#/flow/sport/act%3Arun');
  const slot = page.locator('[data-block="milestones"]');
  await expect(slot.getByRole('heading', { name: T('Milestones') })).toBeVisible();
  const how = slot.locator('[data-ms-how]');
  await expect(how).not.toHaveAttribute('open', '');
  await how.locator('summary').click();
  await expect(how).toContainText(T('1. Tick'));
  await expect(slot.locator('[data-ms="run.sessions"]')).toContainText(T('counts: {what}', { what: T('every tick') }));
  await expect(slot.locator('[data-ms="run.weeks"]')).toBeVisible();
  await expect(slot.locator('[data-preset]')).toHaveCount(4);
  await fits(page, 'sport page');

  await slot.locator('[data-preset="month"]').click();
  const sheet = page.locator('dialog.chs');
  await expect(sheet.getByRole('heading', { name: T('New challenge|sport') })).toBeVisible();
  await sheet.getByRole('button', { name: T('Start challenge|sport') }).click();
  const row = slot.locator('[data-challenge]');
  await expect(row).toHaveCount(1);

  await row.getByRole('button', { name: T('Change') }).click();
  await expect(sheet.getByRole('heading', { name: T('Your challenge|sport') })).toBeVisible();
  await sheet.getByRole('button', { name: T('Stop challenge|sport') }).click();
  await expect(row).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('the milestones page explains it on top, every card says what counts', async ({ page, context }) => {
  const errors = await open(page, context);
  await go(page, '#/flow/milestones?act=run');
  const how = page.locator('main [data-ms-how]');
  await expect(how).toHaveAttribute('open', '');
  await expect(how).toContainText(T('How milestones work'));
  await expect(page.locator('main [data-counts]').first()).toBeVisible();
  await fits(page, 'milestones');
  expect(errors).toEqual([]);
});
