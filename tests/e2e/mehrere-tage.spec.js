// «Mehrere Tage in einem Rutsch» (Noah 21.11.2026, Thread «Training erfassen vereinfachen»):
// in the tick window, «Mehrere Tage in einem Rutsch» lets several days be switched on; one tap ticks off the same activity
// for each of them, every entry on its own day; one «Rückgängig» takes all of them back.
// Fictional data only; the clock stands on Tuesday 10 November 2026, 09:00 in Europe/Zurich; German UI, phone + desktop.
// SHOTS=<folder> saves pictures (Handy 390 / Computer 1440).
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const SHOTS = process.env.SHOTS || '';

async function open(page, context) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.setFixedTime(new Date('2026-11-10T09:00:00+01:00'));
  await page.goto('./#/flow');
  await ready(page);
  return errors;
}
async function shot(page, info, name) {
  if (!SHOTS) return;
  const w = info.project.name === 'phone' ? 390 : 1440;
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${SHOTS}/${name}-${w}.png` });
}
const read = (page, store) =>
  page.evaluate(
    (s) =>
      new Promise((ok) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const q = r.result.transaction(s).objectStore(s).getAll();
          q.onsuccess = () => (r.result.close(), ok(q.result));
        };
      }),
    store,
  );
async function sheet(page) {
  await page.locator('section[aria-labelledby="tick-h"] [data-more="yoga"]').click();
  const sh = page.locator('dialog.aksheet');
  await expect(sh).toBeVisible();
  return sh;
}

test('several days: one tap ticks each picked day on its own day, one undo takes all back', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const sh = await sheet(page);
  await sh.locator('[data-multi]').click();
  await expect(sh.locator('[data-multi]')).toHaveText(T('Only one day'));
  await expect(sh.locator('[data-day="2026-11-10"]')).toHaveAttribute('aria-pressed', 'true'); // today stays on from before
  await sh.locator('[data-day="2026-11-10"]').click(); // switch it off
  await sh.locator('[data-day="2026-11-09"]').click(); // yesterday
  await sh.locator('[data-day="2026-11-08"]').click(); // the day before
  await expect(sh.locator('[data-when-note]')).toContainText('2 Tage');
  await shot(page, info, 'mehrere-tage-blatt');
  await sh.locator('.acts .btn.hi').click();
  await expect(sh).toBeHidden();
  await expect.poll(async () => (await read(page, 'flowLog')).length).toBe(2);
  const log = await read(page, 'flowLog');
  expect(log.map((e) => e.day).sort()).toEqual(['2026-11-08', '2026-11-09']);
  expect(new Set(log.map((e) => e.actId)).size).toBe(1);
  await shot(page, info, 'mehrere-tage-gemeldet');
  await page.getByRole('button', { name: T('Undo'), exact: true }).first().click();
  await expect.poll(async () => (await read(page, 'flowLog')).length).toBe(0);
  expect(errors).toEqual([]);
});

test('several days: today plus yesterday, and «Anderer Tag» with a bad date blocks saving', async ({ page, context }) => {
  const errors = await open(page, context);
  const sh = await sheet(page);
  await sh.locator('[data-multi]').click();
  await sh.locator('[data-day="2026-11-09"]').click(); // today is already on
  await sh.locator('[data-day="other"]').click();
  await sh.locator('[data-when-day]').fill('2026-11-11'); // tomorrow: no day
  await expect(sh.locator('.acts .btn.hi')).toBeDisabled();
  await sh.locator('[data-when-day]').fill('2026-11-05');
  await expect(sh.locator('.acts .btn.hi')).toBeEnabled();
  await sh.locator('[data-day="other"]').click(); // switch the other day off again
  await sh.locator('.acts .btn.hi').click();
  await expect.poll(async () => (await read(page, 'flowLog')).length).toBe(2);
  const log = await read(page, 'flowLog');
  expect(log.map((e) => e.day).sort()).toEqual(['2026-11-09', '2026-11-10']);
  expect(errors).toEqual([]);
});

test('several days: back to «Nur ein Tag» keeps one day and ticks one entry', async ({ page, context }) => {
  const errors = await open(page, context);
  const sh = await sheet(page);
  await sh.locator('[data-multi]').click();
  await sh.locator('[data-day="2026-11-10"]').click(); // today off
  await sh.locator('[data-day="2026-11-09"]').click();
  await sh.locator('[data-multi]').click();
  await expect(sh.locator('[data-multi]')).toHaveText(T('Several days in one go'));
  await sh.locator('.acts .btn.hi').click();
  await expect.poll(async () => (await read(page, 'flowLog')).length).toBe(1);
  expect((await read(page, 'flowLog'))[0].day).toBe('2026-11-09');
  expect(errors).toEqual([]);
});
