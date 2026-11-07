// UI-Prüfung 07.11.2026 T2 «Vier Wege auf der Tourkarte»: the card of a planned trip leads to Packen, Wetter (of this
// trip) and Form; «n warten auf deinen Rückblick» shows those trips. Fictional fixture (test_data_gtp_), German,
// phone + desktop, no horizontal scroll. Outside hosts are blocked: the page does not need the weather service.
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle, settle } from './settle.js';
import { openShort } from './kurz-open.js';

const FIX = fileURLToPath(new URL('../fixtures/gesamttest/test_data_gtp_daten.json', import.meta.url));
const TODAY = '2026-10-13';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const wide = (page) => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);

async function start(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.clock.setFixedTime(new Date(`${TODAY}T10:00:00+02:00`));
  await page.goto('./');
  await importAndSettle(page, FIX);
  await page.reload();
  await settle(page);
}

test('Touren: a planned card has Packen, Wetter and Form; the Wetter way opens the weather of this trip', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context);
  await page.goto('./#/trips');
  await openShort(page);
  const card = page.locator('section[data-planned] li.pc[data-trip="test_data_gtp_trip27"]');
  const ways = card.locator('[data-plan-ways]');
  await expect(ways).toBeVisible();
  await expect(ways.getByRole('link', { name: T('Form|tripway') })).toHaveAttribute('href', '#/flow/form');
  const weather = ways.getByRole('link', { name: T('Weather|tripway') });
  await expect(weather).toHaveAttribute('href', '#/wetter?trip=test_data_gtp_trip27');
  // Packen is there unless the card already says «wird gepackt · Packen öffnen» (the same way, said once)
  const pack = ways.locator('[data-way="pack"]');
  const inPm = card.locator('[data-in-pack-mode]');
  expect((await pack.count()) + (await inPm.count())).toBe(1);
  expect(await wide(page)).toBeLessThanOrEqual(0);
  await weather.click();
  await expect(page).toHaveURL(/#\/wetter\?trip=test_data_gtp_trip27/);
  await expect(page.locator('[data-page="wetter"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('Touren: «n warten auf deinen Rückblick» shows only those trips', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context);
  await page.goto('./#/trips');
  await openShort(page);
  const go = page.locator('[data-counts] [data-waiting-go]');
  await expect(go).toBeVisible();
  await go.click();
  const done = page.locator('section[data-finished]');
  await expect(done).toBeVisible();
  const rows = done.locator('[data-trip-list] li[data-row]');
  await expect(rows.first()).toBeVisible();
  await expect(done.locator('[data-trip-list] li[data-row]:not([data-state="done"])')).toHaveCount(0);
  expect(await rows.count()).toBeGreaterThan(0);
  expect(await wide(page)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});
