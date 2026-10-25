// Paket B «Touren ohne Überraschung» part 1 (Noah 24.10.2026, 996 Ideen «1b 2a»): the dress rehearsal from a week
// before the start (Packen › «Generalprobe», #/trip/<id>/probe), «Gut ankommen» after a trip (#/trip/<id>/heim) and
// the box labels with a QR code (Werkzeugkasten › Kisten-Etiketten). Fictional data only (test_data_gtp_), the
// clock on Friday 9 October 2026 (home0460-fixture.js), every outside address blocked.
import { test, expect } from '@playwright/test';
import { openHome, homeFixture, tr, trip, day } from './home0460-fixture.js';

const T = tr('de');
const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const SOON = 'test_data_gtp_Probe-Tour';
const BACK = 'test_data_gtp_Heim-Tour';

function data() {
  const d = homeFixture();
  d.tables.trips = [trip('Probe-Tour', day(4), { days: 3 }), trip('Heim-Tour', day(-3), { days: 2 }), ...d.tables.trips];
  return d;
}

test('Generalprobe: the row in Packen, answers, a gap becomes a to-do, own steps', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.addInitScript((id) => localStorage.setItem('pack.currentTrip', id), SOON);
  await openHome(page, context, info, { data: data() });
  await page.goto('./#/pack');
  const row = page.locator('[data-probe-row="probe"]').first();
  await expect(row).toContainText(T('Dress rehearsal'));
  await tap(row, info);
  await expect(page).toHaveURL(/#\/trip\/test_data_gtp_Probe-Tour\/probe$/);
  const pr = page.locator('[data-probe="probe"]');
  await expect(pr.getByRole('heading', { level: 1 })).toContainText(T('Dress rehearsal'));
  // a bike trip of 3 days: every standard step except the country info (at home)
  await expect(pr.locator('[data-step]')).toHaveCount(8);
  expect(await noSideways(page)).toBe(0);

  // «Klappt», then a gap that becomes a to-do
  const off = pr.locator('[data-step="offline"]');
  await tap(off.getByRole('button', { name: T('Works') }), info);
  await expect(off).toHaveAttribute('data-r', 'ok');
  const sos = pr.locator('[data-step="sos"]');
  await tap(sos.getByRole('button', { name: T('Gap') }), info);
  await tap(sos.locator('[data-remember]'), info);
  await expect(sos.locator('[data-todo]')).toBeVisible();
  // a second tap on «Klappt» clears it again
  await tap(off.getByRole('button', { name: T('Works') }), info);
  await expect(off).toHaveAttribute('data-r', 'open');

  // an own step: add, rename, delete with Undo
  await pr.getByLabel(T('Add own step')).fill('test_data_gtp_ Pflanzen giessen');
  await tap(pr.getByRole('button', { name: T('Add') }), info);
  const own = pr.locator('[data-step^="own-"]');
  await expect(own).toContainText('test_data_gtp_ Pflanzen giessen');
  await tap(own.getByRole('button', { name: T('Rename «{name}»', { name: 'test_data_gtp_ Pflanzen giessen' }) }), info);
  await own.getByLabel(T('Name of the step')).fill('test_data_gtp_ Pflanzen');
  await tap(own.getByRole('button', { name: T('Save') }), info);
  await expect(own).toContainText('test_data_gtp_ Pflanzen');
  await tap(own.getByRole('button', { name: T('Delete «{name}»', { name: 'test_data_gtp_ Pflanzen' }) }), info);
  await tap(page.getByRole('dialog').getByRole('button', { name: T('Delete') }), info);
  await expect(own).toHaveCount(0);

  // after a reload the answers are still there, and the to-do waits in Merken
  await page.reload();
  await expect(page.locator('[data-step="sos"]')).toHaveAttribute('data-r', 'gap');
  const todos = await page.evaluate(async () => {
    const req = indexedDB.open('pack-generator');
    const db = await new Promise((r) => (req.onsuccess = () => r(req.result)));
    const row = await new Promise((r) => { const g = db.transaction('settings').objectStore('settings').get('merken'); g.onsuccess = () => r(g.result); });
    return (row?.value ?? []).filter((x) => x.src === 'probe:test_data_gtp_Probe-Tour').map((x) => x.due);
  });
  expect(todos).toEqual([day(3)]);
  expect(errors).toEqual([]);
});

test('Gut ankommen: the page after a trip, done and later', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: data() });
  await page.goto(`./#/trip/${BACK}/ended`);
  const row = page.locator('[data-probe-row="heim"]');
  await expect(row).toContainText(T('Arrive well'));
  await tap(row, info);
  const pr = page.locator('[data-probe="heim"]');
  await expect(pr.getByRole('heading', { level: 1 })).toContainText(T('Arrive well'));
  await expect(pr.locator('[data-step="dry"]')).toBeVisible();
  await tap(pr.locator('[data-step="laundry"]').getByRole('button', { name: T('Done|homestep') }), info);
  await expect(pr.locator('[data-step="laundry"]')).toHaveAttribute('data-r', 'ok');
  await tap(pr.locator('[data-step="giveback"]').getByRole('button', { name: T('Later') }), info);
  await expect(pr.locator('[data-step="giveback"] [data-remember]')).toBeVisible();
  expect(await noSideways(page)).toBe(0);
  expect(errors).toEqual([]);
});

test('Kisten-Etiketten: add a box, put things in, its QR code opens it', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: data() });
  await page.goto('./#/me/tools/labels');
  await page.locator('[data-box-new]').fill('test_data_gtp_ Winterkiste');
  await tap(page.getByRole('button', { name: T('Add box|labels') }), info);
  await tap(page.locator('[data-boxes] .lbl-main', { hasText: 'test_data_gtp_ Winterkiste' }), info);
  await expect(page).toHaveURL(/#\/me\/tools\/labels\?box=box-/);
  const one = page.locator('[data-box]');
  await expect(one.locator('svg.qr').first()).toBeVisible();
  await one.locator('[data-box-put]').fill('test_data_gtp_ Lichterkette');
  await tap(one.getByRole('button', { name: T('Put in') }), info);
  await expect(one.locator('[data-box-inside]')).toContainText('test_data_gtp_ Lichterkette');
  expect(await noSideways(page)).toBe(0);
  // the address of the QR code opens the box straight away
  const url = page.url();
  await page.goto('./#/me/tools');
  await page.goto(url);
  await expect(page.locator('[data-box-inside]')).toContainText('test_data_gtp_ Lichterkette');
  expect(errors).toEqual([]);
});
