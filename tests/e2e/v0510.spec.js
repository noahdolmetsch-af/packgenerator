// v0.51.0 «Im Flow – kleiner Start»: one tap ticks with Undo, a second tap takes it back, the long
// press picks the place, the countdown runs on a fake clock to its end, an activity is edited, the
// daily check answers four questions. The app seeds its own fictional activities; no personal data.
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
  await med.click();
  await expect(med).toHaveAttribute('aria-pressed', 'true');
  const toast = page.locator('.ftoast');
  await expect(toast).toContainText(T('{name} ticked', { name: 'Meditation' }));
  await toast.getByRole('button', { name: T('Undo') }).click();
  await expect(med).toHaveAttribute('aria-pressed', 'false');

  // Liegestütze: one tap = 10, the daily goal is reached; tapping again takes it back
  const push = page.locator('[data-act="pushups"]');
  await push.click();
  await expect(toast).toContainText(T('{name} · {n} ticked', { name: 'Liegestütze', n: 10 }));
  await expect(page.locator('tr[data-row="pushups"] td.today')).toHaveClass(/done/);
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
  // the studio is still open, home is done: 1/2
  await expect(page.locator('tr[data-row="yoga"] .st')).toHaveText('1/2');
});

test('the countdown runs to its target on a fake clock, small it keeps running, then ticks', async ({ page, context }, info) => {
  await open(page, context);
  await page.getByRole('button', { name: T('Stopwatch') }).first().click();
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
  const row = page.locator('tr[data-row="stretch"]');
  await expect(row).toContainText('Mobility');
  await expect(row.locator('.st')).toHaveText('0/4');
  await expect(page.locator('[data-act="stretch"]')).toContainText('Mobility');
});

test('the daily check: four taps, then it closes and Today shows the numbers', async ({ page, context }) => {
  await open(page, context, '#/');
  const card = page.locator('[data-section="flow"]');
  await card.getByRole('button', { name: T('Start|check') }).click();
  const dlg = page.locator('dialog.check[open]');
  for (const [k, v] of [['sleep', 7], ['energy', 6], ['mood', 8], ['extra', 5]]) await dlg.locator(`#chk-${k} .sv`).nth(v - 1).click();
  await page.clock.runFor(1000);
  await expect(page.locator('dialog.check[open]')).toHaveCount(0);
  await expect(card.locator('.nums')).toContainText('7');
  await expect(card.locator('.nums li')).toHaveCount(4);
});
