// Paket A «Ehrlicher Stand im Alltag» part 4 (Noah 24.10.2026, 996 Ideen; 25.10 «mit A anfangen»): small single ideas.
// A contract notes what it was used for, a shopping point names its plan, an impulse names its smallest start, the timer
// says what it runs for, a wish waits 30 days. Fictional data only (test_data_gtp_), the clock on Friday 9 October 2026
// (home0460-fixture.js).
import { test, expect } from '@playwright/test';
import { openHome, homeFixture, tr, day } from './home0460-fixture.js';

const T = tr('de');
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
  d.tables.settings.push({ key: 'alltag.contracts', value: [{ id: 'ct-1', name: 'test_data_gtp_ Streaming', cost: 12, period: 'month', end: day(120), renew: 12, notice: 1, remind: 14, phone: '', number: '', travel: false, stopped: false, note: '' }] });
  d.tables.items.push({ id: 'test_data_gtp_wish', name: 'test_data_gtp_ Tarp', category: 'sleep', weightG: 300, qty: 1, weightStatus: 'measured', carry: 'luggage', defaultBag: null, ownership: 'wishlist', role: null, sets: [], kits: [], domains: ['bikepacking'] });
  return d;
}

test('Contract: what it was used for, and the cost per use', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: data() });
  await page.goto('./#/me/alltag/abos');
  await tap(page.locator('[data-abo="test_data_gtp_ Streaming"] [data-abo-open]'), info);
  const sheet = page.getByRole('dialog');
  const log = sheet.locator('[data-use-log]');
  await log.locator('[data-use-what]').fill('test_data_gtp_ Film');
  await tap(log.locator('[data-use-add]'), info);
  await expect(log.locator('[data-use="test_data_gtp_ Film"]')).toBeVisible();
  await expect(log).toContainText('144.00');
  expect(await noSideways(page)).toBe(0);
  await tap(sheet.getByRole('button', { name: T('Save') }), info);
  await expect(page.locator('[data-use-per="ct-1"]')).toContainText('144.00');
  await expect.poll(async () => (await rows(page, 'settings')).find((s) => s.key === 'alltag.contracts')?.value?.[0]?.uses?.[0]?.what).toBe('test_data_gtp_ Film');
  expect(errors).toEqual([]);
});

test('Shopping: a point names its plan; when the plan is off its points go, with Undo', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: data() });
  await page.goto('./#/me/alltag/einkauf');
  for (const x of ['test_data_gtp_ Reis', 'test_data_gtp_ Milch']) {
    await page.locator('[data-shop-new]').fill(x);
    await page.locator('[data-shop-new]').press('Enter');
    await expect(page.locator(`[data-shop-item="${x}"]`)).toBeVisible();
  }
  await tap(page.locator('[data-shop-item="test_data_gtp_ Reis"] [data-shop-edit]'), info);
  await page.getByRole('dialog').locator('[data-field="for"]').fill('test_data_gtp_ Risotto');
  await tap(page.getByRole('dialog').getByRole('button', { name: T('Save') }), info);
  await expect(page.locator('[data-shop-item="test_data_gtp_ Reis"] [data-shop-for]')).toContainText('test_data_gtp_ Risotto');
  await tap(page.locator('[data-shop-use="test_data_gtp_ Risotto"] [data-shop-use-off]'), info);
  await tap(page.getByRole('dialog').getByRole('button', { name: T('Remove') }), info);
  await expect(page.locator('[data-shop-item="test_data_gtp_ Reis"]')).toHaveCount(0);
  await expect(page.locator('[data-shop-item="test_data_gtp_ Milch"]')).toBeVisible();
  await tap(page.getByRole('button', { name: T('Undo') }).last(), info);
  await expect(page.locator('[data-shop-item="test_data_gtp_ Reis"]')).toBeVisible();
  expect(await noSideways(page)).toBe(0);
  expect(errors).toEqual([]);
});

test('Impulses name their smallest start; the timer says what it runs for', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: data() });
  await page.goto('./#/me/frei/impulse');
  await expect(page.locator('[data-first]').first()).toContainText(T('Smallest start:'));

  await page.goto('./#/timer');
  await tap(page.locator('[data-act="go"]'), info);
  await page.locator('[data-timer-why]').fill('test_data_gtp_ Brot im Ofen');
  await page.locator('[data-timer-why]').blur();
  await page.goto('./#/me');
  await expect(page.locator('[data-timer-float]')).toContainText('test_data_gtp_ Brot im Ofen');
  expect(errors).toEqual([]);
});

test('A wish waits 30 days before buying', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: data() });
  await page.goto('./#/gear?view=wish');
  const pause = page.locator('[data-wish-pause="test_data_gtp_wish"]');
  await tap(pause.locator('[data-wish-wait]'), info);
  await expect(pause.locator('[data-wish-waiting]')).toBeVisible();
  await expect.poll(async () => (await rows(page, 'items')).find((i) => i.id === 'test_data_gtp_wish')?.wishPause).toBe(day(30));
  expect(await noSideways(page)).toBe(0);
  expect(errors).toEqual([]);
});
