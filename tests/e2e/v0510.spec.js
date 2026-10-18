// v0.51.0 «Im Flow – kleiner Start»: one tap ticks with Undo, a second tap takes it back, the long
// press picks the place, the countdown runs on a fake clock to its end, an activity is edited, the
// daily check answers four questions (v0.127.0: on its own page; WG: «Wi gaht's?» took it over). The app seeds its own fictional activities; no personal data.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const D0 = '2026-10-09T07:52:00+02:00';

async function open(page, context, hash = '#/flow', ready = '[data-act="meditation"]') {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`./${hash}`);
  await expect(page.locator(ready)).toBeVisible();
  return errors;
}

test('one tap ticks with Undo, a second tap takes it back', async ({ page, context }) => {
  const errors = await open(page, context);
  const med = page.locator('[data-act="meditation"]');
  await expect(med).toHaveAttribute('aria-pressed', 'false');
  // v0.86.0 «Meditation einfach»: a tap on Meditation opens its start sheet; «Nur abhaken» ticks as before
  await med.click();
  await page.locator('dialog[data-med-sheet][open] [data-tick-only]').click();
  await expect(page.locator('dialog[data-med-sheet][open]')).toHaveCount(0);
  await expect(med).toHaveAttribute('aria-pressed', 'true');
  const toast = page.locator('.ftoast');
  await expect(toast).toContainText(T('{name} ticked', { name: 'Meditation' }));
  await toast.getByRole('button', { name: T('Undo') }).click();
  await expect(med).toHaveAttribute('aria-pressed', 'false');

  // Liegestütze: one tap = 10, the daily goal is reached; tapping again takes it back
  const push = page.locator('[data-act="pushups"]');
  await push.click();
  await expect(toast).toContainText(T('{name} · {n} ticked', { name: 'Liegestütze', n: 10 }));
  // Design-Refresh P8: the goal grid left Aktiv (it lives on «Ziele»); the tile shows the goal reached
  await expect(push).toHaveAttribute('aria-pressed', 'true');
  await push.click();
  await expect(toast).toContainText(T('{name} · taken back', { name: 'Liegestütze' }));
  await expect(push).toHaveAttribute('aria-pressed', 'false');
  expect(errors).toEqual([]);
});

test('a long press picks the place: Yoga at home', async ({ page, context }) => {
  await open(page, context);
  await page.locator('[data-act="yoga"]').click({ button: 'right' });
  const sheet = page.locator('dialog[open]');
  await expect(sheet.getByRole('heading', { name: T('Tick {name}', { name: 'Yoga' }) })).toBeVisible();
  await sheet.getByRole('button', { name: 'Zuhause' }).click();
  await sheet.getByRole('button', { name: T('Tick off'), exact: true }).click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(page.locator('[data-act="yoga"]')).toHaveAttribute('aria-pressed', 'true');
  // the studio is still open, home is done: 1/2 (Design-Refresh P8: the goal rows live on «Ziele»)
  await page.goto('./#/flow/goals');
  await expect(page.locator('li[data-row="yoga"] .st')).toHaveText('1 / 2');
});

test('the countdown runs to its target on a fake clock, small it keeps running, then ticks', async ({ page, context }, info) => {
  await open(page, context);
  // KT: the «•••» of each activity names the stopwatch too; it opens the tick sheet, not the countdown
  await page.getByRole('button', { name: T('Stopwatch') }).and(page.locator(':not([data-more])')).first().click();
  const sheet = page.locator('dialog.tsheet[open]');
  await expect(sheet).toBeVisible();
  await sheet.getByRole('button', { name: 'Meditation', exact: true }).click();
  await sheet.getByRole('button', { name: '10', exact: true }).click();
  // from here the clock only moves when the test says so
  await page.clock.pauseAt(new Date(Date.parse(D0) + 60_000));
  await sheet.getByRole('button', { name: T('Start'), exact: true }).click();
  const time = sheet.locator('.time');
  await expect(time).toHaveText('10:00');
  await page.clock.runFor(78_000);
  await expect(time).toHaveText('8:42');
  // pause holds the time
  await sheet.getByRole('button', { name: T('Pause') }).click();
  await page.clock.runFor(120_000);
  await expect(time).toHaveText('8:42');
  await sheet.getByRole('button', { name: T('Continue') }).click();
  // small: it floats bottom right and keeps running
  await sheet.getByRole('button', { name: T('Make small, it keeps running') }).click();
  const mini = page.locator('.fmini');
  await expect(mini).toContainText('Meditation');
  await page.clock.runFor(60_000);
  await expect(mini).toContainText('7:42');
  // to the end: it stops at zero
  await page.clock.runFor(600_000);
  await expect(mini).toContainText(T('done ✓'));
  await mini.getByRole('button', { name: T('Open the stopwatch') }).click();
  await expect(sheet.locator('.time')).toHaveText('0:00');
  await expect(sheet).toContainText(T('Time is up ✓'));
  await sheet.getByRole('button', { name: T('Done · tick off') }).click();
  await page.clock.resume(); // the database tells the page through a timer
  await expect(page.locator('[data-act="meditation"]')).toHaveAttribute('aria-pressed', 'true');
  const min = await page.evaluate(async () => {
    const db = await new Promise((r) => {
      const q = indexedDB.open('pack-generator');
      q.onsuccess = () => r(q.result);
    });
    return new Promise((r) => {
      const q = db.transaction('flowLog').objectStore('flowLog').getAll();
      q.onsuccess = () => r(q.result.map((e) => [e.actId, e.min, e.via]));
    });
  });
  expect(min).toEqual([['meditation', 10, 'timer']]);
  info.annotations.push({ type: 'countdown', description: 'fake clock: 10:00 → 8:42 → pause → 7:42 → 0:00' });
});

test('editing an activity: name, goal and window', async ({ page, context }) => {
  await open(page, context, '#/flow/edit/stretch', 'h1');
  await expect(page.locator('h1')).toHaveText('Stretching + Mini-Workout');
  // v0.72.0 (Umbenennen 1a): the pencil at the title opens the one rename sheet, saved at once
  await page.getByRole('button', { name: T('Rename {name}', { name: 'Stretching + Mini-Workout' }) }).click();
  const rn = page.locator('dialog.rename[open]');
  await expect(rn.getByRole('textbox', { name: T('Name'), exact: true })).toBeFocused();
  await rn.getByRole('textbox', { name: T('Name'), exact: true }).fill('Mobility');
  await rn.getByRole('textbox', { name: T('Name'), exact: true }).press('Enter');
  await expect(rn).toHaveCount(0);
  await expect(page.locator('h1')).toHaveText('Mobility');
  await expect(page.getByRole('status').filter({ hasText: T('Renamed to "{name}".', { name: 'Mobility' }) })).toBeVisible();
  await page.getByRole('button', { name: T('One more|count') }).click();
  await expect(page.locator('.cnum')).toHaveText('4');
  await page.getByRole('button', { name: T('{n} days', { n: 10 }) }).click();
  await page.getByRole('button', { name: T('Save') }).click();
  await expect(page).toHaveURL(/#\/flow$/);
  await expect(page.locator('[data-act="stretch"]')).toContainText('Mobility');
  // Design-Refresh P8: the goal rows live on «Ziele»
  await page.goto('./#/flow/goals');
  const row = page.locator('li[data-row="stretch"]');
  await expect(row).toContainText('Mobility');
  await expect(row.locator('.st')).toHaveText('0 / 4');
});

// WG «Wi gaht's?» takes over the daily check: the row leads to «Wi gaht's?», its answers show as the numbers
test('WG the daily check (was «four taps on its page»): the row leads to «Wi gaht\'s?», its answers show on Today', async ({ page, context }) => {
  await open(page, context, '#/', '[data-section="flow"]');
  // v0.155.0 «Heute neu geordnet» (release analysis D3, changed on purpose): the round shows once on Heute, in
  // the day card (morning and evening); Im Flow leaves its row out. By day one tap on the clock shows it.
  await expect(page.locator('[data-check-entry]')).toHaveCount(0);
  const dk = page.locator('[data-daycard]');
  await dk.locator('[data-clock="morning"]').click();
  const card = dk.locator('[data-section="morningcheck"]');
  await expect(card).toContainText(T('Start|check'));
  await card.click();
  // Noah 18.10.2026 «1 a und b» (changed on purpose): the round leads to the morning page again
  await expect(page).toHaveURL(/#\/check\/morning$/);
  // «Wi gaht's?» started yesterday evening (fictional): the morning round is due on Today
  await page.evaluate(
    () =>
      new Promise((res) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const tx = r.result.transaction('settings', 'readwrite');
          tx.objectStore('settings').put({ key: 'abfragen', value: { since: '2026-10-08T21:00', q: {}, own: [] } });
          tx.oncomplete = () => (r.result.close(), res());
        };
      }),
  );
  await page.goto('./#/');
  const ab = page.locator('[data-section="abfragen"]');
  await ab.locator('[data-q="erholung.schlaf"]').getByRole('button', { name: '7', exact: true }).click();
  await ab.locator('[data-q="erholung.akku"]').getByRole('button', { name: '6', exact: true }).click();
  await ab.locator('[data-ab-save]').click();
  await dk.locator('[data-clock="morning"]').click();
  await expect(card.locator('[data-val]')).toHaveCount(3);
  await expect(card.locator('[data-val="sleep"]')).toContainText('7');
  await expect(card.locator('[data-val="energy"]')).toContainText('6');
  await expect(card.locator('[data-val="mood"]')).toContainText('–'); // asked at 13:00, not yet
});
