// «Plan zuerst» (Noah 19.11.2026 «1-5a», 21.11.2026 «a», Thread «Training erfassen vereinfachen», T4): «Erledigt» on a unit of the weekly plan
// (the line «Jetzt dran» on Heute, the tick on the weekly plan) opens a short sheet: the duration preselected from the plan, the feeling
// optional, «Speichern»; then «Geschafft». The unit counts as a normal tick (an entry in the history on the sport it belongs to).
// Fictional data only; the clock stands on Tuesday 10 November 2026, 09:00 in Europe/Zurich; German UI, phone + desktop.
// SHOTS=<folder> saves pictures (Handy 390 / Computer 1440).
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';
import { flowSeeded } from './wall-fixture.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const SHOTS = process.env.SHOTS || '';

async function open(page, context, hash = './#/flow/wochenplan') {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.setFixedTime(new Date('2026-11-10T09:00:00+01:00'));
  await page.goto(hash);
  await ready(page);
  return errors;
}
async function shot(page, info, name) {
  if (!SHOTS) return;
  const w = info.project.name === 'phone' ? 390 : 1440;
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${SHOTS}/${name}-${w}.png` });
}
const start = async (page) => {
  await page.locator('[data-wochenplan] [data-empty] button').first().click();
  await expect(page.locator('[data-wp-hvalue]')).toHaveText('15 Std');
  await flowSeeded(page);
};
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
const weeklog = async (page) => (await read(page, 'settings')).find((x) => x.key === 'training.weeklog')?.value?.weeks?.['2026-11-09']?.done ?? {};

test('the sheet: duration from the plan, feeling, Save ticks the unit in the plan and in the history, «Geschafft» opens', async ({ page, context }, info) => {
  const errors = await open(page, context);
  await start(page);
  await page.locator('[data-wochenplan] [data-wp-tick="tennis@1"]').click();
  const sheet = page.locator('[data-unit-sheet]');
  await expect(sheet).toBeVisible();
  await expect(sheet).toContainText(T('Done: {what}').replace('{what}', T('Tennis')));
  await expect(sheet.locator('[data-unit-act]')).toHaveCount(0); // nothing remembered yet: the sports are offered
  await expect(sheet.getByRole('button', { name: T('{n} min planned').replace('{n}', '60') })).toHaveAttribute('aria-pressed', 'true');
  await sheet.getByRole('button', { name: T('good|feel') }).click();
  await shot(page, info, 'plan-zuerst-blatt');
  await sheet.locator('[data-unit-save]').click();
  await expect(page).toHaveURL(/#\/flow\/geschafft\?e=/);
  const pg = page.locator('[data-geschafft]');
  await expect(pg.locator('[data-geschafft-head]')).toContainText('Tennis');
  await expect(pg.locator('[data-geschafft-head]')).toContainText(/60 Min/);
  await expect(pg.locator('[data-geschafft-source]')).toContainText(T('from your plan'));
  await shot(page, info, 'plan-zuerst-geschafft');
  const log = await read(page, 'flowLog');
  expect(log).toHaveLength(1);
  expect(log[0]).toMatchObject({ via: 'plan', unit: 'tennis@1', min: 60, feel: 'good' });
  expect(Object.keys(await weeklog(page))).toEqual(['tennis@1']);
  expect(errors).toEqual([]);
});

test('the sport is asked once and kept: the next time it shows as a line, «Ändern» opens the choice', async ({ page, context }) => {
  const errors = await open(page, context);
  await start(page);
  await page.locator('[data-wochenplan] [data-wp-tick="tennis@1"]').click();
  await page.locator('[data-unit-sheet] [data-unit-save]').click();
  await expect(page).toHaveURL(/#\/flow\/geschafft\?e=/);
  await page.locator('[data-geschafft-undo]').click(); // the answer stays, the tick goes
  await expect(page).toHaveURL(/#\/flow$/);
  await expect.poll(async () => ((await read(page, 'flowLog')).length === 0 && Object.keys(await weeklog(page)).length === 0)).toBe(true);
  await page.goto('./#/flow/wochenplan');
  await ready(page);
  await page.locator('[data-wochenplan] [data-wp-tick="tennis@1"]').click();
  const sheet = page.locator('[data-unit-sheet]');
  await expect(sheet.locator('[data-unit-act]')).toContainText(T('Counts for: {sport}').replace('{sport}', ''));
  await sheet.locator('[data-unit-change]').click();
  await expect(sheet.getByRole('button', { name: T('Only in the plan') })).toBeVisible();
  expect(errors).toEqual([]);
});

test('«Nur im Plan» ticks the unit in the plan without an entry in the history, and the sheet can be cancelled', async ({ page, context }) => {
  const errors = await open(page, context);
  await start(page);
  const tick = page.locator('[data-wochenplan] [data-wp-tick="tennis@1"]');
  await tick.click();
  await page.locator('[data-unit-sheet]').getByRole('button', { name: T('Cancel') }).click();
  await expect(page.locator('[data-unit-sheet]')).toBeHidden();
  await expect(tick).not.toBeChecked();
  expect(await weeklog(page)).toEqual({});
  await tick.click();
  await page.locator('[data-unit-sheet]').getByRole('button', { name: T('Only in the plan') }).click();
  await page.locator('[data-unit-sheet] [data-unit-save]').click();
  await expect(tick).toBeChecked();
  expect(Object.keys(await weeklog(page))).toEqual(['tennis@1']);
  expect(await read(page, 'flowLog')).toHaveLength(0);
  expect(errors).toEqual([]);
});

test('taking the tick of a unit back on the plan also takes it out of the history; «Rückgängig» on «Geschafft» takes both back', async ({ page, context }) => {
  const errors = await open(page, context);
  await start(page);
  await page.locator('[data-wochenplan] [data-wp-tick="tennis@1"]').click();
  await page.locator('[data-unit-sheet] [data-unit-save]').click();
  await expect(page).toHaveURL(/#\/flow\/geschafft\?e=/);
  expect(await read(page, 'flowLog')).toHaveLength(1);
  // «Rückgängig» on the page
  await page.locator('[data-geschafft-undo]').click();
  await expect(page).toHaveURL(/#\/flow$/);
  expect(await read(page, 'flowLog')).toHaveLength(0);
  expect(await weeklog(page)).toEqual({});
  // again, and now taken back on the plan page
  await page.goto('./#/flow/wochenplan');
  await ready(page);
  await page.locator('[data-wochenplan] [data-wp-tick="tennis@1"]').click();
  await page.locator('[data-unit-sheet] [data-unit-save]').click();
  await expect(page).toHaveURL(/#\/flow\/geschafft\?e=/);
  await page.goto('./#/flow/wochenplan');
  await ready(page);
  await page.locator('[data-wochenplan] [data-wp-tick="tennis@1"]').uncheck();
  await expect.poll(async () => (await read(page, 'flowLog')).length).toBe(0);
  expect(errors).toEqual([]);
});

test('on Heute «Erledigt ✓» opens the sheet too, and the small daily habits tick at once', async ({ page, context }, info) => {
  const errors = await open(page, context);
  await start(page);
  await page.goto('./#/');
  await ready(page);
  const row = page.locator('[data-row="plan"]');
  await shot(page, info, 'plan-zuerst-heute');
  await row.getByRole('button', { name: T('Done ✓') }).click();
  await expect(page.locator('[data-unit-sheet]')).toBeVisible();
  await page.locator('[data-unit-sheet] [data-unit-save]').click();
  await expect(page).toHaveURL(/#\/flow\/geschafft\?e=/);
  expect(errors).toEqual([]);
});
