// Fix 14.10. «Heute abhaken»: on Today an activity ticks with one tap and unticks with the next, and
// «Rückgängig» takes back a tick and an untick. A quick double tap no longer saves two ticks (the tile
// then stayed ticked and «Rückgängig» seemed to do nothing). The commute and the challenge tile can be
// taken back too. The app seeds its own fictional activities; no personal data.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const D0 = '2026-10-09T07:52:00+02:00';
const DAY = '2026-10-09';

async function open(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/');
  await expect(page.locator('[data-section="flow"] [data-act="pushups"]')).toBeVisible();
  return errors;
}
const logOf = (page, actId) =>
  page.evaluate(async (id) => {
    const db = await new Promise((r) => {
      const q = indexedDB.open('pack-generator');
      q.onsuccess = () => r(q.result);
    });
    return new Promise((r) => {
      const q = db.transaction('flowLog').objectStore('flowLog').getAll();
      q.onsuccess = () => r(q.result.filter((e) => e.actId === id).map((e) => e.via ?? 'tap'));
    });
  }, actId);
// a tap with the finger on the phone, a click on the computer
const press = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());

test('Today: tick, untick with a second tap, tick again, «Rückgängig» after a tick and after an untick', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const push = page.locator('[data-section="flow"] [data-act="pushups"]');
  const toast = page.locator('.ftoast');
  const undo = toast.getByRole('button', { name: T('Undo') });
  await expect(push).toHaveAttribute('aria-pressed', 'false');

  await press(push, info);
  await expect(push).toHaveAttribute('aria-pressed', 'true');
  await expect(toast).toContainText(T('{name} · {n} ticked', { name: 'Liegestütze', n: 10 }));
  await press(push, info);
  await expect(push).toHaveAttribute('aria-pressed', 'false');
  await expect(toast).toContainText(T('{name} · taken back', { name: 'Liegestütze' }));
  await press(push, info);
  await expect(push).toHaveAttribute('aria-pressed', 'true');
  // «Rückgängig» after a tick
  await press(undo, info);
  await expect(push).toHaveAttribute('aria-pressed', 'false');
  await expect(toast).toHaveCount(0);
  expect(await logOf(page, 'pushups')).toEqual([]);

  // «Rückgängig» after an untick puts the tick back
  await press(push, info);
  await expect(push).toHaveAttribute('aria-pressed', 'true');
  await press(push, info);
  await expect(push).toHaveAttribute('aria-pressed', 'false');
  await press(undo, info);
  await expect(push).toHaveAttribute('aria-pressed', 'true');
  expect(await logOf(page, 'pushups')).toEqual(['tap']);
  expect(errors).toEqual([]);
});

test('Today: a quick double tap saves one tick, and one tap takes back two old ones', async ({ page, context }, info) => {
  await open(page, context);
  const push = page.locator('[data-section="flow"] [data-act="pushups"]');
  // two taps in the same moment: the second waits for the first and changes nothing
  await push.evaluate((b) => (b.click(), b.click()));
  await expect(push).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => logOf(page, 'pushups')).toEqual(['tap']);

  // two ticks saved before the fix (fictional): one tap takes both back, «Rückgängig» brings both again
  await page.evaluate(async (day) => {
    const db = await new Promise((r) => {
      const q = indexedDB.open('pack-generator');
      q.onsuccess = () => r(q.result);
    });
    await new Promise((r) => {
      const tx = db.transaction('flowLog', 'readwrite');
      tx.objectStore('flowLog').put({ id: 'fl-old-2', actId: 'pushups', day, at: `${day}T05:40:00.000Z`, n: 10 });
      tx.oncomplete = r;
    });
  }, DAY);
  await page.reload();
  await expect(push).toHaveAttribute('aria-pressed', 'true');
  expect(await logOf(page, 'pushups')).toEqual(['tap', 'tap']);
  await press(push, info);
  await expect(push).toHaveAttribute('aria-pressed', 'false');
  expect(await logOf(page, 'pushups')).toEqual([]);
  await press(page.locator('.ftoast').getByRole('button', { name: T('Undo') }), info);
  await expect(push).toHaveAttribute('aria-pressed', 'true');
  expect(await logOf(page, 'pushups')).toEqual(['tap', 'tap']);
});

test('Today: the commute ticks and is taken back with a tap on its line, both with «Rückgängig»', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const card = page.locator('[data-section="flow"]');
  const toast = page.locator('.ftoast');
  await press(card.getByRole('button', { name: T('Commute'), exact: true }), info);
  const line = card.getByRole('button', { name: T('{name} today: commute', { name: 'Velo draussen' }) });
  await expect(line).toHaveAttribute('aria-pressed', 'true');
  await press(line, info);
  await expect(card.getByRole('button', { name: T('Commute'), exact: true })).toBeVisible();
  await expect(toast).toContainText(T('{name} · taken back', { name: 'Velo draussen' }));
  expect(await logOf(page, 'bike')).toEqual([]);
  await press(toast.getByRole('button', { name: T('Undo') }), info);
  await expect(line).toBeVisible();
  expect(await logOf(page, 'bike')).toEqual(['commute']);
  expect(errors).toEqual([]);
});

test('Today: the challenge tile ticks and unticks, a quick double tap ticks once', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const tile = page.locator('[data-suggest]').filter({ hasText: T('Swim or sauna today?') });
  const tick = tile.locator('.tick');
  await expect(tick).toHaveAttribute('aria-pressed', 'false');
  await press(tick, info);
  await expect(tick).toHaveAttribute('aria-pressed', 'true');
  await press(tick, info);
  await expect(tick).toHaveAttribute('aria-pressed', 'false');
  await press(tick, info);
  await expect(tick).toHaveAttribute('aria-pressed', 'true');
  await press(tick, info);
  await expect(tick).toHaveAttribute('aria-pressed', 'false');
  await tick.evaluate((b) => (b.click(), b.click()));
  await expect(tick).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(tick).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});

const logCount = (page) =>
  page.evaluate(async () => {
    const db = await new Promise((r) => {
      const q = indexedDB.open('pack-generator');
      q.onsuccess = () => r(q.result);
    });
    return new Promise((r) => {
      const q = db.transaction('flowLog').objectStore('flowLog').count();
      q.onsuccess = () => r(q.result);
    });
  });

// 0.133.0: the same on the suggestion tiles of Aktiv › Activity and Meditation › More
for (const [where, hash, id] of [['Aktiv › Activity', '#/flow/activity', 'sg-aktiv'], ['Meditation › More', '#/flow/act/meditation/mehr', 'sg-med']]) {
  test(`${where}: the suggestion tile ticks and unticks, a quick double tap ticks once`, async ({ page, context }, info) => {
    const errors = await open(page, context);
    await page.goto(`./${hash}`);
    const tick = page.locator(`[data-suggest][aria-labelledby="${id}"] .tick`);
    await expect(tick).toHaveAttribute('aria-pressed', 'false');
    await press(tick, info);
    await expect(tick).toHaveAttribute('aria-pressed', 'true');
    await press(tick, info);
    await expect(tick).toHaveAttribute('aria-pressed', 'false');
    const before = await logCount(page);
    await tick.evaluate((b) => (b.click(), b.click()));
    await expect(tick).toHaveAttribute('aria-pressed', 'true');
    // a suggested activity is ticked in «Im Flow» too, but only once
    await expect.poll(() => logCount(page)).toBeLessThanOrEqual(before + 1);
    await press(tick, info);
    await expect(tick).toHaveAttribute('aria-pressed', 'false');
    await page.reload();
    await expect(tick).toHaveAttribute('aria-pressed', 'false');
    expect(errors).toEqual([]);
  });
}
