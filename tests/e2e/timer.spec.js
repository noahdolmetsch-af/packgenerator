// «Timer» (mockups Z1–Z5, Noah 13.10.2026 «1-5a», approved «ME1-ME3 und Z1-Z5 freigeben»), on a phone and a
// computer, in German, with a fixed clock (page.clock):
// 1. Heute › Timer: five kinds, a time typed in words starts it, Pause and Weiter, the timer floats on
//    other pages, at the end «Fertig» with the entry in the log already, a note is added («Ins Logbuch»).
// 2. Zifferblatt (Z3): a face for all timers, its own face for the meditation (it sets the session clock
//    too), the sound at the end and the digits; kept after a reload.
// 3. Timer-Log (Z5): timers and meditation sessions by day, filter by kind, change a note, delete.
// No sideways scroll, no page errors. Fictional data only.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { MODES } from '../../src/lib/timer.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const TODAY = '2026-10-13'; // a Tuesday; the browser runs in Europe/Zurich
const D0 = `${TODAY}T09:00:00+02:00`;
/** Calendar-day arithmetic on YYYY-MM-DD (never «now + n × 24 h»). */
const addDays = (day, n) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

async function open(page, context, hash) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`./${hash}`);
  return errors;
}
const idb = (page, fn, arg) =>
  page.evaluate(
    async ([src, arg]) => {
      const db = await new Promise((res, rej) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
      // eslint-disable-next-line no-new-func
      const out = await new Function('db', 'arg', `return (${src})(db, arg)`)(db, arg);
      db.close();
      return out;
    },
    [fn.toString(), arg],
  );
const all = (page, table) =>
  idb(
    page,
    (db, table) =>
      new Promise((res) => {
        const q = db.transaction(table).objectStore(table).getAll();
        q.onsuccess = () => res(q.result);
      }),
    table,
  );
const put = (page, rows) =>
  idb(
    page,
    (db, rows) =>
      new Promise((res, rej) => {
        const tx = db.transaction(Object.keys(rows), 'readwrite');
        for (const [t, list] of Object.entries(rows)) for (const x of list) tx.objectStore(t).put(x);
        tx.oncomplete = res;
        tx.onerror = () => rej(tx.error);
      }),
    rows,
  );
async function fits(page, where) {
  const w = page.viewportSize().width;
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw, `${where}: no sideways scroll`).toBeLessThanOrEqual(w);
}

test('Timer: kinds, a typed time, pause, it floats on other pages, «Fertig» with a note in the log', async ({ page, context }) => {
  const errors = await open(page, context, '#/timer');
  const main = page.locator('main');
  await expect(main.getByRole('heading', { level: 1, name: T('Timer') })).toBeVisible();
  await expect(main.locator('[data-mode]')).toHaveCount(MODES.length);
  await expect(main.locator('[data-mode="down"]')).toHaveAttribute('aria-checked', 'true');
  await fits(page, 'Timer');

  // Pomodoro shows its numbers and the 25 / 5 chip
  await main.locator('[data-mode="pomodoro"]').click();
  await expect(main.getByRole('button', { name: '25 / 5' })).toHaveClass(/on/);
  await main.locator('[data-mode="down"]').click();

  // a time in words that cannot be read says so; «1 min» starts at once
  await main.locator('[data-typed]').fill('irgendwann');
  await main.locator('form.typed button[type="submit"]').click();
  await expect(main.getByRole('alert')).toBeVisible();
  await main.locator('[data-typed]').fill('1 min');
  await main.locator('form.typed button[type="submit"]').click();
  await expect(main.locator('[data-act="go"]')).toContainText(T('Pause'));
  await expect(main.locator('.clock [role="timer"]').first()).toHaveAttribute('aria-label', T('{time} on the timer', { time: '1:00' }));

  // pause and go on: the time does not run while paused
  await page.clock.runFor(10_000);
  await main.locator('[data-act="go"]').click();
  await expect(main.locator('.clock .line')).toHaveText(T('Paused'));
  await page.clock.runFor(30_000);
  await main.locator('[data-act="go"]').click();
  await expect(main.locator('[data-act="go"]')).toContainText(T('Pause'));

  // on another page the timer floats; a tap brings the timer page back
  await page.goto('./#/');
  await expect(page.locator('[data-timer-float]')).toBeVisible();
  await fits(page, 'Heute mit Timer');
  await page.locator('[data-timer-float] a').click();
  await expect(page).toHaveURL(/#\/timer$/);

  // the end: «Fertig», the entry is in the log already, a note is added
  await page.clock.runFor(52_000);
  const done = main.locator('[data-done]');
  await expect(done).toBeVisible();
  await expect(done.getByRole('heading')).toHaveText(T('Done: {time} {name}', { time: '1:00', name: T('Countdown') }));
  await expect.poll(async () => (await all(page, 'timerLog')).length).toBe(1);
  await done.getByRole('button', { name: T('calm'), exact: true }).click();
  await expect(done.locator('#tnote')).toHaveValue(T('calm'));
  await done.locator('[data-act="keep"]').click();
  await expect(done).toHaveCount(0);
  await expect.poll(async () => (await all(page, 'timerLog'))[0]?.note).toBe(T('calm'));
  const row = (await all(page, 'timerLog'))[0];
  expect(row).toMatchObject({ day: TODAY, sec: 60, mode: 'down' });
  await expect(main.locator('.rows li')).toHaveCount(1);
  await expect(main.locator('.rows li')).toContainText(T('calm'));
  await expect(main.locator('[data-act="reset"]')).toBeDisabled();
  await fits(page, 'Timer fertig');
  expect(errors).toEqual([]);
});

test('Zifferblatt: one face for all, its own for the meditation, the sound and the digits stay', async ({ page, context }) => {
  const errors = await open(page, context, '#/timer');
  const main = page.locator('main');
  await expect(main.locator('.clock [data-face="digital"]')).toBeVisible(); // Noah 3a: Digital first
  await main.locator('[data-to="faces"]').click();
  await expect(page).toHaveURL(/#\/timer\/faces$/);
  await expect(main.getByRole('heading', { level: 1, name: T('Face') })).toBeVisible();
  await expect(main.locator('[data-face-pick]')).toHaveCount(6);
  await expect(main.locator('[data-end="bowl"]')).toHaveAttribute('aria-checked', 'true'); // Noah 4a: the singing bowl
  await fits(page, 'Zifferblatt');

  await main.locator('[data-face-pick="ring"]').click();
  await expect(main.locator('[data-face-pick="ring"]')).toHaveAttribute('aria-checked', 'true');
  await main.locator('[data-fmt="auto"]').click();
  await main.locator('[data-end="silent"]').click();
  // only for the meditation: the moon, also the clock of the meditation session
  await main.locator('[data-scope="meditation"]').click();
  await expect(main.getByText(T('Not chosen yet: uses the face of all timers.'))).toBeVisible();
  await main.locator('[data-face-pick="moon"]').click();
  await expect.poll(async () => (await all(page, 'settings')).find((s) => s.key === 'flow.medClock')?.value?.view).toBe('moon');

  await page.reload();
  await expect(main.locator('[data-face-pick="ring"]')).toHaveAttribute('aria-checked', 'true');
  await expect(main.locator('[data-fmt="auto"]')).toHaveAttribute('aria-checked', 'true');
  await expect(main.locator('[data-end="silent"]')).toHaveAttribute('aria-checked', 'true');
  await page.goto('./#/timer');
  await expect(main.locator('.clock [data-face="ring"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('Timer-Log: timers and meditation by day, filter by kind, a note changed, a row deleted', async ({ page, context }) => {
  const errors = await open(page, context, '#/timer/log');
  const main = page.locator('main');
  await expect(main.getByRole('heading', { level: 1, name: T('Timer log') })).toBeVisible();
  await expect(main.getByText(T('Nothing in the log yet. Every timer comes in here by itself.'))).toBeVisible();
  const at = (day, hm) => new Date(`${day}T${hm}:00+02:00`).toISOString();
  const yesterday = addDays(TODAY, -1);
  await put(page, {
    timerLog: [
      { id: 'tl-test-1', day: TODAY, at: at(TODAY, '08:10'), sec: 240, mode: 'down', label: '', blockId: 'coffee', setup: { mode: 'down', sec: 240 }, note: '' },
      { id: 'tl-test-2', day: yesterday, at: at(yesterday, '14:00'), sec: 1500, mode: 'pomodoro', label: '', blockId: null, setup: { mode: 'pomodoro', work: 1500, rest: 300, rounds: 1 }, note: 'test_data_gtp_ Fokus' },
    ],
    flowLog: [{ id: 'fl-test-med', actId: 'meditation', day: yesterday, at: at(yesterday, '07:00'), min: 20 }],
  });
  await page.reload();
  await expect(main.locator('[data-row]')).toHaveCount(3);
  await expect(main.locator('[data-row="med:fl-test-med"]')).toContainText('Meditation');
  await expect(main.locator('.st4')).toContainText('3×');
  await fits(page, 'Timer-Log');

  await main.locator('[data-kind="pomodoro"]').click();
  await expect(main.locator('[data-row]')).toHaveCount(1);
  await expect(main.locator('[data-row]')).toContainText('test_data_gtp_ Fokus');
  await main.locator('[data-kind="all"]').click();

  await main.locator('[data-row="tl-test-1"] button').click();
  await main.locator('[data-row="tl-test-1"] input').fill('stark');
  await main.locator('[data-row="tl-test-1"] button[type="submit"]').click();
  await expect(main.locator('[data-row="tl-test-1"]')).toContainText('stark');
  await main.locator('[data-row="tl-test-2"] button').click();
  await main.locator('[data-row="tl-test-2"] [data-act="delete"]').click();
  await expect(main.locator('[data-row]')).toHaveCount(2);
  expect((await all(page, 'timerLog')).map((r) => r.id)).toEqual(['tl-test-1']);

  // a meditation row opens its session on the meditation page
  await main.locator('[data-row="med:fl-test-med"] button').click();
  await expect(page).toHaveURL(/#\/flow\/act\/meditation\/s\/fl-test-med$/);
  expect(errors).toEqual([]);
});
