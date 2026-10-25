// Paket A «Ehrlicher Stand im Alltag», last single ideas (Noah 25.10.2026 «bitte umsetzten und fortfahren»):
// a webcam says what it is for, a birthday carries small steps, a person carries ideas for an invitation,
// clothing gets repair jobs, a wish can be borrowed first. Fictional data only (test_data_gtp_), the clock on
// Friday 9 October 2026 (home0460-fixture.js).
import { test, expect } from '@playwright/test';
import { openHome, homeFixture, tr, day } from './home0460-fixture.js';

const T = tr('de');
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
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
const setting = async (page, key) => (await rows(page, 'settings')).find((s) => s.key === key)?.value;

function data() {
  const d = homeFixture();
  const set = (key, value) => {
    const row = d.tables.settings.find((x) => x.key === key);
    if (row) row.value = value;
    else d.tables.settings.push({ key, value });
  };
  set('merken', [{ id: 'test_data_gtp_bd', kind: 'birthday', area: 'birthday', text: 'test_data_gtp_ Mia', bday: { md: day(5).slice(5), year: 1990 }, gift: 'test_data_gtp_ Buch', contact: 'call', created: `${day(-5)}T08:00:00Z`, doneAt: null }]);
  set('alltag.people', [{ id: 'pe-1', name: 'test_data_gtp_ Alex', n: 1, unit: 'month', seen: day(-60), off: false, note: '', ideas: ['test_data_gtp_ Kaffee am See', 'test_data_gtp_ Velotour'] }]);
  d.tables.items.push(
    { id: 'test_data_gtp_jacke', name: 'test_data_gtp_ Jacke', category: 'onbike', weightG: 300, qty: 1, weightStatus: 'measured', carry: 'worn', defaultBag: null, ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'] },
    { id: 'test_data_gtp_wish', name: 'test_data_gtp_ Tarp', category: 'sleep', weightG: 300, qty: 1, weightStatus: 'measured', carry: 'luggage', defaultBag: null, ownership: 'wishlist', role: null, sets: [], kits: [], domains: ['bikepacking'] },
  );
  return d;
}

test('Webcams: what each one is for, and a tidy round for the ones not opened for long', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: data() });
  await context.route(/cams\.example/, (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PNG }));
  // webcams stay on this device (DEVICE_SETTINGS), so they are not in a backup: written here directly
  await page.evaluate((cams) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const tx = r.result.transaction('settings', 'readwrite');
      tx.objectStore('settings').put({ key: 'webcams', value: cams });
      tx.oncomplete = () => { r.result.close(); ok(); };
    };
  }), [
    { id: 'wc-1', name: 'test_data_gtp_ Pass', url: 'https://cams.example/pass.jpg', home: false },
    { id: 'wc-2', name: 'test_data_gtp_ Alt', url: 'https://cams.example/alt.jpg', home: false, seen: day(-200) },
  ]);
  await page.goto('./#/wetter');
  const cam = page.locator('[data-webcam]').first();
  await tap(cam.locator('[data-webcam-why-edit]'), info);
  const sheet = page.getByRole('dialog');
  await sheet.locator('input').fill('test_data_gtp_ Schneefallgrenze');
  await tap(sheet.getByRole('button', { name: T('Save') }), info);
  await expect(page.locator('[data-webcam-why]').first()).toContainText('test_data_gtp_ Schneefallgrenze');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  // the rename sheet closes after a save too (it stayed open before, showing the storage key)
  await tap(cam.locator('[data-webcam-rename]'), info);
  await page.getByRole('dialog').locator('input').fill('test_data_gtp_ Passhöhe');
  await tap(page.getByRole('dialog').getByRole('button', { name: T('Save') }), info);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(cam).toContainText('test_data_gtp_ Passhöhe');
  const stale = page.locator('[data-webcam-stale]');
  await expect(stale.locator('summary')).toContainText('(1)');
  await tap(stale.locator('summary'), info);
  await tap(stale.locator('[data-webcam-keep]'), info);
  await expect(stale).toHaveCount(0);
  await expect.poll(async () => (await setting(page, 'webcams'))?.find((c) => c.id === 'wc-2')?.seen).toBe(day(0));
  expect(await noSideways(page)).toBe(0);
  expect(errors).toEqual([]);
});

test('Birthday: the small steps for this year tick off in Remember', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: data() });
  await page.goto('./#/calendar');
  const plan = page.locator('[data-bday-plan="test_data_gtp_bd"]');
  await expect(plan.locator('[data-bday-step]')).toHaveCount(2);
  await tap(plan.locator('[data-bday-step="gift"]'), info);
  await expect(plan.locator('[data-bday-step="gift"]')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => (await setting(page, 'merken'))?.[0]?.bdone?.gift).toBe(Number(day(5).slice(0, 4)));
  expect(await noSideways(page)).toBe(0);
  expect(errors).toEqual([]);
});

test('People: an idea together turns the reminder into an invitation, and moves on after meeting', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  await openHome(page, context, info, { data: data() });
  await page.goto('./#/me/alltag/menschen');
  const row = page.locator('[data-person="test_data_gtp_ Alex"]');
  await expect(row.locator('[data-person-idea]')).toContainText('test_data_gtp_ Kaffee am See');
  await tap(row.locator('[data-person-invite]'), info);
  await tap(row.locator('[data-person-seen]'), info);
  await expect(row.locator('[data-person-idea]')).toContainText('test_data_gtp_ Velotour');
  await expect(row.locator('[data-person-invite]')).toHaveCount(0);
  expect(await noSideways(page)).toBe(0);
  expect(errors).toEqual([]);
});

test('Clothing: a repair job instead of sorting out, ticked and deleted with Undo', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: data() });
  await page.goto('./#/gear?item=test_data_gtp_jacke');
  const fold = page.locator('details[data-fold="repair"]');
  await fold.locator('summary').click();
  await tap(fold.locator('[data-repair-suggest]').nth(1), info);
  const job = fold.locator(`[data-repair="${T('Replace the zip')}"]`);
  await expect(job).toBeVisible();
  await job.locator('[data-repair-tick]').check();
  await expect.poll(async () => (await rows(page, 'items')).find((i) => i.id === 'test_data_gtp_jacke')?.repairs?.[0]?.done).toBe(day(0));
  await tap(job.locator('[data-repair-del]'), info);
  await tap(page.getByTestId('ask-delete').locator('.btn.del'), info);
  await expect(job).toHaveCount(0);
  await tap(page.getByRole('button', { name: T('Undo') }).last(), info);
  await expect(job).toBeVisible();
  expect(await noSideways(page)).toBe(0);
  expect(errors).toEqual([]);
});

test('Wish: borrow first, then a reasoned decision', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: data() });
  await page.goto('./#/gear?item=test_data_gtp_wish');
  const fold = page.locator('details[data-fold="trial"]');
  await fold.locator('summary').click();
  await fold.locator('[data-trial-from]').fill('test_data_gtp_ Verleih');
  await fold.locator('[data-trial-until]').fill(day(3));
  await tap(fold.locator('[data-trial-start]'), info);
  await expect(fold.locator('[data-trial-running]')).toContainText('test_data_gtp_ Verleih');
  await tap(fold.locator('[data-trial-decide]'), info);
  await fold.locator('[data-trial-why]').fill('test_data_gtp_ zu schwer');
  await tap(fold.locator('[data-trial-no]'), info);
  await expect(fold.locator('[data-trial-verdict="no"]')).toContainText('test_data_gtp_ zu schwer');
  await expect.poll(async () => (await rows(page, 'items')).find((i) => i.id === 'test_data_gtp_wish')?.trial?.verdict).toBe('no');
  expect(await noSideways(page)).toBe(0);
  expect(errors).toEqual([]);
});
