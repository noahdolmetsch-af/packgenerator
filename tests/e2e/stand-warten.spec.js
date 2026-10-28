// Paket A «Ehrlicher Stand im Alltag» part 1 (Noah 24.10.2026, 996 Ideen; 25.10 «mit A anfangen»): a to-do waits on
// something (Merken › «Wartet»), an own list ends without ticking every point, a goal ends as reached, changed or let
// go. Fictional data only (test_data_gtp_), the clock on Friday 9 October 2026 (home0460-fixture.js).
import { test, expect } from './clock.js';
import { openHome, homeFixture, tr, day } from './home0460-fixture.js';

const T = tr('de');
const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const setting = (page, key) =>
  page.evaluate((k) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction('settings').objectStore('settings').get(k);
      q.onsuccess = () => { r.result.close(); ok(q.result?.value); };
    };
  }), key);

function data() {
  const d = homeFixture();
  const put = (key, value) => {
    const row = d.tables.settings.find((x) => x.key === key);
    if (row) row.value = value;
    else d.tables.settings.push({ key, value });
  };
  [
    { key: 'merken', value: [{ id: 'td-1', text: 'test_data_gtp_ Offerte holen', due: day(-2), remind: null, repeat: null, list: null, created: `${day(-5)}T08:00:00.000Z`, doneAt: null }] },
    { key: 'merken.lists', value: [{ id: 'ls-1', name: 'test_data_gtp_ Umzug', check: true, pin: null, items: [{ id: 'p1', text: 'test_data_gtp_ Kisten', done: null, at: `${day(-3)}T08:00:00.000Z` }], created: `${day(-3)}T08:00:00.000Z` }] },
    { key: 'alltag.contracts', value: [{ id: 'ct-1', name: 'test_data_gtp_ Streaming', cost: 12, period: 'month', end: day(120), renew: 12, notice: 1, remind: 14, phone: '', number: '', travel: false, stopped: false, note: '' }] },
    { key: 'compass', value: { goals: [{ id: 'goal-1', title: 'test_data_gtp_ Alpenpass', due: day(60), at: `${day(-10)}T08:00:00.000Z`, steps: [], checks: [] }] } },
  ].forEach((x) => put(x.key, x.value));
  return d;
}

test('Merken: a to-do waits on an answer and comes back', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: data() });
  await page.goto('./#/calendar');
  const row = page.locator('button.tx', { hasText: 'test_data_gtp_ Offerte holen' }).first();
  await tap(row, info);
  const sheet = page.locator('dialog.todo');
  await tap(sheet.locator('[data-wait-on="answer"]'), info);
  await sheet.locator('[data-wait-note]').fill('test_data_gtp_ Werkstatt');
  await tap(sheet.getByRole('button', { name: T('Save') }), info);
  const wait = page.locator('[data-waiting-row="td-1"]');
  await expect(wait).toContainText(T('Waits on: {what}', { what: T('An answer') }));
  await expect(page.locator('[data-waiting-h]')).toHaveText(T('Waiting'));
  await expect(page.getByRole('heading', { name: T('Overdue') })).toHaveCount(0);
  expect(await noSideways(page)).toBe(0);
  await tap(wait.getByRole('button', { name: T('Not waiting any more') }), info);
  await expect(wait).toHaveCount(0);
  await expect(page.getByRole('heading', { name: T('Overdue') })).toBeVisible();
  expect(errors).toEqual([]);
});

test('A list ends without ticking every point, and opens again', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: data() });
  await page.goto('./#/calendar/list/ls-1');
  await tap(page.locator('[data-list-end-open]'), info);
  await tap(page.locator('[data-list-end-how="away"]'), info);
  await expect(page.locator('[data-list-reopen]')).toBeVisible();
  await expect.poll(async () => (await setting(page, 'merken.lists'))[0].ended?.how).toBe('away');
  await page.goto('./#/calendar');
  await expect(page.locator('a.mlrow')).toHaveCount(0);
  await tap(page.locator('[data-ended-lists]'), info);
  const ended = page.locator('[data-ended-list="ls-1"]');
  await expect(ended).toContainText(T('Put away'));
  await tap(ended.getByRole('button', { name: T('Open again') }), info);
  await expect(page.locator('a.mlrow')).toHaveCount(1);
  expect(await noSideways(page)).toBe(0);
});

test('A goal ends as let go, with a reason', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: data() });
  await page.goto('./#/me/compass');
  const goal = page.locator('[data-goal="goal-1"]');
  await tap(goal.locator('[data-goal-end-how="letgo"]'), info);
  await page.getByText(T('{n} goal finished', { n: 1 })).click();
  const end = page.locator('[data-goal="goal-1"] [data-goal-end="letgo"]');
  await end.getByLabel(T('Why')).fill('test_data_gtp_ passt nicht mehr');
  await tap(end.getByRole('button', { name: T('Save') }), info);
  await expect(end).toContainText('test_data_gtp_ passt nicht mehr');
  await expect.poll(async () => (await setting(page, 'compass')).goals[0].end).toMatchObject({ how: 'letgo', why: 'test_data_gtp_ passt nicht mehr' });
  expect(await noSideways(page)).toBe(0);
});

test('A cancellation in three steps: sent is not ended yet', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: data() });
  await page.goto('./#/me/alltag/abos');
  await tap(page.locator('[data-abo="test_data_gtp_ Streaming"] [data-abo-open]'), info);
  const dlg = page.getByRole('dialog');
  await tap(dlg.locator('[data-cancel-step="drafted"]'), info);
  await tap(dlg.locator('[data-cancel-step="sent"]'), info);
  await expect(dlg.locator('[data-cancel-steps]')).toContainText(T('Sent, but not confirmed yet: the reminder stays until the end is confirmed.'));
  await dlg.locator('[data-cancel-proof]').fill('test_data_gtp_ R 123');
  await dlg.locator('[data-cancel-proof]').blur();
  await tap(dlg.getByRole('button', { name: T('Save') }), info);
  const row = page.locator('[data-abo="test_data_gtp_ Streaming"]');
  await expect(row.locator('[data-cancel-state="sent"]')).toHaveText(T('Cancellation sent, confirmation missing'));
  await expect.poll(async () => (await setting(page, 'alltag.contracts'))[0]).toMatchObject({ stopped: false, cancel: { proof: 'test_data_gtp_ R 123' } });
  expect(await noSideways(page)).toBe(0);
});

test('Supplies: an opened pack with little left goes on Buy again', async ({ page, context }, info) => {
  const d = data();
  const food = d.tables.items.find((i) => i.category === 'food') ?? d.tables.items[0];
  Object.assign(food, { category: 'food', stock: 1, minStock: 1 });
  await openHome(page, context, info, { data: d });
  await page.goto('./#/gear/supplies');
  const buy = page.locator('section[aria-labelledby="buy-h"] li');
  await expect(page.locator(`[data-opened="${food.id}"]`)).toBeVisible();
  const before = await buy.count();
  const sel = page.locator(`[data-opened="${food.id}"]`);
  await sel.selectOption('little');
  await expect.poll(async () => (await page.evaluate((id) => new Promise((ok) => { const r = indexedDB.open('pack-generator'); r.onsuccess = () => { const q = r.result.transaction('items').objectStore('items').get(id); q.onsuccess = () => ok(q.result); }; }), food.id))?.opened).toBe('little');
  await expect(buy).toHaveCount(before + 1);
  expect(await noSideways(page)).toBe(0);
});

test('Woche: time before and after a date becomes its own entries', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: data() });
  await page.goto('./#/week');
  await tap(page.locator('[data-add="date"]'), info);
  const form = page.locator('[data-week-form]');
  await form.getByLabel(T('Date|week')).fill('test_data_gtp_ Zahnarzt');
  await form.getByLabel(T('Day')).fill(day(1));
  await form.getByLabel(T('Time')).fill('09:00');
  await form.locator('[data-buffer-before]').selectOption({ label: T('{n} min', { n: 30 }) });
  await form.locator('[data-buffer-after]').selectOption({ label: T('{n} min', { n: 15 }) });
  expect(await noSideways(page)).toBe(0);
  await tap(form.getByRole('button', { name: T('Save') }), info);
  const tomorrow = page.locator(`[data-day="${day(1)}"] [data-kind="date"]`);
  await expect(tomorrow.filter({ hasText: T('Before: {title} ({n} min)', { title: 'test_data_gtp_ Zahnarzt', n: 30 }) })).toContainText('08:30');
  await expect(tomorrow.filter({ hasText: T('After: {title} ({n} min)', { title: 'test_data_gtp_ Zahnarzt', n: 15 }) })).toHaveCount(1);
  await expect.poll(async () => ((await setting(page, 'week.items')) || []).length).toBe(3);
  expect(errors).toEqual([]);
});
