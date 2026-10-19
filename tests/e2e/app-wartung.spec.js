// «App-Wartung» (Noah 13.10.2026, BF4 BF7 BF8, built without mockups at his word), on a phone and a
// computer, in German, with a fixed clock in Europe/Zurich. Fictional data only.
// 1. A new version: the app keeps a copy before the updates; the news banner says so and leads to
//    Ich › Daten und Backup › «Vor Updates»; «Zurück zum Stand vor …» asks, then brings the old state back.
// 2. Ich › App-Wartung shows Strava's two bars from the stored numbers.
// 3. From 80 % one calm line on Heute (the long-press tip waits); × closes it for good.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { ready, settle } from './settle.js';
import { put } from './aktiv-fixture.js';
import { SEEN_KEY } from '../../src/lib/whatsnew.js';
import { INTRO_KEY } from '../../src/lib/home/introkt.js';
// src/lib/maintenance/snapshots.js (SNAP_DB, VERSION_KEY): not imported, it pulls in the app's Svelte state
const SNAP_DB = 'pack-generator-snapshots';
const VERSION_KEY = 'version';
import { RATE_KEY } from '../../src/lib/maintenance/rate.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const NOW = '2026-10-15T10:01:00+02:00';
const item = (id, name) => ({ id, name, category: 'elec', weightG: 50, qty: 1, ownership: 'owned', domains: ['bikepacking'], carry: 'luggage', sets: [], kits: [] });

async function open(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(NOW) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/');
  await ready(page);
  return errors;
}

const itemIds = (page) =>
  page.evaluate(
    () =>
      new Promise((res) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const g = r.result.transaction('items').objectStore('items').getAllKeys();
          g.onsuccess = () => (res(g.result.slice().sort()), r.result.close());
        };
      }),
  );

test('a copy before an update, the line in the news banner, and back to the state before', async ({ page, context }) => {
  const errors = await open(page, context);
  // the short intro of Heute comes once after an update and dims the page (tested in kacheln-antippbar.spec.js); off here
  await put(page, { items: [item('test_EL01', 'Test lamp'), item('test_EL02', 'Test charger')], settings: [{ key: INTRO_KEY, value: true }] });
  // simulate an update: this device last started an older version
  await page.evaluate(
    ({ name, key, seen }) =>
      new Promise((res, rej) => {
        localStorage.setItem(seen, '0.100.0');
        const r = indexedDB.open(name);
        r.onsuccess = () => {
          const tx = r.result.transaction('meta', 'readwrite');
          tx.objectStore('meta').put({ key, value: '0.100.0' });
          tx.oncomplete = () => (r.result.close(), res());
          tx.onerror = () => rej(tx.error);
        };
      }),
    { name: SNAP_DB, key: VERSION_KEY, seen: SEEN_KEY },
  );
  await page.reload();
  await settle(page, { sameTrips: false });

  const banner = page.locator('[data-news-banner]');
  await expect(banner.locator('[data-news-snapshot]')).toContainText(T('Your data was backed up before the update. Something wrong?'));
  await banner.getByRole('link', { name: T('Back to the state before the update') }).click();
  await expect(page).toHaveURL(/#\/me\/data\?at=before-updates$/);
  const sec = page.locator('[data-section="before-updates"]');
  await expect(sec.getByRole('heading', { name: T('Before updates') })).toBeVisible();
  const row = sec.locator('[data-snapshot="update"]');
  await expect(row).toHaveCount(1);
  await expect(row).toContainText(T('Version {v}', { v: '0.100' }));
  await expect(row).toContainText(new RegExp(T('{n} records', { n: '\\d+' })));

  // a change after the update, then back
  await put(page, { items: [item('test_EL03', 'Test cable')] });
  await row.getByRole('button').click();
  await sec.getByRole('dialog').getByRole('button', { name: T('Go back') }).click();
  await expect(sec.getByRole('status')).toBeVisible();
  await ready(page);
  const ids = await itemIds(page);
  expect(ids).toEqual(expect.arrayContaining(['test_EL01', 'test_EL02']));
  expect(ids).not.toContain('test_EL03');
  // the state before going back is kept, so it can be undone
  await expect(sec.locator('[data-snapshot="restore"]')).toHaveCount(1);
  // the switch is on by default
  await expect(sec.getByRole('switch', { name: T('Backup before every update') })).toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  expect(errors).toEqual([]);
});

const rate = { key: RATE_KEY, at: new Date(NOW).toISOString(), limit: [200, 2000], usage: [120, 400], readLimit: [100, 1000], readUsage: [85, 400] };

test('App maintenance shows the two Strava bars from the stored numbers', async ({ page, context }) => {
  const errors = await open(page, context);
  await put(page, { meta: [rate] });
  await page.goto('./#/me');
  await settle(page, { sameTrips: false });
  const card = page.locator('[data-section="maintenance"]');
  await expect(card.getByRole('heading', { name: T('App maintenance') })).toBeVisible();
  // Impeccable (18.10.2026, changed on purpose): folded on Ich, its head counts the hints (85 % of the
  // 15-minute limit and the AI key with 26 days left)
  await expect(card.locator('summary')).toContainText(T('{n} hints', { n: 2 }));
  await card.locator('summary').click();
  await expect(card.locator('[data-bar="short"]')).toContainText(T('{used} of {limit}', { used: 85, limit: 100 }));
  await expect(card.locator('[data-bar="daily"]')).toContainText(T('{used} of {limit}', { used: 400, limit: 1000 }));
  // the AI helper key from the start, 26 days left
  await expect(card.locator('[data-key="ai-helper"]')).toContainText(T('in {n} days', { n: 26 }));
  // offline: the check says «not checked», never an error
  await card.getByRole('button', { name: T('Check now') }).click();
  await expect(card.locator('[data-maint="links"]')).toContainText(T('not checked'));
  await expect(card.getByRole('switch', { name: T('Hint on Today when something is due') })).toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  expect(errors).toEqual([]);
});

test('from 80 % one calm line on Heute; × closes it and the long-press tip comes back', async ({ page, context }) => {
  const errors = await open(page, context);
  await put(page, { meta: [rate], settings: [{ key: 'strava.card', value: 'later' }] });
  await page.reload();
  await settle(page, { sameTrips: false });
  const hint = page.locator('[data-hint="maintenance"]');
  await expect(hint).toContainText(T('Strava requests: {pct} % of the free limit used', { pct: 85 }));
  await expect(page.locator('[data-hint="longpress"]')).toHaveCount(0); // one hint at a time
  await expect(page.locator('[data-hint]')).toHaveCount(1);
  await hint.getByRole('button', { name: T('Close the hint') }).click();
  await expect(hint).toHaveCount(0);
  await expect(page.locator('[data-hint="longpress"]')).toBeVisible();
  await page.reload();
  await settle(page, { sameTrips: false });
  await expect(page.locator('[data-hint="maintenance"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
