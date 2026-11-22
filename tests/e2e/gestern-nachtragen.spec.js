// «Gestern nachtragen» (Noah 19.11.2026 «1-5a», 21.11.2026 «bitte hiermit fortfahren», Thread «Training erfassen vereinfachen»):
// the tick window («•••» on a tile of Aktiv) has «Wann»: today, yesterday, the day before, «Anderer Tag» (a date, up to a year back)
// and an optional time. The entry counts on that day (Geschafft, the history); nothing is ticked for today by it.
// Fictional data only (the start activities); the clock stands on Tuesday 10 November 2026, 09:00 in Europe/Zurich; German UI, phone + desktop.
// SHOTS=<folder> saves pictures (Handy 390 / Computer 1440).
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const SHOTS = process.env.SHOTS || '';

async function open(page, context, hash = './#/flow') {
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
const save = (sh) => sh.locator('.acts .btn.hi');
const chip = (sh, name) => sh.getByRole('button', { name, exact: true });

test('«Wann» starts on today; «Gestern» ticks the entry for yesterday and says so', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const sh = await sheet(page);
  await expect(sh.locator('#tick-when')).toHaveText(T('When'));
  await expect(chip(sh, T('Today|day'))).toHaveAttribute('aria-pressed', 'true');
  await expect(sh.locator('[data-when-note]')).toHaveCount(0); // today needs no explanation
  await shot(page, info, 'gestern-blatt-heute');
  await chip(sh, T('Yesterday|day')).click();
  await expect(chip(sh, T('Yesterday|day'))).toHaveAttribute('aria-pressed', 'true');
  await expect(sh.locator('[data-when-note]')).toContainText('Montag, 9. November');
  await shot(page, info, 'gestern-blatt-gestern');
  await save(sh).click();
  await expect(sh).toBeHidden();
  const log = await read(page, 'flowLog');
  expect(log).toHaveLength(1);
  expect(log[0]).toMatchObject({ actId: 'yoga', day: '2026-11-09' });
  // the message names the day; «Geschafft» shows the day of the entry, not today
  await expect(page.locator('.ftoast')).toContainText(T('yesterday'));
  await page.locator('.ftoast a').first().click();
  await expect(page).toHaveURL(/#\/flow\/geschafft\?e=/);
  await expect(page.locator('[data-geschafft-head]')).toContainText('Montag');
  await shot(page, info, 'gestern-geschafft');
  expect(errors).toEqual([]);
});

test('«Anderer Tag» with a date and a time; the entry sits on that day at that time', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const sh = await sheet(page);
  await chip(sh, T('Other day')).click();
  await expect(save(sh)).toBeDisabled(); // no day yet
  await sh.locator('[data-when-day]').fill('2026-11-02');
  await sh.locator('[data-when-time]').fill('07:30');
  await expect(sh.locator('[data-when-note]')).toContainText('Montag, 2. November');
  await shot(page, info, 'gestern-anderer-tag');
  await expect(save(sh)).toBeEnabled();
  await save(sh).click();
  await expect(sh).toBeHidden();
  const log = await read(page, 'flowLog');
  expect(log).toHaveLength(1);
  expect(log[0]).toMatchObject({ actId: 'yoga', day: '2026-11-02' });
  const hm = await page.evaluate((at) => `${String(new Date(at).getHours()).padStart(2, '0')}:${String(new Date(at).getMinutes()).padStart(2, '0')}`, log[0].at);
  expect(hm).toBe('07:30');
  expect(errors).toEqual([]);
});

test('a day in the future or more than a year back cannot be ticked; «Rückgängig» takes the entry back', async ({ page, context }) => {
  const errors = await open(page, context);
  const sh = await sheet(page);
  await chip(sh, T('Other day')).click();
  const field = sh.locator('[data-when-day]');
  await field.evaluate((el) => { el.removeAttribute('min'); el.removeAttribute('max'); }); // the browser would stop the typing before the app does
  await field.fill('2026-12-24');
  await expect(sh.getByRole('alert')).toContainText(T('Pick a day from the last year, up to today.'));
  await expect(save(sh)).toBeDisabled();
  await field.fill('2025-01-01');
  await expect(save(sh)).toBeDisabled();
  await chip(sh, T('Yesterday|day')).click();
  await expect(save(sh)).toBeEnabled();
  await save(sh).click();
  await expect.poll(async () => (await read(page, 'flowLog')).length).toBe(1);
  await page.locator('.ftoast .undo').first().click();
  await expect.poll(async () => (await read(page, 'flowLog')).length).toBe(0);
  expect(errors).toEqual([]);
});

test('today with a time keeps working as before: the entry counts today, a future time is «now»', async ({ page, context }) => {
  const errors = await open(page, context);
  const sh = await sheet(page);
  await sh.locator('[data-when-time]').fill('23:00'); // later than the clock (09:00)
  await save(sh).click();
  await expect(sh).toBeHidden();
  const log = await read(page, 'flowLog');
  expect(log).toHaveLength(1);
  expect(log[0].day).toBe('2026-11-10');
  expect(Date.parse(log[0].at)).toBeLessThanOrEqual(Date.parse('2026-11-10T09:00:00+01:00') + 1000);
  expect(errors).toEqual([]);
});

test('the tick window has «Eigene Dauer» next to its duration buttons; it goes together with another day', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const sh = await sheet(page);
  await chip(sh, T('Yesterday|day')).click();
  await sh.locator('[data-own-min-input]').fill('75');
  await sh.locator('[data-own-min-set]').click();
  await expect(chip(sh, '30')).toHaveAttribute('aria-pressed', 'false');
  await shot(page, info, 'gestern-eigene-dauer');
  await save(sh).click();
  await expect(sh).toBeHidden();
  const log = await read(page, 'flowLog');
  expect(log[0]).toMatchObject({ actId: 'yoga', day: '2026-11-09', min: 75 });
  expect(errors).toEqual([]);
});
