// Paket B «Touren ohne Überraschung» part 3 (Noah 24.10.2026, 996 Ideen «1b»): the small ideas for the bike shop and
// the door. Workshop order with a cost limit, a refund on a visit, the handover after a sale, a problem like an earlier
// one, the last look at the door on the start morning. Fictional data only (test_data_gtp_), the clock on Friday
// 9 October 2026 (home0460-fixture.js), every outside address blocked.
import { test, expect } from '@playwright/test';
import { openHome, homeFixture, tr, day } from './home0460-fixture.js';

const T = tr('de');
const BIKE = 'bike-test';
const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const rows = (page, name) =>
  page.evaluate((n) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(n).objectStore(n).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);

function data() {
  const d = homeFixture();
  d.tables.visits = [{ id: 'test_data_gtp_v1', bikeId: BIKE, date: day(-30), shop: 'test_data_gtp_ Werkstatt', invoice: null, km: null, totalChf: 180, parts: [{ part: 'chain', action: 'replace', chf: 180 }], photos: [], source: 'Today' }];
  const p = (id, task, status, logDate, extra = {}) => ({ id, area: 'Bike', bikeId: BIKE, subject: 'test_data_gtp_ Scale', task, category: 'Repair', source: 'Problem', logDate, priority: 'medium', status, note: '', fix: 'self', beforeRide: false, done: status === 'done', ...extra });
  d.tables.maintenance = [p(1, 'test_data_gtp_ Kette springt am Berg', 'done', day(-90), { statusDate: day(-85), note: 'test_data_gtp_ Kettenblatt ersetzt' }), p(2, 'test_data_gtp_ Kette springt wieder', 'open', day(-2), { fix: 'shop' })];
  return d;
}

test('Werkstatt: cost limit in the order, a refund on the visit, a problem seen before', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: data() });

  // a problem like an earlier one points to it, with what was done then
  await page.goto(`./#/bikes?tab=care&bike=${BIKE}&open=1`);
  const seen = page.locator('[data-repair-id="2"] [data-similar]').first();
  await expect(seen).toContainText('test_data_gtp_ Kette springt am Berg');
  await expect(seen).toContainText('test_data_gtp_ Kettenblatt ersetzt');

  // the visit: a refund apart from what was paid
  await page.goto('./#/bikes?tab=shop');
  await tap(page.locator('.lrow[data-visit-id="test_data_gtp_v1"]'), info);
  const visit = page.getByRole('dialog').filter({ has: page.locator('[data-refund]') });
  await tap(visit.locator('[data-refund-add]'), info);
  await visit.locator('[data-refund-chf]').fill('80');
  await visit.locator('[data-refund-chf]').blur();
  await visit.locator('[data-refund-from]').fill('test_data_gtp_ Versicherung');
  await visit.locator('[data-refund-from]').blur();
  await expect(visit.locator('[data-refund-sum]')).toContainText(T('Still open: CHF {chf}', { chf: '80.00' }));
  await tap(visit.locator('[data-refund-got]'), info);
  await expect(visit.locator('[data-refund-sum]')).toContainText(T('Your own cost: CHF {chf}', { chf: '100.00' }));
  await expect.poll(async () => (await rows(page, 'visits')).find((v) => v.id === 'test_data_gtp_v1')?.refund).toEqual({ chf: 80, from: 'test_data_gtp_ Versicherung', got: true });
  expect(await noSideways(page)).toBe(0);
  await page.keyboard.press('Escape');

  // the order: at most CHF 250 and «call first» go into the message, and stay for the next order
  const share = page.getByRole('button', { name: T('Share the order') });
  {
    await tap(share, info);
    const order = page.getByRole('dialog').filter({ has: page.locator('[data-cost-limit]') });
    await order.locator('[data-cost-limit-chf]').fill('250');
    await order.locator('[data-cost-limit-chf]').blur();
    await tap(order.locator('[data-cost-limit-call]'), info);
    await expect(order.locator('textarea')).toHaveValue(/höchstens CHF 250\..*vorher an/);
    expect(await noSideways(page)).toBe(0);
    await expect.poll(async () => (await rows(page, 'settings')).find((s) => s.key === 'werkstatt')?.value?.[BIKE]).toEqual({ limit: 250, call: true });
  }
  expect(errors).toEqual([]);
});

test('Werkstatt: the handover after the sale, own steps with Undo', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: data() });
  await page.goto(`./#/bikes?tab=care&view=sell&bike=${BIKE}`);
  const ho = page.locator('[data-handover]');
  await expect(ho.getByRole('heading', { name: T('Handover') })).toBeVisible();
  await tap(ho.locator('[data-handover-step="keys"] button').first(), info);
  await expect(ho.locator('[data-handover-step="keys"] button').first()).toHaveAttribute('aria-pressed', 'true');
  await ho.getByLabel(T('Add own step')).fill('test_data_gtp_ Flaschenhalter ab');
  await tap(ho.getByRole('button', { name: T('Add') }), info);
  const own = ho.locator('[data-handover-step^="own-"]');
  await expect(own).toContainText('test_data_gtp_ Flaschenhalter ab');
  await tap(own.getByRole('button', { name: T('Delete «{name}»', { name: 'test_data_gtp_ Flaschenhalter ab' }) }), info);
  await tap(page.getByRole('dialog').getByRole('button', { name: T('Delete') }), info);
  await expect(own).toHaveCount(0);
  await tap(page.getByRole('button', { name: T('Undo') }).last(), info);
  await expect(own).toHaveCount(1);
  expect(await noSideways(page)).toBe(0);
  expect(errors).toEqual([]);
});

test('Last look at the door on the start morning', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.addInitScript(() => localStorage.setItem('pack.currentTrip', 'test_data_gtp_TEST-Runde'));
  await openHome(page, context, info, { data: data() });
  await page.goto('./#/ride');
  const door = page.locator('[data-door-check]');
  await expect(door).toBeVisible();
  await tap(door.locator('[data-door-open]'), info);
  await expect(door.locator('[data-door-step="bottles"]')).toBeVisible();
  await tap(door.locator('[data-door-step="keys"] button'), info);
  await expect(door.locator('[data-door-step="keys"] button')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => (await rows(page, 'trips')).find((x) => x.id === 'test_data_gtp_TEST-Runde')?.door?.steps?.keys?.r).toBe('ok');
  expect(await noSideways(page)).toBe(0);
  expect(errors).toEqual([]);
});
