// «Leere Reiter erklären» (Noah 07.11.2026 «3 ja», thread «UI-Test Analyse-Seite»): in a fresh app the tabs of
// Analyse say why they are empty and offer the next step; with a tick the overview shows its numbers again.
// German, phone + desktop; fictional data only; the clock stands on Friday 9 October 2026.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');

test('Analyse: empty tabs explain themselves and point to the next step', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/auswerten/analyse');
  await page.reload();
  await ready(page);

  // overview without data: a sentence, no tiles with zeros, two buttons
  const empty = page.locator('[data-empty]');
  await expect(empty).toBeVisible();
  await expect(page.locator('[data-overview]')).toHaveCount(0);
  await expect(empty).toContainText(T('Nothing ticked or recorded in these {n} days yet. Tick an activity in Aktiv or connect Fitbit or Strava, then the overview fills.|overview').split('{n}')[0]);
  await expect(empty.getByRole('link', { name: T('Open Aktiv') })).toBeVisible();
  await expect(empty.getByRole('link', { name: T('Connect Fitbit|analyse') })).toHaveAttribute('href', '#/me/fitbit');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  if (process.env.ANALYSE_SHOTS) await page.screenshot({ path: `qa/analyse/leer-ueberblick-${info.project.name}.png`, fullPage: true });

  // bikes without a bike
  await page.locator('[data-tab="velos"]').click();
  const bikes = page.locator('[data-empty]');
  await expect(bikes).toContainText(T('No bike yet|analyse'));
  await expect(bikes.getByRole('link', { name: T('Add a bike|analyse') })).toHaveAttribute('href', '#/bikes');
  await expect(bikes.getByRole('link', { name: T('Connect Strava|analyse') })).toBeVisible();
  if (process.env.ANALYSE_SHOTS) await page.screenshot({ path: `qa/analyse/leer-velos-${info.project.name}.png`, fullPage: true });

  // all values without data
  await page.locator('[data-tab="werte"]').click();
  const vals = page.locator('[data-empty]');
  await expect(vals.getByRole('link', { name: T('Connect Fitbit|analyse') })).toBeVisible();
  await expect(vals.getByRole('link', { name: T('Connect Strava|analyse') })).toBeVisible();
  await expect(vals.getByRole('link', { name: T('Open Aktiv') })).toBeVisible();
  if (process.env.ANALYSE_SHOTS) await page.screenshot({ path: `qa/analyse/leer-werte-${info.project.name}.png`, fullPage: true });

  // one tick: the overview shows its numbers again
  await put(page, { flowLog: [{ id: 'test_data_leer_1', actId: 'sauna', day: addDays(TODAY, -2), at: `${addDays(TODAY, -2)}T18:00:00+02:00`, min: 30 }] });
  await page.reload();
  await ready(page);
  await page.locator('[data-tab="ueberblick"]').click();
  await expect(page.locator('[data-overview]')).toBeVisible();
  expect(errors).toEqual([]);
});
