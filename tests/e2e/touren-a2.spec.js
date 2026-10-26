// Touren-Ideen 44, 45, 47, 49 (996 Ideen; Noah 26.10.2026 «1a 2b 3a 4b 5b») in the browser:
//   44 «Touren nebeneinander»: an own page; two trips, the overlapping days, gear owned too few times, open tasks.
//   45 «Sportart pro Tag»: one packing list; where the kind changes, «Beim Wechsel» says what to think of.
//   47 «Unklare Stellen»: a list with km; «Geklärt» ticks it off.
//   49 «Grenzübertritt»: own points per country, with a source.
// Fictional data only (test_data_gtp_), the clock on Friday 9 October 2026 (home0460-fixture.js).
import { test, expect } from '@playwright/test';
import { openHome, homeFixture, tr, trip, day, entries } from './home0460-fixture.js';

const T = tr('de');
const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

const A = 'test_data_gtp_Jura-B';
const B = 'test_data_gtp_See-B';

function data() {
  const d = homeFixture();
  d.tables.trips = [
    trip('Jura-B', day(3), { days: 3, entries: entries(6, 4) }),
    trip('See-B', day(4), { days: 3, entries: entries(3, 0), planB: { kind: 'train', note: '', route: null } }),
    trip('Tessin-B', day(20), { days: 2 }),
    ...d.tables.trips.filter((x) => x.status === 'done'),
  ];
  return d;
}

async function open(page, context, info, chosen = A) {
  await context.addInitScript((id) => localStorage.setItem('pack.currentTrip', id), chosen);
  return openHome(page, context, info, { data: data(), hour: 9 });
}

test('44 Trips side by side: overlap, shared gear, open tasks', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context, info);
  await page.goto('./#/trips');
  await tap(page.getByRole('link', { name: T('Trips side by side') }).first(), info);
  await expect(page).toHaveURL(/#\/trips\/compare/);
  await expect(page.locator('[data-page-title]')).toHaveText(T('Trips side by side'));
  await expect(page.locator(`[data-compare-trip="${A}"]`)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator(`[data-compare-trip="${B}"]`)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-compare-overlap]')).toContainText(T('{n} days overlap', { n: 2 }));
  await expect(page.locator('[data-compare-timeline] i.x')).toHaveCount(2);
  await expect(page.locator('[data-compare-short]')).toHaveCount(3);
  await expect(page.locator('[data-compare-short]').first()).toContainText(T('You own {have}, both trips together need {need}', { have: 1, need: 2 }));
  await expect(page.locator('[data-compare-row="pack"] td').first()).toHaveText(T('{n} of {m}', { n: 4, m: 6 }));
  await expect(page.locator('[data-compare-row="planb"] td').nth(1)).toHaveText(T('set'));
  expect(await noSideways(page)).toBe(0);

  // a third trip replaces the older pick: no day overlaps any more
  await tap(page.locator('[data-compare-trip="test_data_gtp_Tessin-B"]'), info);
  await expect(page.locator(`[data-compare-trip="${A}"]`)).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-compare-overlap="0"]')).toHaveText(T('No day overlaps.'));
  await expect(page.locator('[data-compare-short]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('45 47 49 Plan: sport per day, unclear spots, border points', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context, info);
  await page.goto('./#/pack');
  const card = page.locator('[data-tourprep]');
  await expect(card).toBeVisible();

  // 45: day 1 bike, day 2 hiking → «Beim Wechsel»
  const sports = card.locator('[data-prep-sports]');
  await tap(sports.locator('summary'), info);
  await tap(sports.locator('[data-prep-day="0"]').getByRole('button', { name: T('Bike|daysport') }), info);
  await tap(sports.locator('[data-prep-day="1"]').getByRole('button', { name: T('Hiking|daysport') }), info);
  await expect(sports.locator('[data-prep-day="1"]').getByRole('button', { name: T('Hiking|daysport') })).toHaveAttribute('aria-pressed', 'true');
  const change = sports.locator('[data-prep-change="1"]');
  await expect(change).toContainText(T('When it changes: day {a} → {b}', { a: 1, b: 2 }));
  await expect(change).toContainText(T('Park the bike: where, and until when?'));
  expect(await noSideways(page)).toBe(0);

  // 47: a question with km, then clarified
  const un = card.locator('[data-prep-unclear]');
  await tap(un.locator('summary'), info);
  await un.getByLabel(T('At km')).fill('42');
  await un.locator('[data-unclear-text]').fill('test_data_gtp_ Brücke offen?');
  await tap(un.getByRole('button', { name: T('Add') }), info);
  const row = un.locator('[data-unclear]').first();
  await expect(row).toContainText('km 42');
  await tap(row.getByRole('button', { name: T('Clarified: {name}', { name: 'test_data_gtp_ Brücke offen?' }) }), info);
  await expect(row).toHaveClass(/done/);
  await expect(un.locator('summary')).toContainText(T('{n} open', { n: 0 }));

  // 49: a country, a point with a source
  const bo = card.locator('[data-prep-border]');
  await tap(bo.locator('summary'), info);
  await bo.locator('[data-border-new]').fill('test_data_gtp_Land');
  await tap(bo.getByRole('button', { name: T('Add country') }), info);
  await expect(bo.locator('[data-border-shown="test_data_gtp_Land"]')).toBeVisible();
  const phoneArea = bo.locator('[data-border-area="phone"]');
  await phoneArea.locator('[data-border-text="phone"]').fill('test_data_gtp_ Roaming an');
  await phoneArea.getByLabel(T('Source: {area}', { area: T('Phone network') })).fill('test_data_gtp_ Vertrag');
  await tap(phoneArea.getByRole('button', { name: T('Add') }), info);
  await expect(phoneArea.locator('[data-border-point]')).toContainText(T('Source: {src}', { src: 'test_data_gtp_ Vertrag' }));
  await tap(phoneArea.getByRole('button', { name: T('Done: {name}', { name: 'test_data_gtp_ Roaming an' }) }), info);
  await expect(phoneArea.locator('[data-border-point]')).toHaveClass(/done/);
  expect(await noSideways(page)).toBe(0);
  expect(errors).toEqual([]);
});
