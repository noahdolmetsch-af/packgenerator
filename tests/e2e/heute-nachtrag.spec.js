// «Heute · Gestern» (Noah 22.11.2026 «b», Thread «Training erfassen vereinfachen»): the morning hint «Gestern nichts abgehakt? Nachtragen»
// (so far only on Aktiv) also stands at the top of «Heute dran» on Heute, before noon. Nothing on Heute falls away.
// Fictional data only (the start activities); the clock stands on Tuesday 10 November 2026, 09:00 in Europe/Zurich; German UI, phone + desktop.
// SHOTS=<folder> saves pictures (Handy 390 / Computer 1440).
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const SHOTS = process.env.SHOTS || '';

async function open(page, context, at = '2026-11-10T09:00:00+01:00') {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.setFixedTime(new Date(at));
  await page.goto('./#/flow');
  await ready(page);
  return errors;
}
async function shot(page, info, name) {
  if (!SHOTS) return;
  const w = info.project.name === 'phone' ? 390 : 1440;
  await page.locator('[data-nachtrag]').first().evaluate((el) => el.scrollIntoView({ block: 'center' })).catch(() => {});
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
// one tick of «Yoga» three days ago, made through the tick window itself; then Heute
async function tickThreeDaysAgo(page) {
  await page.locator('section[aria-labelledby="tick-h"] [data-more="yoga"]').click();
  const sh = page.locator('dialog.aksheet');
  await expect(sh).toBeVisible();
  await sh.getByRole('button', { name: T('Other day'), exact: true }).click();
  await sh.locator('[data-when-day]').fill('2026-11-07');
  await sh.locator('.acts .btn.hi').click();
  await expect(sh).toBeHidden();
  await expect.poll(async () => (await read(page, 'flowLog')).length).toBe(1);
  await page.reload();
  await ready(page);
  await page.goto('./#/');
  await ready(page);
}

test('before noon Heute asks «Gestern nichts abgehakt? Nachtragen»; a tap opens the tick window on «Gestern»', async ({ page, context }, info) => {
  const errors = await open(page, context);
  await tickThreeDaysAgo(page);
  const hint = page.locator('[data-section="today"] [data-nachtrag]');
  await expect(hint).toBeVisible();
  await expect(hint.locator('[data-nachtrag-title]')).toHaveText(T('Yesterday nothing ticked off? Add it.'));
  await expect(page.locator('#imp-h')).toBeVisible(); // «Jetzt dran» stays where it was
  await shot(page, info, 'heute-nachtrag');
  await hint.locator('[data-nachtrag-open]').click();
  await shot(page, info, 'heute-nachtrag-offen');
  await hint.locator('[data-nachtrag-act="yoga"]').click();
  const sh = page.locator('dialog.aksheet');
  await expect(sh).toBeVisible();
  await expect(sh.getByRole('button', { name: T('Yesterday|day'), exact: true })).toHaveAttribute('aria-pressed', 'true');
  await sh.locator('.acts .btn.hi').click();
  await expect(sh).toBeHidden();
  await expect(hint).toHaveCount(0); // yesterday has a tick now
  expect((await read(page, 'flowLog')).map((e) => e.day).sort()).toEqual(['2026-11-07', '2026-11-09']);
  expect(errors).toEqual([]);
});

test('«Nicht heute» hides it on Heute and on Aktiv; after noon it is not there at all', async ({ page, context }) => {
  const errors = await open(page, context);
  await tickThreeDaysAgo(page);
  const hint = page.locator('[data-nachtrag]');
  await expect(hint).toBeVisible();
  await hint.locator('[data-nachtrag-no]').click();
  await expect(hint).toHaveCount(0);
  await page.goto('./#/flow');
  await ready(page);
  await expect(hint).toHaveCount(0); // the same device note as on Aktiv
  expect(errors).toEqual([]);
});

test('after noon Heute shows no hint', async ({ page, context }) => {
  const errors = await open(page, context, '2026-11-10T14:00:00+01:00');
  await tickThreeDaysAgo(page);
  await expect(page.locator('#imp-h')).toBeVisible();
  await expect(page.locator('[data-nachtrag]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
